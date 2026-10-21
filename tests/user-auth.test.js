import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createUserAuth } from "../server/user-auth.js";

test("stores salted password hashes and only one concurrent registration can claim a username", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-users-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, "users.json");
  const auth = createUserAuth(file);
  await auth.load();

  assert.equal(auth.isAvailable(" Friendly_Fox "), true);
  assert.equal(auth.isAvailable("bad name"), false);
  const attempts = await Promise.allSettled([
    auth.register("Friendly_Fox", "unique-disposable-password"),
    auth.register("friendly_fox", "another-disposable-password"),
  ]);
  assert.equal(attempts.filter((attempt) => attempt.status === "fulfilled").length, 1);
  assert.equal(attempts.filter((attempt) => attempt.status === "rejected" && attempt.reason.code === "USERNAME_TAKEN").length, 1);
  assert.equal(auth.isAvailable("FRIENDLY_FOX"), false);

  const [record] = JSON.parse(await readFile(file, "utf8"));
  assert.equal(record.username, "friendly_fox");
  assert.equal(record.displayUsername, "Friendly_Fox");
  assert.ok(record.salt);
  assert.notEqual(record.passwordHash, "unique-disposable-password");
  assert.equal(JSON.stringify(record).includes("disposable-password"), false);
});

test("user sessions authenticate, reject bad credentials, and are invalidated by sign-out", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-user-session-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const auth = createUserAuth(path.join(directory, "users.json"));
  await auth.load();
  await auth.register("Juniper", "unique-disposable-password");
  assert.equal(await auth.login("unknown", "unique-disposable-password"), null);
  assert.equal(await auth.login("juniper", "incorrect-password"), null);
  const token = await auth.login("JUNIPER", "unique-disposable-password");
  const cookie = auth.sessionCookie(token).split(";")[0];
  const request = { headers: { cookie } };
  assert.deepEqual(auth.currentUser(request), { username: "Juniper" });
  auth.destroySession(request);
  assert.equal(auth.currentUser(request), null);
});

test("persists global freezes and note cooldowns for signed-in accounts", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-user-controls-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, "users.json");
  let clock = Date.now();
  const auth = createUserAuth(file, { now: () => clock });
  await auth.load();
  await auth.register("BoardFox", "unique-disposable-password");

  const until = await auth.startNoteCooldown("boardfox");
  assert.ok(Date.parse(until) > Date.now());
  assert.throws(() => auth.assertCanDeleteNote("boardfox"), { status: 429 });
  await assert.rejects(auth.startNoteCooldown("boardfox"), { status: 429 });
  clock += 60_000;
  assert.doesNotThrow(() => auth.assertCanDeleteNote("boardfox"));
  await auth.startNoteCooldown("boardfox");

  await auth.setFrozen("BOARDFOX", true);
  assert.equal(auth.isFrozen("BoardFox"), true);
  assert.throws(() => auth.assertCanContribute("boardfox"), { status: 403 });
  const reloaded = createUserAuth(file, { now: () => clock });
  await reloaded.load();
  assert.equal(reloaded.isFrozen("boardfox"), true);
  await reloaded.setFrozen("BoardFox", false);
  assert.equal(reloaded.isFrozen("boardfox"), false);
  assert.doesNotThrow(() => reloaded.assertCanContribute("boardfox"));
});
