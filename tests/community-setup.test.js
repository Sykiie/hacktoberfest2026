import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHostServer } from "../server/host.js";
import { getPrivateIPv4Interfaces } from "../server/network.js";

test("owner can read and manage one venue community, and deletion requires password and hosting off", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-setup-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const host = await createHostServer({ port: 0, dataDirectory: directory, interfacesProvider: () => ({}) });
  t.after(() => host.close());
  await host.start();
  const base = `http://127.0.0.1:${host.port}`;

  async function request(url, method = "GET", body, cookie = "") {
    const response = await fetch(`${base}${url}`, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { response, data: await response.json().catch(() => ({})) };
  }

  assert.equal((await request("/api/admin/community")).response.status, 401);
  assert.equal((await request("/api/admin/community", "POST", { venueType: "Cafe", venueName: "Cafe", enabledModules: ["feed"] })).response.status, 401);
  const initialStatus = (await request("/api/admin/status")).data;
  assert.equal(initialStatus.communityExists, false);

  const login = await request("/api/admin/login", "POST", { password: "locomi" });
  const ownerCookie = login.response.headers.get("set-cookie").split(";")[0];
  assert.equal(login.response.status, 200);
  const enableWithoutCommunity = await request("/api/admin/hosting", "POST", { enabled: true }, ownerCookie);
  assert.equal(enableWithoutCommunity.response.status, 409);
  assert.match(enableWithoutCommunity.data.error, /Create a community/);
  assert.equal(host.hostingEnabled, false);

  const created = await request("/api/admin/community", "POST", {
    venueType: "Other", customVenueType: "Bookshop", venueName: "Pages", enabledModules: ["feed"],
  }, ownerCookie);
  assert.equal(created.response.status, 201);
  assert.equal((await request("/api/community/noteboard")).response.status, 404);
  assert.equal((await request("/api/admin/community", "POST", {
    venueType: "Cafe", venueName: "Second", enabledModules: ["feed"],
  }, ownerCookie)).response.status, 409);
  assert.deepEqual((await request("/api/admin/community", "GET", undefined, ownerCookie)).data.community, created.data.community);
  assert.equal((await request("/api/community/config")).data.community.enabledModules[0], "feed");
  assert.equal((await request("/api/admin/status")).data.communityExists, true);

  const updated = await request("/api/admin/community", "PATCH", {
    venueType: "Cafe", venueName: "Pages Cafe", enabledModules: ["noteboard"],
  }, ownerCookie);
  assert.equal(updated.response.status, 200);
  assert.equal(updated.data.community.venueName, "Pages Cafe");
  assert.deepEqual((await request("/api/community/config")).data.community.enabledModules, ["noteboard"]);
  assert.equal((await request("/api/community/feed")).response.status, 404);
  assert.equal((await request("/api/community/posts", "POST", { text: "Disabled feature" })).response.status, 404);

  const reenabled = await request("/api/admin/community", "PATCH", {
    venueType: "Cafe", venueName: "Pages Cafe", enabledModules: ["feed", "noteboard"],
  }, ownerCookie);
  assert.equal(reenabled.response.status, 200);

  const account = await request("/api/account/register", "POST", { username: "SetupGuest", password: "unique-disposable-password" });
  assert.equal(account.response.status, 200);
  const accountCookie = account.response.headers.get("set-cookie").split(";")[0];
  assert.equal((await request("/api/community/posts", "POST", { text: "Remove with community" }, accountCookie)).response.status, 201);
  assert.equal((await request("/api/community/noteboard", "POST", {
    text: "Remove this note", displayName: "SetupGuest", position: { x: 0.2, y: 0.2 },
  }, accountCookie)).response.status, 201);
  assert.equal((await request("/api/community/noteboard", "POST", {
    text: "Remove this submission", displayName: "Visitor", position: { x: 0.6, y: 0.6 },
  })).response.status, 201);
  const ownerFile = path.join(directory, "owner.json");
  const ownerCredentials = await readFile(ownerFile, "utf8");

  const wrongPassword = await request("/api/admin/community", "DELETE", { password: "wrong-password" }, ownerCookie);
  assert.equal(wrongPassword.response.status, 401);
  assert.equal((await request("/api/admin/status")).data.communityExists, true);
  const removed = await request("/api/admin/community", "DELETE", { password: "locomi" }, ownerCookie);
  assert.equal(removed.response.status, 200);
  assert.equal((await request("/api/admin/status")).data.communityExists, false);
  assert.equal((await request("/api/community/feed")).response.status, 404);
  assert.equal((await request("/api/community/noteboard")).response.status, 404);
  assert.deepEqual(await request("/api/admin/moderation/noteboard", "GET", undefined, ownerCookie).then(({ data }) => data), { notes: [], submissions: [], audit: [], accounts: [] });
  assert.equal((await request("/api/account/availability?username=SetupGuest")).data.available, true);
  assert.equal((await request("/api/admin/status", "GET", undefined, ownerCookie)).data.authenticated, true);
  assert.equal(await readFile(ownerFile, "utf8"), ownerCredentials);

  const replacement = await request("/api/admin/community", "POST", {
    venueType: "Cafe", venueName: "Replacement", enabledModules: ["feed"],
  }, ownerCookie);
  assert.equal(replacement.response.status, 201);
  assert.deepEqual(JSON.parse(await readFile(path.join(directory, "community.json"), "utf8")), []);
  assert.deepEqual(JSON.parse(await readFile(path.join(directory, "users.json"), "utf8")), []);
});

test("community deletion is rejected while guest hosting is active", async (t) => {
  if (getPrivateIPv4Interfaces().length === 0) return t.skip("No private IPv4 interface is available for the LAN listener check.");
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-setup-hosting-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const host = await createHostServer({ port: 0, dataDirectory: directory });
  t.after(() => host.close());
  await host.start();
  const base = `http://127.0.0.1:${host.port}`;
  const login = await fetch(`${base}/api/admin/login`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "locomi" }),
  });
  const ownerCookie = login.headers.get("set-cookie").split(";")[0];
  const created = await fetch(`${base}/api/admin/community`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: ownerCookie },
    body: JSON.stringify({ venueType: "Cafe", venueName: "Network Cafe", enabledModules: ["feed"] }),
  });
  assert.equal(created.status, 201);

  try {
    await host.setHostingEnabled(true);
  } catch (error) {
    return t.skip(`Could not open a LAN listener in this environment: ${error.message}`);
  }
  const deletion = await fetch(`${base}/api/admin/community`, {
    method: "DELETE", headers: { "Content-Type": "application/json", Cookie: ownerCookie },
    body: JSON.stringify({ password: "locomi" }),
  });
  assert.equal(deletion.status, 409);
  assert.equal((await (await fetch(`${base}/api/admin/status`)).json()).communityExists, true);
  await host.setHostingEnabled(false);
});
