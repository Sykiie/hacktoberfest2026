import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createProfileImageStore, MAX_PROFILE_IMAGE_SIZE } from "../server/profile-image-store.js";

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

test("profile image store validates type and size and keeps a valid image after rejected replacements", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-images-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createProfileImageStore(directory);
  await assert.rejects(store.save("../bad", png, "image/png"), { status: 404 });
  await store.save("member_1", png, "image/png");
  await assert.rejects(store.save("member_1", Buffer.from("not an image"), "image/png"), { status: 415 });
  await assert.rejects(store.save("member_1", Buffer.alloc(MAX_PROFILE_IMAGE_SIZE + 1, 1), "image/png"), { status: 413 });
  assert.deepEqual(await readFile(path.join(directory, "member_1.image")), png);
  assert.equal((await store.read("member_1")).contentType, "image/png");
});

test("profile image store removes images and safely replaces valid uploads", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-community-images-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createProfileImageStore(directory);
  await store.save("venue", png, "image/png");
  const replacement = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
  await store.save("venue", replacement, "image/jpeg");
  assert.deepEqual((await store.read("venue")).buffer, replacement);
  await store.remove("venue");
  assert.equal(await store.read("venue"), null);
});
