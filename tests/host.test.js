import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isAdminLoopbackRequest } from "../server/auth.js";
import { createHostServer } from "../server/host.js";
import { getPrivateIPv4Interfaces } from "../server/network.js";
import { configureTestCommunity } from "./helpers/venue-community.js";

test("admin guard denies requests received on a LAN address", () => {
  assert.equal(isAdminLoopbackRequest({ socket: { localAddress: "192.168.1.20" } }), false);
  assert.equal(isAdminLoopbackRequest({ socket: { localAddress: "127.0.0.1" } }), true);
});

test("community APIs protect authorship and owner moderation identity on loopback", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-feed-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const host = await createHostServer({ port: 0, dataDirectory: directory, interfacesProvider: () => ({}) });
  t.after(() => host.close());
  await host.start();
  const base = `http://127.0.0.1:${host.port}`;
  await configureTestCommunity(base, ["feed"]);
  async function request(url, method = "GET", body, cookie = "") {
    const response = await fetch(`${base}${url}`, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { response, data: await response.json().catch(() => ({})) };
  }
  const alice = await request("/api/account/register", "POST", { username: "FeedAlice", password: "unique-disposable-password" });
  assert.equal(alice.response.status, 200);
  const aliceCookie = alice.response.headers.get("set-cookie").split(";")[0];
  const bob = await request("/api/account/register", "POST", { username: "FeedBob", password: "another-disposable-password" });
  const bobCookie = bob.response.headers.get("set-cookie").split(";")[0];

  const created = await request("/api/community/posts", "POST", { text: "A private author identity", anonymous: true }, aliceCookie);
  assert.equal(created.response.status, 201);
  const postId = created.data.id;
  const comment = await request(`/api/community/posts/${postId}/comments`, "POST", { text: "Anonymous comment", anonymous: true }, aliceCookie);
  assert.equal(comment.response.status, 201);
  const publicFeed = await request("/api/community/feed");
  assert.equal(publicFeed.data.posts[0].author, "Anonymous");
  assert.equal(publicFeed.data.posts[0].comments[0].author, "Anonymous");
  assert.equal(publicFeed.data.nextCursor, null);
  assert.equal((await request("/api/community/feed?cursor=invalid")).response.status, 400);
  assert.equal("authorKey" in publicFeed.data.posts[0], false);
  assert.equal("authorName" in publicFeed.data.posts[0], false);
  assert.equal(publicFeed.data.posts[0].canEdit, false);
  assert.equal((await request(`/api/community/posts/${postId}`, "PATCH", { text: "Guest cannot edit" })).response.status, 403);
  assert.equal((await request(`/api/community/posts/${postId}`, "PATCH", { text: "Bob cannot edit" }, bobCookie)).response.status, 403);
  assert.equal((await request(`/api/community/posts/${postId}`, "PATCH", { text: "Alice can edit" }, aliceCookie)).response.status, 200);
  const aliceFeed = await request("/api/community/feed", "GET", undefined, aliceCookie);
  assert.equal(aliceFeed.data.posts[0].canEdit, true);

  const owner = await request("/api/admin/login", "POST", { password: "locomi" });
  const ownerCookie = owner.response.headers.get("set-cookie").split(";")[0];
  assert.equal((await request("/api/admin/moderation/feed")).response.status, 401);
  assert.equal((await request("/api/admin/moderation/unlock", "POST", { password: "locomi" }, ownerCookie)).response.status, 404);
  const privateFeed = await request("/api/admin/moderation/feed", "GET", undefined, ownerCookie);
  assert.equal(privateFeed.response.status, 200);
  assert.equal(privateFeed.data.posts[0].author, "FeedAlice");
  assert.equal(privateFeed.data.posts[0].comments[0].author, "FeedAlice");
  assert.equal((await request(`/api/admin/moderation/posts/${postId}`, "PATCH", { text: "Removed by host" }, ownerCookie)).response.status, 200);
  assert.equal((await request(`/api/admin/moderation/posts/${postId}/comments/${comment.data.id}`, "DELETE", undefined, ownerCookie)).response.status, 200);
  assert.equal((await request(`/api/community/posts/${postId}`, "DELETE", undefined, aliceCookie)).response.status, 200);
  assert.equal((await request("/api/community/feed")).data.posts.length, 0);
  await host.close();
});

test("AI moderation settings are owner-only and never return the saved API key", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-ai-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const host = await createHostServer({ port: 0, dataDirectory: directory, interfacesProvider: () => ({}) });
  t.after(() => host.close());
  await host.start();
  const base = "http://127.0.0.1:" + host.port;
  const request = async (url, method = "GET", body, cookie = "") => {
    const response = await fetch(base + url, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { response, data: await response.json().catch(() => ({})) };
  };
  assert.equal((await request("/api/admin/ai-settings")).response.status, 401);
  const login = await request("/api/admin/login", "POST", { password: "locomi" });
  const cookie = login.response.headers.get("set-cookie").split(";")[0];
  const saved = await request("/api/admin/ai-settings", "PUT", { provider: "openai-compatible", baseUrl: "https://api.example.test/v1", model: "moderation-model", apiKey: "never-return-this" }, cookie);
  assert.equal(saved.response.status, 200);
  assert.equal(saved.data.hasApiKey, true);
  assert.equal("apiKey" in saved.data, false);
  const settings = await request("/api/admin/ai-settings", "GET", undefined, cookie);
  assert.equal(settings.data.hasApiKey, true);
  assert.equal(JSON.stringify(settings.data).includes("never-return-this"), false);
});

test("AI checks recover from provider outage and remain private to host moderation", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-ai-flow-"));
  let available = false;
  const aiFetch = async (_url, options) => available
    ? { ok: true, json: async () => {
      const prompt = JSON.parse(options.body).messages[0].content;
      const inputs = JSON.parse(prompt.slice(prompt.indexOf("Items:\n") + 7));
      return { choices: [{ message: { content: JSON.stringify({ results: inputs.map(({ id }) => ({ id, flagged: true, severity: "high", reason: "Possible scam" })) }) } }] };
    } }
    : { ok: false, status: 503, json: async () => ({ error: { message: "Provider temporarily unavailable" } }) };
  const host = await createHostServer({ port: 0, dataDirectory: directory, interfacesProvider: () => ({}), aiFetch, aiRetryBaseDelayMs: 20, aiRetryIntervalMs: 10 });
  t.after(async () => {
    await host.close();
    await rm(directory, { recursive: true, force: true });
  });
  await host.start();
  const base = "http://127.0.0.1:" + host.port;
  await configureTestCommunity(base, ["feed"]);
  const request = async (url, method = "GET", body, cookie = "") => {
    const response = await fetch(base + url, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { response, data: await response.json().catch(() => ({})) };
  };
  const owner = await request("/api/admin/login", "POST", { password: "locomi" });
  const ownerCookie = owner.response.headers.get("set-cookie").split(";")[0];
  await request("/api/admin/ai-settings", "PUT", { provider: "openai-compatible", baseUrl: "https://api.example.test/v1", model: "moderator", apiKey: "secret" }, ownerCookie);
  const created = await request("/api/community/posts", "POST", { text: "Check this suspicious offer" });
  assert.equal(created.response.status, 201);
  const waitForStatus = async (status) => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const result = await request("/api/admin/moderation/feed", "GET", undefined, ownerCookie);
      if (result.data.posts[0]?.aiReview?.status === status) return result.data.posts[0];
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error("Timed out waiting for AI state " + status);
  };
  const unavailable = await waitForStatus("unavailable");
  assert.match(unavailable.aiReview.reason, /HTTP 503.*Provider temporarily unavailable/);
  available = true;
  const flagged = await waitForStatus("flagged");
  assert.equal(flagged.aiReview.reason, "Possible scam");
  const publicFeed = await request("/api/community/feed");
  assert.equal("aiReview" in publicFeed.data.posts[0], false);
  const reviewed = await request("/api/admin/moderation/posts/" + created.data.id + "/ai-reviewed", "POST", undefined, ownerCookie);
  assert.equal(reviewed.response.status, 200);
  const moderation = await request("/api/admin/moderation/feed", "GET", undefined, ownerCookie);
  assert.equal(moderation.data.posts[0].aiReview.status, "reviewed");
});

test("profile images require the right account, validate replacements, and are publicly served", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-profile-api-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const host = await createHostServer({ port: 0, dataDirectory: directory, interfacesProvider: () => ({}) });
  t.after(() => host.close());
  await host.start();
  const base = `http://127.0.0.1:${host.port}`;
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]);
  async function upload(url, buffer, type, cookie = "") {
    return fetch(`${base}${url}`, { method: "PUT", headers: { "Content-Type": type, ...(cookie ? { Cookie: cookie } : {}) }, body: buffer });
  }
  const alice = await fetch(`${base}/api/account/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "ImageAlice", password: "alice-disposable-password" }) });
  const aliceCookie = alice.headers.get("set-cookie").split(";")[0];
  const bob = await fetch(`${base}/api/account/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "ImageBob", password: "bob-disposable-password" }) });
  const bobCookie = bob.headers.get("set-cookie").split(";")[0];

  assert.equal((await upload("/api/account/profile-image", png, "image/png")).status, 401);
  assert.equal((await upload("/api/account/profile-image", png, "image/png", aliceCookie)).status, 200);
  assert.equal((await fetch(`${base}/api/profile-images/members/imagealice`)).status, 200);
  assert.equal((await fetch(`${base}/api/profile-images/members/%2e%2e%2Fsecret`)).status, 404);
  assert.equal((await upload("/api/account/profile-image", Buffer.from("invalid"), "image/png", aliceCookie)).status, 415);
  assert.deepEqual(Buffer.from(await (await fetch(`${base}/api/profile-images/members/imagealice`)).arrayBuffer()), png);

  assert.equal((await upload("/api/account/profile-image", png, "image/png", bobCookie)).status, 200);
  const eventController = new AbortController();
  const eventResponse = await fetch(`${base}/api/community/events`, { signal: eventController.signal });
  const eventReader = eventResponse.body.getReader();
  await eventReader.read();
  const removal = await fetch(`${base}/api/account/profile-image`, { method: "DELETE", headers: { Cookie: bobCookie } });
  assert.equal(removal.status, 200);
  let eventText = "";
  while (!eventText.includes("noteboard-changed")) {
    const { value, done } = await eventReader.read();
    if (done) break;
    eventText += Buffer.from(value).toString("utf8");
  }
  eventController.abort();
  assert.match(eventText, /feed-changed/);
  assert.match(eventText, /noteboard-changed/);
  assert.equal((await fetch(`${base}/api/profile-images/members/imagebob`)).status, 404);

  const owner = await fetch(`${base}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "locomi" }) });
  const ownerCookie = owner.headers.get("set-cookie").split(";")[0];
  const accountList = await fetch(`${base}/api/admin/moderation/accounts`, { headers: { Cookie: ownerCookie } }).then((response) => response.json());
  assert.equal(accountList.accounts.find((account) => account.username === "ImageAlice").profileImageUrl.startsWith("/api/profile-images/members/imagealice?v="), true);
  assert.equal((await upload("/api/admin/community/profile-image", png, "image/png")).status, 401);
  assert.equal((await upload("/api/admin/community/profile-image", png, "image/png", ownerCookie)).status, 200);
  assert.equal((await fetch(`${base}/api/profile-images/venue`)).status, 200);
  assert.equal((await fetch(`${base}/api/account/profile-image`, { method: "DELETE", headers: { Cookie: bobCookie } })).status, 200);
  assert.equal((await fetch(`${base}/api/profile-images/members/imagealice`, { method: "DELETE", headers: { Cookie: bobCookie } })).status, 404);
});

test("host starts with guest access off, accepts default login and resets sessions on restart", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-host-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  async function startHost() {
    const host = await createHostServer({ port: 0, dataDirectory: directory, interfacesProvider: () => ({}) });
    await host.start();
    return host;
  }
  async function post(url, body, cookie = "") {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify(body),
    });
    return { response, data: await response.json().catch(() => ({})) };
  }

  let host = await startHost();
  t.after(async () => host.close());
  const baseUrl = () => `http://127.0.0.1:${host.port}`;
  assert.equal(host.hostingEnabled, false);

  let response = await fetch(`${baseUrl()}/api/admin/status`);
  let status = await response.json();
  assert.equal(status.hostingEnabled, false);
  assert.equal((await fetch(`${baseUrl()}/`)).status, 200);
  assert.equal((await fetch(`${baseUrl()}/admin`)).status, 200);
  assert.equal((await fetch(`${baseUrl()}/api/admin/join`)).status, 401);
  assert.equal((await post(`${baseUrl()}/api/admin/hosting`, { enabled: true })).response.status, 401);

  assert.equal((await post(`${baseUrl()}/api/admin/setup`, { password: "anything" })).response.status, 404);
  const invalidLogin = await post(`${baseUrl()}/api/admin/login`, { password: "wrong-password" });
  assert.equal(invalidLogin.response.status, 401);
  const login = await post(`${baseUrl()}/api/admin/login`, { password: "locomi" });
  assert.equal(login.response.status, 200);
  const cookie = login.response.headers.get("set-cookie").split(";")[0];
  status = await (await fetch(`${baseUrl()}/api/admin/status`, { headers: { Cookie: cookie } })).json();
  assert.equal(status.authenticated, true);
  const hiddenJoin = await fetch(`${baseUrl()}/api/admin/join?address=192.168.1.5`, { headers: { Cookie: cookie } });
  assert.equal(hiddenJoin.status, 409);

  const changedPassword = await post(`${baseUrl()}/api/admin/password`, { newPassword: "venue-owner-password" }, cookie);
  assert.equal(changedPassword.response.status, 200);
  const changedCookie = changedPassword.response.headers.get("set-cookie").split(";")[0];
  assert.notEqual(changedCookie, cookie);
  assert.equal((await fetch(`${baseUrl()}/api/admin/status`, { headers: { Cookie: cookie } })).status, 200);
  assert.equal((await (await fetch(`${baseUrl()}/api/admin/status`, { headers: { Cookie: cookie } })).json()).authenticated, false);
  assert.equal((await post(`${baseUrl()}/api/admin/login`, { password: "locomi" })).response.status, 401);
  const noNetwork = await post(`${baseUrl()}/api/admin/hosting`, { enabled: true }, changedCookie);
  assert.equal(noNetwork.response.status, 409);
  assert.equal(host.hostingEnabled, false);
  assert.equal((await (await fetch(`${baseUrl()}/api/admin/status`, { headers: { Cookie: changedCookie } })).json()).authenticated, true);
  await host.close();

  host = await startHost();
  response = await fetch(`${baseUrl()}/api/admin/status`, { headers: { Cookie: changedCookie } });
  status = await response.json();
  assert.equal(status.authenticated, false);
  assert.equal(status.hostingEnabled, false);
  assert.equal((await post(`${baseUrl()}/api/admin/login`, { password: "locomi" })).response.status, 401);
  assert.equal((await post(`${baseUrl()}/api/admin/login`, { password: "venue-owner-password" })).response.status, 200);
  await host.close();
});

test("hosting toggle opens a guest-only LAN listener and closes it again", async (t) => {
  const interfaces = getPrivateIPv4Interfaces();
  if (interfaces.length === 0) return t.skip("No private IPv4 interface is available for the LAN listener check.");
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-lan-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const host = await createHostServer({ port: 0, dataDirectory: directory });
  t.after(() => host.close());
  await host.start();
  const loopbackUrl = `http://127.0.0.1:${host.port}`;

  const loginResponse = await fetch(`${loopbackUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "locomi" }),
  });
  assert.equal(loginResponse.status, 200);
  const cookie = loginResponse.headers.get("set-cookie").split(";")[0];
  const communityResponse = await fetch(`${loopbackUrl}/api/admin/community`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ venueType: "Cafe", venueName: "LAN Cafe", enabledModules: ["feed", "noteboard"] }),
  });
  assert.equal(communityResponse.status, 201);
  const enableResponse = await fetch(`${loopbackUrl}/api/admin/hosting`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ enabled: true }),
  });
  assert.equal(enableResponse.status, 200);
  assert.equal((await enableResponse.json()).hostingEnabled, true);

  const address = host.lanAddresses[0];
  assert.ok(address);
  const lanUrl = `http://${address}:${host.port}`;
  const guestPage = await fetch(lanUrl);
  assert.equal(guestPage.status, 200);
  assert.match(await guestPage.text(), /Local Community|<div id="root"/);
  const anonymousSession = await fetch(`${lanUrl}/api/account/session`);
  assert.deepEqual(await anonymousSession.json(), { user: null });
  const lanFeed = await fetch(`${lanUrl}/api/community/feed`);
  assert.equal(lanFeed.status, 200);
  assert.deepEqual((await lanFeed.json()).posts, []);
  const lanPost = await fetch(`${lanUrl}/api/community/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Hello from the venue network" }),
  });
  assert.equal(lanPost.status, 201);
  const availability = await fetch(`${lanUrl}/api/account/availability?username=LanGuest`);
  assert.deepEqual(await availability.json(), { available: true });
  const register = await fetch(`${lanUrl}/api/account/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "LanGuest", password: "unique-disposable-password" }),
  });
  assert.equal(register.status, 200);
  const guestCookie = register.headers.get("set-cookie").split(";")[0];
  assert.deepEqual(await (await fetch(`${lanUrl}/api/account/session`, { headers: { Cookie: guestCookie } })).json(), { user: { username: "LanGuest" } });
  const guestLogin = await fetch(`${lanUrl}/api/account/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "languest", password: "unique-disposable-password" }),
  });
  assert.equal(guestLogin.status, 200);
  const loginCookie = guestLogin.headers.get("set-cookie").split(";")[0];
  assert.deepEqual(await (await fetch(`${lanUrl}/api/account/session`, { headers: { Cookie: loginCookie } })).json(), { user: { username: "LanGuest" } });
  const badGuestLogin = await fetch(`${lanUrl}/api/account/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "languest", password: "wrong-password" }),
  });
  assert.equal(badGuestLogin.status, 401);
  const guestLogout = await fetch(`${lanUrl}/api/account/logout`, { method: "POST", headers: { Cookie: loginCookie } });
  assert.equal(guestLogout.status, 200);
  assert.deepEqual(await (await fetch(`${lanUrl}/api/account/session`, { headers: { Cookie: loginCookie } })).json(), { user: null });
  assert.equal((await fetch(`${lanUrl}/api/admin/status`)).status, 404);
  assert.equal((await fetch(`${lanUrl}/api/admin/moderation/unlock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "locomi" }) })).status, 404);
  assert.equal((await fetch(`${lanUrl}/api/admin/moderation/feed`)).status, 404);
  assert.equal((await fetch(`${lanUrl}/admin`)).status, 404);
  assert.equal((await fetch(`${lanUrl}/api/admin/status`)).status, 404);

  const joinResponse = await fetch(`${loopbackUrl}/api/admin/join?address=${encodeURIComponent(address)}`, { headers: { Cookie: cookie } });
  assert.equal(joinResponse.status, 200);
  const join = await joinResponse.json();
  assert.equal(join.url, `${lanUrl}/guest`);
  assert.match(join.qrDataUrl, /^data:image\/png;base64,/);

  const disableResponse = await fetch(`${loopbackUrl}/api/admin/hosting`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ enabled: false }),
  });
  assert.equal(disableResponse.status, 200);
  assert.equal(host.hostingEnabled, false);
  assert.equal((await fetch(`${loopbackUrl}/admin`)).status, 200);
  await assert.rejects(fetch(`${lanUrl}/api/account/session`), (error) => error.cause?.code === "ECONNREFUSED");
  await assert.rejects(fetch(`${lanUrl}/api/community/feed`), (error) => error.cause?.code === "ECONNREFUSED");
  await assert.rejects(fetch(lanUrl), (error) => error.cause?.code === "ECONNREFUSED");
});
