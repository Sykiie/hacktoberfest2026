import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createVenueCommunityStore } from "../server/venue-community-store.js";

test("creates and reloads a Cafe community with selected modules", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-venue-community-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, "venue-community.json");
  const store = createVenueCommunityStore(file);
  await store.load();
  assert.equal(store.exists(), false);

  const created = await store.create({ venueType: "Cafe", venueName: "  The Green Cup ", enabledModules: ["noteboard", "feed"] });
  assert.deepEqual(created, { venueType: "Cafe", customVenueType: "", venueName: "The Green Cup", enabledModules: ["feed", "noteboard"] });
  assert.deepEqual(JSON.parse(await readFile(file, "utf8")), created);

  const reloaded = createVenueCommunityStore(file);
  await reloaded.load();
  assert.deepEqual(reloaded.get(), created);
});

test("requires a custom type for Other and validates names and module selection", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-venue-community-validation-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createVenueCommunityStore(path.join(directory, "venue-community.json"));
  await store.load();

  await assert.rejects(store.create({ venueType: "Other", venueName: "Gallery", enabledModules: ["feed"] }), { status: 400 });
  await assert.rejects(store.create({ venueType: "Cafe", venueName: "  ", enabledModules: ["feed"] }), { status: 400 });
  await assert.rejects(store.create({ venueType: "Cafe", venueName: "Cafe", enabledModules: [] }), { status: 400 });
  await assert.rejects(store.create({ venueType: "Cafe", venueName: "Cafe", enabledModules: ["unknown"] }), { status: 400 });

  const created = await store.create({ venueType: "Other", customVenueType: "  Bookshop  ", venueName: "  Pages ", enabledModules: ["feed"] });
  assert.deepEqual(created, { venueType: "Other", customVenueType: "Bookshop", venueName: "Pages", enabledModules: ["feed"] });
  await assert.rejects(store.create({ venueType: "Cafe", venueName: "Second", enabledModules: ["feed"] }), { status: 409 });
  await assert.rejects(store.update({ venueType: "Other", customVenueType: " ", venueName: "Pages", enabledModules: ["feed"] }), { status: 400 });
});

test("updates and removes the configured community", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "local-venue-community-lifecycle-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, "venue-community.json");
  const store = createVenueCommunityStore(file);
  await store.load();
  await store.create({ venueType: "Cafe", venueName: "First", enabledModules: ["feed"] });
  await store.update({ venueType: "Other", customVenueType: "Library", venueName: "Second", enabledModules: ["noteboard"] });
  assert.equal(store.get().venueName, "Second");

  await store.remove();
  assert.equal(store.exists(), false);
  await assert.rejects(readFile(file, "utf8"), { code: "ENOENT" });
  await store.create({ venueType: "Cafe", venueName: "Replacement", enabledModules: ["feed"] });
  assert.equal(store.get().venueName, "Replacement");
});
