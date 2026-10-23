import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createCommunityStore } from "../server/community-store.js";

test("publishes posts and comments, filters anonymous identity, and enforces author ownership", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-feed-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createCommunityStore(path.join(directory, "community.json"));
  await store.load();

  const postId = await store.createPost({ text: "A public post", author: { key: "juniper", username: "Juniper" }, anonymous: true });
  const commentId = await store.createComment({ postId, text: "An anonymous comment", author: { key: "river", username: "River" }, anonymous: true });
  const publicPost = store.list("juniper")[0];
  assert.equal(publicPost.author, "Anonymous");
  assert.equal(publicPost.canEdit, true);
  assert.equal("authorKey" in publicPost, false);
  assert.deepEqual(publicPost.comments[0].author, "Anonymous");
  assert.equal(publicPost.comments[0].canEdit, false);
  assert.equal("authorKey" in publicPost.comments[0], false);

  const privatePost = store.listForModeration()[0];
  assert.equal(privatePost.author, "Juniper");
  assert.equal(privatePost.comments[0].author, "River");
  await assert.rejects(store.updatePost({ postId, text: "Stolen edit", authorKey: "river" }), { status: 403 });
  await assert.rejects(store.deleteComment({ postId, commentId, authorKey: "juniper" }), { status: 403 });

  await store.updatePost({ postId, text: "Edited by author", authorKey: "juniper" });
  await store.updateComment({ postId, commentId, text: "Edited by commenter", authorKey: "river" });
  assert.equal(store.list("juniper")[0].text, "Edited by author");
  assert.equal(store.list("river")[0].comments[0].text, "Edited by commenter");
  assert.equal(store.list("river")[0].canEdit, false);
});

test("validates text length, serializes writes, persists across reloads, and cascades post deletion", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-feed-persist-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, "community.json");
  const store = createCommunityStore(file);
  await store.load();
  await assert.rejects(store.createPost({ text: "   " }), { status: 400 });
  await assert.rejects(store.createComment({ postId: "missing", text: "x".repeat(2001) }), { status: 400 });

  const [firstId, secondId] = await Promise.all([
    store.createPost({ text: "First" }),
    store.createPost({ text: "Second" }),
  ]);
  const childId = await store.createComment({ postId: firstId, text: "Reply" });
  const saved = JSON.parse(await readFile(file, "utf8"));
  assert.equal(saved.length, 2);
  assert.equal(saved.find((post) => post.id === firstId).comments[0].id, childId);

  const reloaded = createCommunityStore(file);
  await reloaded.load();
  assert.equal(reloaded.list().length, 2);
  await reloaded.deletePost({ postId: firstId, isModerator: true });
  assert.deepEqual(reloaded.list().map((post) => post.id), [secondId]);
  assert.equal(JSON.parse(await readFile(file, "utf8")).some((post) => post.id === firstId), false);
});

test("accountless posts and comments are anonymous and cannot be managed by an unsigned author", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-feed-guest-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createCommunityStore(path.join(directory, "community.json"));
  await store.load();
  const postId = await store.createPost({ text: "Guest post" });
  const commentId = await store.createComment({ postId, text: "Guest comment" });
  assert.equal(store.list()[0].author, "Anonymous");
  assert.equal(store.list()[0].comments[0].author, "Anonymous");
  assert.equal(store.listForModeration()[0].author, "Anonymous guest");
  await assert.rejects(store.updatePost({ postId, text: "Edit", authorKey: null }), { status: 403 });
  await assert.rejects(store.deleteComment({ postId, commentId, authorKey: null }), { status: 403 });
});

test("AI review state persists privately, rejects stale results, and resets after edits", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-ai-review-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, "community.json");
  const store = createCommunityStore(file);
  await store.load();
  const postId = await store.createPost({ text: "original", aiEnabled: true });
  assert.equal(store.listAiChecks()[0].text, "original");
  await store.updatePost({ postId, text: "edited", isModerator: true, aiEnabled: true });
  assert.equal(await store.setAiReview({ itemType: "post", postId, status: "flagged", reason: "stale", expectedText: "original" }), false);
  assert.equal(await store.setAiReview({ itemType: "post", postId, status: "flagged", reason: "review this", severity: "high", expectedText: "edited" }), true);
  assert.equal(store.listForModeration()[0].aiReview.status, "flagged");
  assert.equal(store.listForModeration()[0].aiReview.severity, "high");
  assert.equal("aiReview" in store.list()[0], false);
  await store.markAiReviewed({ itemType: "post", postId });
  assert.equal(store.listForModeration()[0].aiReview.status, "reviewed");
  const reloaded = createCommunityStore(file);
  await reloaded.load();
  assert.equal(reloaded.listForModeration()[0].aiReview.reason, "review this");
  await reloaded.updatePost({ postId, text: "new edit", isModerator: true, aiEnabled: true });
  assert.equal(reloaded.listForModeration()[0].aiReview.status, "pending");
});
