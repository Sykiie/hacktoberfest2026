import express from "express";
import QRCode from "qrcode";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAdminAuth, isAdminLoopbackRequest } from "./auth.js";
import { getPrivateIPv4Interfaces } from "./network.js";
import { createJoinPayload } from "./join.js";
import { createUserAuth } from "./user-auth.js";
import { createCommunityStore } from "./community-store.js";
import { createNoteboardStore } from "./noteboard-store.js";
import { createVenueCommunityStore } from "./venue-community-store.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(currentDir, "..");

function closeServer(server) {
  if (!server?.listening) return Promise.resolve();
  return new Promise((resolve) => server.close(() => resolve()));
}

function listenServer(server, port, address) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve(server);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, address);
  });
}

export async function createHostServer({
  port = Number(process.env.PORT || 3000),
  dataDirectory = process.env.LOCAL_COMMUNITY_DATA_DIR || path.join(projectDir, "data"),
  interfacesProvider = () => os.networkInterfaces(),
  qrEncoder = (url) => QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 1, width: 240 }),
} = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  const auth = createAdminAuth(path.join(dataDirectory, "owner.json"));
  await auth.load();
  await auth.initializeDefault();
  const userAuth = createUserAuth(path.join(dataDirectory, "users.json"));
  await userAuth.load();
  const community = createCommunityStore(path.join(dataDirectory, "community.json"));
  await community.load();
  const venueCommunity = createVenueCommunityStore(path.join(dataDirectory, "venue-community.json"));
  await venueCommunity.load();
  const noteboard = createNoteboardStore({ boardFile: path.join(dataDirectory, "noteboard.json"), auditFile: path.join(dataDirectory, "noteboard-audit.json") });
  await noteboard.load();

  const app = express();
  const lanListeners = new Map();
  const feedEventClients = new Set();
  let loopbackListener;
  let activePort = port;
  let hostingEnabled = false;
  let hostingTransition = false;
  let communityDeleting = false;
  let refreshTimer;
  let noteboardTimer;

  app.disable("x-powered-by");
  app.use(express.json({ limit: "8kb" }));

  function requireLoopback(request, response, next) {
    if (!isAdminLoopbackRequest(request)) return response.status(404).end();
    next();
  }

  function requireOwner(request, response, next) {
    if (!auth.isAuthenticated(request)) return response.status(401).json({ error: "Sign in to manage hosting." });
    next();
  }

  function sendCommunityError(response, error, fallback) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    response.status(status).json({ error: status < 500 ? error.message : fallback });
  }

  function broadcastFeedChanged() {
    for (const response of feedEventClients) {
      if (response.destroyed || response.writableEnded) {
        feedEventClients.delete(response);
        continue;
      }
      response.write("event: feed-changed\ndata: {}\n\n");
    }
  }

  function broadcastNoteboardChanged() {
    for (const response of feedEventClients) {
      if (response.destroyed || response.writableEnded) {
        feedEventClients.delete(response);
        continue;
      }
      response.write("event: noteboard-changed\ndata: {}\n\n");
    }
  }

  function broadcastCommunityChanged() {
    for (const response of feedEventClients) {
      if (response.destroyed || response.writableEnded) {
        feedEventClients.delete(response);
        continue;
      }
      response.write("event: community-changed\ndata: {}\n\n");
    }
  }

  function closeFeedEventClients() {
    for (const response of feedEventClients) response.end();
    feedEventClients.clear();
  }

  app.get("/api/community/events", (_request, response) => {
    response.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    response.flushHeaders();
    response.write(": connected\n\n");
    feedEventClients.add(response);

    const heartbeat = setInterval(() => {
      if (response.destroyed || response.writableEnded) {
        feedEventClients.delete(response);
        clearInterval(heartbeat);
        return;
      }
      response.write(": keep-alive\n\n");
    }, 20000);

    const cleanup = () => {
      clearInterval(heartbeat);
      feedEventClients.delete(response);
    };
    response.on("close", cleanup);
  });

  app.get("/api/community/feed", (request, response) => {
    const author = userAuth.identifyUser(request);
    response.set("Cache-Control", "no-store").json({ posts: community.list(author?.key || null) });
  });

  app.get("/api/community/noteboard", async (request, response) => {
    try {
      const author = userAuth.identifyUser(request);
      response.set("Cache-Control", "no-store").json({ notes: await noteboard.list(author?.key || null) });
    } catch (error) { sendCommunityError(response, error, "Could not load the noteboard."); }
  });

  app.post("/api/community/noteboard", async (request, response) => {
    try {
      const author = userAuth.identifyUser(request);
      if (!author) {
        const submission = await noteboard.submitGuest({ text: request.body?.text, displayName: request.body?.displayName, position: request.body?.position });
        broadcastNoteboardChanged();
        return response.status(201).set("Cache-Control", "no-store").json({ submission });
      }
      userAuth.assertCanContribute(author.key);
      await noteboard.validateCandidate(request.body || {});
      const cooldownUntil = await userAuth.startNoteCooldown(author.key);
      const note = await noteboard.createSignedIn({ ...request.body, author });
      broadcastNoteboardChanged();
      return response.status(201).set("Cache-Control", "no-store").json({ note, cooldownUntil });
    } catch (error) { return sendCommunityError(response, error, "Could not place this note."); }
  });

  app.get("/api/community/noteboard/submission", async (request, response) => {
    try {
      const status = await noteboard.getSubmission(request.get("x-submission-token"));
      response.set("Cache-Control", "no-store").json(status);
    } catch (error) { sendCommunityError(response, error, "Could not check this note submission."); }
  });

  app.post("/api/community/noteboard/submission/position", async (request, response) => {
    try {
      const note = await noteboard.replaceGuestPosition(request.get("x-submission-token"), request.body?.position);
      broadcastNoteboardChanged();
      response.set("Cache-Control", "no-store").json({ note });
    } catch (error) { sendCommunityError(response, error, "Could not place this note."); }
  });

  app.delete("/api/community/noteboard/:noteId", async (request, response) => {
    try {
      const author = userAuth.identifyUser(request);
      if (!author) throw Object.assign(new Error("Guests cannot delete published notes."), { status: 403 });
      userAuth.assertCanDeleteNote(author.key);
      await noteboard.deleteNote(request.params.noteId, { authorKey: author.key });
      broadcastNoteboardChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) { sendCommunityError(response, error, "Could not delete this note."); }
  });

  app.post("/api/community/posts", async (request, response) => {
    try {
      const author = userAuth.identifyUser(request);
      if (author) userAuth.assertCanContribute(author.key);
      const id = await community.createPost({
        text: request.body?.text,
        author,
        anonymous: author ? request.body?.anonymous === true : true,
      });
      broadcastFeedChanged();
      response.status(201).set("Cache-Control", "no-store").json({ id });
    } catch (error) {
      sendCommunityError(response, error, "Could not publish this post.");
    }
  });

  app.patch("/api/community/posts/:postId", async (request, response) => {
    try {
      const author = userAuth.identifyUser(request);
      if (author) userAuth.assertCanContribute(author.key);
      await community.updatePost({ postId: request.params.postId, text: request.body?.text, authorKey: author?.key });
      broadcastFeedChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) {
      sendCommunityError(response, error, "Could not update this post.");
    }
  });

  app.delete("/api/community/posts/:postId", async (request, response) => {
    try {
      const author = userAuth.identifyUser(request);
      if (author) userAuth.assertCanContribute(author.key);
      await community.deletePost({ postId: request.params.postId, authorKey: author?.key });
      broadcastFeedChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) {
      sendCommunityError(response, error, "Could not delete this post.");
    }
  });

  app.post("/api/community/posts/:postId/comments", async (request, response) => {
    try {
      const author = userAuth.identifyUser(request);
      if (author) userAuth.assertCanContribute(author.key);
      const id = await community.createComment({
        postId: request.params.postId,
        text: request.body?.text,
        author,
        anonymous: author ? request.body?.anonymous === true : true,
      });
      broadcastFeedChanged();
      response.status(201).set("Cache-Control", "no-store").json({ id });
    } catch (error) {
      sendCommunityError(response, error, "Could not publish this comment.");
    }
  });

  app.patch("/api/community/posts/:postId/comments/:commentId", async (request, response) => {
    try {
      const author = userAuth.identifyUser(request);
      if (author) userAuth.assertCanContribute(author.key);
      await community.updateComment({ postId: request.params.postId, commentId: request.params.commentId, text: request.body?.text, authorKey: author?.key });
      broadcastFeedChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) {
      sendCommunityError(response, error, "Could not update this comment.");
    }
  });

  app.delete("/api/community/posts/:postId/comments/:commentId", async (request, response) => {
    try {
      const author = userAuth.identifyUser(request);
      if (author) userAuth.assertCanContribute(author.key);
      await community.deleteComment({ postId: request.params.postId, commentId: request.params.commentId, authorKey: author?.key });
      broadcastFeedChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) {
      sendCommunityError(response, error, "Could not delete this comment.");
    }
  });

  app.get("/api/account/availability", (request, response) => {
    response.set("Cache-Control", "no-store").json({ available: userAuth.isAvailable(request.query.username) });
  });

  app.get("/api/account/session", (request, response) => {
    response.set("Cache-Control", "no-store").json({ user: userAuth.currentUser(request) });
  });

  app.post("/api/account/register", async (request, response) => {
    try {
      const token = await userAuth.register(request.body?.username, request.body?.password);
      return response.set("Cache-Control", "no-store").set("Set-Cookie", userAuth.sessionCookie(token)).json({ user: { username: request.body.username.trim() } });
    } catch (error) {
      if (error.code === "USERNAME_TAKEN") return response.status(409).json({ error: error.message });
      return response.status(error instanceof TypeError ? 400 : 500).json({ error: error.message || "Could not create the account." });
    }
  });

  app.post("/api/account/login", async (request, response) => {
    try {
      const token = await userAuth.login(request.body?.username, request.body?.password);
      if (!token) return response.status(401).json({ error: "The username or password is incorrect." });
      const cookie = userAuth.sessionCookie(token);
      return response.set("Cache-Control", "no-store").set("Set-Cookie", cookie).json({ user: userAuth.currentUser({ headers: { cookie: cookie.split(";")[0] } }) });
    } catch {
      return response.status(500).json({ error: "Could not sign in right now." });
    }
  });

  app.post("/api/account/logout", (request, response) => {
    userAuth.destroySession(request);
    response.set("Cache-Control", "no-store").set("Set-Cookie", userAuth.clearCookie()).json({ ok: true });
  });

  async function syncLanListeners() {
    const interfaces = getPrivateIPv4Interfaces(interfacesProvider());
    const wanted = new Set(interfaces.map(({ address }) => address));
    for (const [address, server] of lanListeners) {
      if (!wanted.has(address)) {
        lanListeners.delete(address);
        closeFeedEventClients();
        await closeServer(server);
      }
    }
    const failures = [];
    for (const { address } of interfaces) {
      if (lanListeners.has(address)) continue;
      const server = http.createServer(app);
      try {
        await listenServer(server, activePort, address);
        lanListeners.set(address, server);
        if (activePort === 0) activePort = server.address().port;
      } catch (error) {
        failures.push(`${address}: ${error.message}`);
      }
    }
    return { interfaces, failures };
  }

  async function disableHosting() {
    hostingEnabled = false;
    closeFeedEventClients();
    const closing = [...lanListeners.values()];
    lanListeners.clear();
    await Promise.all(closing.map(closeServer));
  }

  async function enableHosting() {
    if (communityDeleting) throw Object.assign(new Error("Community changes are in progress."), { status: 409 });
    if (hostingTransition) throw Object.assign(new Error("Guest hosting is already changing."), { status: 409 });
    if (!venueCommunity.exists()) throw Object.assign(new Error("Create a community before enabling guest hosting."), { status: 409 });
    hostingTransition = true;
    try {
      const { interfaces, failures } = await syncLanListeners();
      if (communityDeleting) throw Object.assign(new Error("Community changes are in progress."), { status: 409 });
      if (interfaces.length === 0) throw new Error("Connect the host computer to a private Wi-Fi or LAN network first.");
      if (lanListeners.size === 0) throw new Error(failures[0] || "Could not open a listener on the venue network.");
      hostingEnabled = true;
    } finally {
      hostingTransition = false;
    }
  }

  app.use("/api/admin", requireLoopback);
  app.use("/admin", requireLoopback);

  app.get("/api/admin/status", (request, response) => {
    response.set("Cache-Control", "no-store").json({
      authenticated: auth.isAuthenticated(request),
      hostingEnabled,
      communityExists: venueCommunity.exists(),
      port: activePort,
      interfaces: getPrivateIPv4Interfaces(interfacesProvider()),
    });
  });

  app.get("/api/admin/community", requireOwner, (_request, response) => {
    response.set("Cache-Control", "no-store").json({ community: venueCommunity.get() });
  });

  app.post("/api/admin/community", requireOwner, async (request, response) => {
    try {
      const saved = await venueCommunity.create(request.body);
      broadcastCommunityChanged();
      response.status(201).set("Cache-Control", "no-store").json({ community: saved });
    } catch (error) { sendCommunityError(response, error, "Could not create the community."); }
  });

  app.patch("/api/admin/community", requireOwner, async (request, response) => {
    try {
      const saved = await venueCommunity.update(request.body);
      broadcastCommunityChanged();
      response.set("Cache-Control", "no-store").json({ community: saved });
    } catch (error) { sendCommunityError(response, error, "Could not update the community."); }
  });

  app.delete("/api/admin/community", requireOwner, async (request, response) => {
    if (!venueCommunity.exists()) return response.status(404).json({ error: "There is no community to delete." });
    if (hostingEnabled || hostingTransition) return response.status(409).json({ error: "Disable guest hosting before deleting the community." });
    if (!await auth.verifyPassword(request.body?.password)) return response.status(401).json({ error: "The owner password is incorrect." });
    if (hostingEnabled || hostingTransition) return response.status(409).json({ error: "Disable guest hosting before deleting the community." });
    if (communityDeleting) return response.status(409).json({ error: "Community deletion is already in progress." });
    communityDeleting = true;
    try {
      await community.clear();
      await userAuth.clear();
      await noteboard.clear();
      await venueCommunity.remove();
      broadcastCommunityChanged();
      response.set("Cache-Control", "no-store").json({ community: null });
    } catch (error) { sendCommunityError(response, error, "Could not delete the community and its data."); }
    finally { communityDeleting = false; }
  });

  app.get("/api/community/config", (_request, response) => {
    response.set("Cache-Control", "no-store").json({ community: venueCommunity.get() });
  });

  app.get("/api/admin/moderation/feed", requireOwner, (_request, response) => {
    response.set("Cache-Control", "no-store").json({ posts: community.listForModeration() });
  });

  app.get("/api/admin/moderation/noteboard", requireOwner, async (_request, response) => {
    try {
      const data = await noteboard.listForModeration();
      response.set("Cache-Control", "no-store").json({ ...data, accounts: userAuth.listAccounts() });
    } catch (error) { sendCommunityError(response, error, "Could not load noteboard moderation."); }
  });

  app.get("/api/admin/moderation/accounts", requireOwner, (_request, response) => {
    response.set("Cache-Control", "no-store").json({ accounts: userAuth.listAccounts() });
  });

  app.post("/api/admin/moderation/noteboard/submissions/:submissionId/:action", requireOwner, async (request, response) => {
    try {
      await noteboard.moderateSubmission(request.params.submissionId, request.params.action);
      broadcastNoteboardChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) { sendCommunityError(response, error, "Could not moderate this note submission."); }
  });

  app.post("/api/admin/moderation/noteboard/notes/:noteId/reviewed", requireOwner, async (request, response) => {
    try {
      await noteboard.markReviewed(request.params.noteId);
      broadcastNoteboardChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) { sendCommunityError(response, error, "Could not mark this note as reviewed."); }
  });

  app.delete("/api/admin/moderation/noteboard/notes/:noteId", requireOwner, async (request, response) => {
    try {
      await noteboard.deleteNote(request.params.noteId, { isModerator: true });
      broadcastNoteboardChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) { sendCommunityError(response, error, "Could not remove this note."); }
  });

  app.post("/api/admin/moderation/noteboard/audit/clear", requireOwner, async (request, response) => {
    if (!await auth.verifyPassword(request.body?.password)) return response.status(401).json({ error: "The admin password is incorrect." });
    try {
      await noteboard.clearAudit();
      broadcastNoteboardChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) { sendCommunityError(response, error, "Could not clear the audit history."); }
  });

  app.post("/api/admin/moderation/accounts/:username/:action", requireOwner, async (request, response) => {
    try {
      if (!["freeze", "unfreeze"].includes(request.params.action)) return response.status(400).json({ error: "Choose freeze or unfreeze." });
      const result = await userAuth.setFrozen(request.params.username, request.params.action === "freeze");
      broadcastNoteboardChanged();
      response.set("Cache-Control", "no-store").json(result);
    } catch (error) { sendCommunityError(response, error, "Could not update this account's freeze."); }
  });

  app.patch("/api/admin/moderation/posts/:postId", requireOwner, async (request, response) => {
    try {
      await community.updatePost({ postId: request.params.postId, text: request.body?.text, isModerator: true });
      broadcastFeedChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) {
      sendCommunityError(response, error, "Could not update this post.");
    }
  });

  app.delete("/api/admin/moderation/posts/:postId", requireOwner, async (request, response) => {
    try {
      await community.deletePost({ postId: request.params.postId, isModerator: true });
      broadcastFeedChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) {
      sendCommunityError(response, error, "Could not delete this post.");
    }
  });

  app.patch("/api/admin/moderation/posts/:postId/comments/:commentId", requireOwner, async (request, response) => {
    try {
      await community.updateComment({ postId: request.params.postId, commentId: request.params.commentId, text: request.body?.text, isModerator: true });
      broadcastFeedChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) {
      sendCommunityError(response, error, "Could not update this comment.");
    }
  });

  app.delete("/api/admin/moderation/posts/:postId/comments/:commentId", requireOwner, async (request, response) => {
    try {
      await community.deleteComment({ postId: request.params.postId, commentId: request.params.commentId, isModerator: true });
      broadcastFeedChanged();
      response.set("Cache-Control", "no-store").json({ ok: true });
    } catch (error) {
      sendCommunityError(response, error, "Could not delete this comment.");
    }
  });

  app.post("/api/admin/password", requireOwner, async (request, response) => {
    try {
      const token = await auth.changePassword(request.body?.newPassword);
      response.set("Set-Cookie", auth.sessionCookie(token)).json({ ok: true });
    } catch (error) {
      response.status(error instanceof TypeError ? 400 : 500).json({ error: error.message || "Could not change the owner password." });
    }
  });

  app.post("/api/admin/login", async (request, response) => {
    const token = await auth.login(request.body?.password);
    if (!token) return response.status(401).json({ error: "The password is incorrect." });
    return response.set("Set-Cookie", auth.sessionCookie(token)).json({ ok: true });
  });

  app.post("/api/admin/logout", requireOwner, (request, response) => {
    auth.destroySession(request);
    response.set("Set-Cookie", auth.clearCookie()).json({ ok: true });
  });

  app.post("/api/admin/hosting", requireOwner, async (request, response) => {
    if (typeof request.body?.enabled !== "boolean") {
      return response.status(400).json({ error: "Choose whether hosting is enabled or disabled." });
    }
    try {
      if (request.body.enabled) await enableHosting();
      else await disableHosting();
      return response.set("Cache-Control", "no-store").json({ hostingEnabled });
    } catch (error) {
      await disableHosting();
      return response.status(409).json({ error: error.message || "Could not change hosting state." });
    }
  });

  app.get("/api/admin/join", requireOwner, async (request, response) => {
    if (!hostingEnabled) return response.status(409).json({ error: "Enable hosting before sharing the guest link." });
    const address = String(request.query.address || "");
    const isAvailable = getPrivateIPv4Interfaces(interfacesProvider()).some(({ address: item }) => item === address) && lanListeners.has(address);
    if (!isAvailable) return response.status(404).json({ error: "That local address is no longer available. Refresh and choose a current address." });
    try {
      const payload = await createJoinPayload(address, activePort, qrEncoder);
      return response.set("Cache-Control", "no-store").json(payload);
    } catch {
      return response.status(500).json({ error: "Could not generate the guest QR code." });
    }
  });

  app.get("/admin", (_request, response) => {
    response.sendFile(path.join(projectDir, "dist", "index.html"), (error) => {
      if (error) response.status(503).send("Build the app on the host with npm run build.");
    });
  });

  app.use(express.static(path.join(projectDir, "dist"), { maxAge: "1h", index: "index.html" }));
  app.get("*path", (_request, response) => {
    response.sendFile(path.join(projectDir, "dist", "index.html"), (error) => {
      if (error) response.status(503).send("Build the app on the host with npm run build.");
    });
  });

  return {
    app,
    get port() { return activePort; },
    get hostingEnabled() { return hostingEnabled; },
    get lanAddresses() { return [...lanListeners.keys()]; },
    async start() {
      if (loopbackListener?.listening) return;
      const server = http.createServer(app);
      loopbackListener = await listenServer(server, activePort, "127.0.0.1");
      activePort = server.address().port;
      refreshTimer = setInterval(() => {
        if (hostingEnabled) syncLanListeners().catch((error) => console.error("Could not refresh LAN listeners:", error.message));
      }, 5000);
      refreshTimer.unref();
      noteboardTimer = setInterval(() => {
        noteboard.processDeadlines().then((changed) => { if (changed) broadcastNoteboardChanged(); })
          .catch((error) => console.error("Could not process noteboard deadlines:", error.message));
      }, 5000);
      noteboardTimer.unref();
    },
    async setHostingEnabled(enabled) {
      if (enabled) await enableHosting();
      else await disableHosting();
      return hostingEnabled;
    },
    async close() {
      clearInterval(refreshTimer);
      clearInterval(noteboardTimer);
      await disableHosting();
      await closeServer(loopbackListener);
      loopbackListener = undefined;
    },
  };
}
