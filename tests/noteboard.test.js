import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createNoteboardStore } from "../server/noteboard-store.js";
import { createHostServer } from "../server/host.js";

async function fixture(t, clock = { value: Date.now() }) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-noteboard-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const options = { boardFile: path.join(directory, "noteboard.json"), auditFile: path.join(directory, "audit.json"), now: () => clock.value };
  const store = createNoteboardStore(options);
  await store.load();
  return { store, options, clock };
}

test("persists notes and audit history; enforces a 30% cumulative cover limit", async (t) => {
  const { store, options } = await fixture(t);
  const pending = await store.submitGuest({ text: "Still waiting after restart", displayName: "Visitor", position: { x: 0.05, y: 0.05 } });
  const author = { key: "alice", username: "Alice" };
  await store.createSignedIn({ text: "First note", displayName: "A", position: { x: 0.4, y: 0.4 }, author });
  await store.createSignedIn({ text: "Small overlap", displayName: "B", position: { x: 0.51, y: 0.52 }, author });
  await assert.rejects(store.createSignedIn({ text: "Over 30% overlap", displayName: "C", position: { x: 0.49, y: 0.51 }, author }), { status: 409 });
  await assert.rejects(store.createSignedIn({ text: "Combined overlap", displayName: "D", position: { x: 0.37, y: 0.58 }, author }), { status: 409 });

  const reloaded = createNoteboardStore(options);
  await reloaded.load();
  assert.equal((await reloaded.list()).length, 2);
  assert.equal((await reloaded.getSubmission(pending.token)).state, "pending");
  await assert.rejects(reloaded.submitGuest({ text: "Blocked overlap", displayName: "Visitor", position: { x: 0.4, y: 0.4 } }), { status: 409 });
  await assert.rejects(reloaded.deleteNote((await reloaded.list())[0].id, { authorKey: "bob" }), { status: 403 });
  const moderation = await reloaded.listForModeration();
  assert.equal(moderation.audit.length, 3);
  assert.equal(moderation.audit[0].author, "Alice");
});

test("auto-approves guest notes after ten minutes and invalidates the token", async (t) => {
  const { store, options, clock } = await fixture(t, { value: Date.now() });
  const submission = await store.submitGuest({ text: "Hello", displayName: "Fox", position: { x: 0.1, y: 0.1 } });
  assert.equal((await store.getSubmission(submission.token)).state, "pending");
  clock.value += 10 * 60 * 1000;
  assert.equal(await store.processDeadlines(), true);
  const { notes: [note] } = await store.listForModeration();
  assert.equal(note.text, "Hello");
  assert.equal(note.needsReview, true);
  await assert.rejects(store.getSubmission(submission.token), { status: 401 });
  const reloaded = createNoteboardStore(options);
  await reloaded.load();
  await assert.rejects(reloaded.getSubmission(submission.token), { status: 401 });
});

test("rejected guest submissions stay inaccessible after an application reload", async (t) => {
  const { store, options } = await fixture(t);
  const submission = await store.submitGuest({ text: "Do not publish", displayName: "Visitor", position: { x: 0.2, y: 0.2 } });
  await store.moderateSubmission(submission.id, "reject");
  const reloaded = createNoteboardStore(options);
  await reloaded.load();
  await assert.rejects(reloaded.getSubmission(submission.token), { status: 401 });
});

test("returns an approved guest note for a replacement position and invalidates its token on placement", async (t) => {
  const { store, options } = await fixture(t);
  const submission = await store.submitGuest({ text: "Guest note", displayName: "Fox", position: { x: 0.3, y: 0.3 } });
  await store.createSignedIn({ text: "Board changed", displayName: "Owner", position: { x: 0.3, y: 0.3 }, author: { key: "owner", username: "Owner" } });
  await store.moderateSubmission(submission.id, "approve");
  assert.equal((await store.getSubmission(submission.token)).state, "placement-required");
  await assert.rejects(store.replaceGuestPosition(submission.token, { x: 0.3, y: 0.3 }), { status: 409 });
  const placed = await store.replaceGuestPosition(submission.token, { x: 0.55, y: 0.5 });
  assert.equal(placed.text, "Guest note");
  await assert.rejects(store.getSubmission(submission.token), { status: 401 });
  const reloaded = createNoteboardStore(options);
  await reloaded.load();
  await assert.rejects(reloaded.getSubmission(submission.token), { status: 401 });
});

test("expires replacement submissions after thirty minutes", async (t) => {
  const { store, options, clock } = await fixture(t, { value: Date.now() });
  const submission = await store.submitGuest({ text: "Guest note", displayName: "Fox", position: { x: 0.3, y: 0.3 } });
  await store.createSignedIn({ text: "Board changed", displayName: "Owner", position: { x: 0.3, y: 0.3 }, author: { key: "owner", username: "Owner" } });
  await store.moderateSubmission(submission.id, "approve");
  clock.value += 30 * 60 * 1000;
  await store.processDeadlines();
  await assert.rejects(store.getSubmission(submission.token), { status: 401 });
  assert.equal((await store.listForModeration()).submissions.length, 0);
  const reloaded = createNoteboardStore(options);
  await reloaded.load();
  await assert.rejects(reloaded.getSubmission(submission.token), { status: 401 });
});

test("prunes audit events older than thirty days and caps history at 500", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-noteboard-audit-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const clock = Date.now();
  const boardFile = path.join(directory, "noteboard.json");
  const auditFile = path.join(directory, "audit.json");
  await writeFile(boardFile, JSON.stringify({ notes: [], submissions: [] }));
  const oldEvents = Array.from({ length: 3 }, (_, i) => ({ id: `old-${i}`, createdAt: new Date(clock - 31 * 24 * 60 * 60 * 1000).toISOString() }));
  const freshEvents = Array.from({ length: 502 }, (_, i) => ({ id: `fresh-${i}`, createdAt: new Date(clock - i * 1000).toISOString() }));
  await writeFile(auditFile, JSON.stringify([...oldEvents, ...freshEvents]));
  const store = createNoteboardStore({ boardFile, auditFile, now: () => clock });
  await store.load();
  const { audit } = await store.listForModeration();
  assert.equal(audit.length, 500);
  assert.ok(audit.every((event) => Date.parse(event.createdAt) >= clock - 30 * 24 * 60 * 60 * 1000));
});

test("serves guest submissions and host moderation; enforces global freezes and password-confirmed audit clearing", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-noteboard-api-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const host = await createHostServer({ port: 0, dataDirectory: directory, interfacesProvider: () => ({}) });
  t.after(() => host.close());
  await host.start();
  const base = `http://127.0.0.1:${host.port}`;
  async function request(url, method = "GET", body, cookie = "", headers = {}) {
    const response = await fetch(`${base}${url}`, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { response, data: await response.json().catch(() => ({})) };
  }

  const registration = await request("/api/account/register", "POST", { username: "BoardUser", password: "unique-disposable-password" });
  const userCookie = registration.response.headers.get("set-cookie").split(";")[0];
  const login = await request("/api/admin/login", "POST", { password: "locomi" });
  const ownerCookie = login.response.headers.get("set-cookie").split(";")[0];

  const eventResponse = await fetch(`${base}/api/community/events`);
  const eventReader = eventResponse.body.getReader();
  await eventReader.read();

  const guest = await request("/api/community/noteboard", "POST", { text: "Please review", displayName: "Guest Fox", position: { x: 0.2, y: 0.2 } });
  assert.equal(guest.response.status, 201);
  const event = await eventReader.read();
  const eventText = new TextDecoder().decode(event.value);
  assert.match(eventText, /event: noteboard-changed/);
  assert.doesNotMatch(eventText, /Please review|Guest Fox/);
  await eventReader.cancel();
  const submissionId = guest.data.submission.id;
  const moderation = await request("/api/admin/moderation/noteboard", "GET", undefined, ownerCookie);
  assert.equal(moderation.response.status, 200);
  assert.equal(moderation.data.submissions[0].id, submissionId);
  assert.equal(moderation.data.audit[0].text, "Please review");
  assert.equal((await request(`/api/admin/moderation/noteboard/submissions/${submissionId}/reject`, "POST", {}, ownerCookie)).response.status, 200);
  assert.equal((await request("/api/community/noteboard/submission", "GET", undefined, "", { "X-Submission-Token": guest.data.submission.token })).response.status, 401);

  const note = await request("/api/community/noteboard", "POST", { text: "Signed in note", displayName: "BoardUser pen name", position: { x: 0.5, y: 0.5 } }, userCookie);
  assert.equal(note.response.status, 201);
  assert.equal((await request(`/api/community/noteboard/${note.data.note.id}`, "DELETE", undefined, userCookie)).response.status, 429);
  assert.equal((await request("/api/community/noteboard", "POST", { text: "Too soon", displayName: "BoardUser", position: { x: 0.1, y: 0.1 } }, userCookie)).response.status, 429);
  assert.equal((await request("/api/admin/moderation/accounts/BoardUser/freeze", "POST", {}, ownerCookie)).response.status, 200);
  assert.equal((await request("/api/community/posts", "POST", { text: "Frozen account" }, userCookie)).response.status, 403);
  assert.equal((await request("/api/community/noteboard")).data.notes.length, 1);
  assert.equal((await request("/api/admin/moderation/noteboard/audit/clear", "POST", { password: "wrong-password" }, ownerCookie)).response.status, 401);
  assert.equal((await request("/api/admin/moderation/noteboard/audit/clear", "POST", { password: "locomi" }, ownerCookie)).response.status, 200);
  assert.equal((await request("/api/community/noteboard")).data.notes.length, 1);
  assert.equal((await request("/api/admin/moderation/noteboard", "GET", undefined, ownerCookie)).data.audit.length, 0);
});
