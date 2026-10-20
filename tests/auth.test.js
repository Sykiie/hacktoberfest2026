import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createAdminAuth, DEFAULT_ADMIN_PASSWORD, isLoopbackAddress } from "../server/auth.js";

test("recognizes only valid IPv4 and IPv6 loopback addresses", () => {
  for (const address of ["127.0.0.1", "127.12.4.8", "::1", "::ffff:127.0.0.1"]) {
    assert.equal(isLoopbackAddress(address), true, address);
  }
  for (const address of ["192.168.1.2", "8.8.8.8", "127.999.0.1", "localhost", ""]) {
    assert.equal(isLoopbackAddress(address), false, address);
  }
});

test("seeds a salted default password, changes it, and clears sessions on password change and restart", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-auth-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const ownerFile = path.join(directory, "owner.json");
  const firstProcessAuth = createAdminAuth(ownerFile);
  await firstProcessAuth.load();

  assert.equal(firstProcessAuth.isConfigured(), false);
  assert.equal(await firstProcessAuth.initializeDefault(), true);
  assert.equal(await firstProcessAuth.initializeDefault(), false);
  assert.equal(firstProcessAuth.isConfigured(), true);
  const savedOwner = JSON.parse(await readFile(ownerFile, "utf8"));
  assert.notEqual(savedOwner.passwordHash, DEFAULT_ADMIN_PASSWORD);
  assert.ok(savedOwner.salt);

  const makeRequest = (cookie = "") => ({ headers: { cookie } });
  const defaultSession = await firstProcessAuth.login(DEFAULT_ADMIN_PASSWORD);
  assert.ok(defaultSession);
  const defaultCookie = firstProcessAuth.sessionCookie(defaultSession).split(";")[0];
  assert.equal(firstProcessAuth.isAuthenticated(makeRequest(defaultCookie)), true);
  assert.equal(await firstProcessAuth.login("wrong-password"), null);

  await assert.rejects(firstProcessAuth.changePassword("short"), /at least 10 characters/);
  const changedSession = await firstProcessAuth.changePassword("replacement-owner-password");
  const changedCookie = firstProcessAuth.sessionCookie(changedSession).split(";")[0];
  assert.notEqual(changedCookie, defaultCookie);
  assert.equal(firstProcessAuth.isAuthenticated(makeRequest(defaultCookie)), false);
  assert.equal(firstProcessAuth.isAuthenticated(makeRequest(changedCookie)), true);
  assert.equal(await firstProcessAuth.login(DEFAULT_ADMIN_PASSWORD), null);
  assert.ok(await firstProcessAuth.login("replacement-owner-password"));
  const changedOwner = JSON.parse(await readFile(ownerFile, "utf8"));
  assert.notEqual(changedOwner.passwordHash, savedOwner.passwordHash);
  assert.notEqual(changedOwner.salt, savedOwner.salt);

  const restartedAuth = createAdminAuth(ownerFile);
  await restartedAuth.load();
  assert.equal(restartedAuth.isConfigured(), true);
  assert.equal(restartedAuth.isAuthenticated(makeRequest(changedCookie)), false);
  assert.equal(await restartedAuth.login(DEFAULT_ADMIN_PASSWORD), null);
  assert.ok(await restartedAuth.login("replacement-owner-password"));
});
