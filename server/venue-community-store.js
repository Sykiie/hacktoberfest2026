import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { COMMUNITY_MODULES, CUSTOM_VENUE_TYPE, VENUE_TYPES } from "../shared/community-options.js";

const MODULE_IDS = new Set(COMMUNITY_MODULES.map((module) => module.id));

function invalid(message) {
  return Object.assign(new TypeError(message), { status: 400 });
}

export function normalizeVenueCommunity(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw invalid("Enter community details.");
  if (!VENUE_TYPES.includes(input.venueType)) throw invalid("Choose a supported venue type.");

  const venueName = typeof input.venueName === "string" ? input.venueName.trim() : "";
  if (!venueName) throw invalid("Enter a venue name.");
  if (venueName.length > 80) throw invalid("Venue names must be 80 characters or fewer.");

  const customVenueType = input.venueType === CUSTOM_VENUE_TYPE && typeof input.customVenueType === "string"
    ? input.customVenueType.trim()
    : "";
  if (input.venueType === CUSTOM_VENUE_TYPE && !customVenueType) throw invalid("Enter a custom venue type.");
  if (customVenueType.length > 60) throw invalid("Custom venue types must be 60 characters or fewer.");

  if (!Array.isArray(input.enabledModules) || input.enabledModules.some((module) => !MODULE_IDS.has(module))) {
    throw invalid("Choose valid community modules.");
  }
  const enabledModules = COMMUNITY_MODULES.filter((module) => input.enabledModules.includes(module.id)).map((module) => module.id);
  if (enabledModules.length === 0) throw invalid("Enable at least one community feature.");

  return { venueType: input.venueType, customVenueType, venueName, enabledModules };
}

export function createVenueCommunityStore(filePath) {
  let community = null;
  let queue = Promise.resolve();

  async function load() {
    try {
      const saved = JSON.parse(await readFile(filePath, "utf8"));
      community = normalizeVenueCommunity(saved);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  async function persist(value) {
    await mkdir(path.dirname(filePath), { recursive: true });
    const temporaryFile = `${filePath}.${randomBytes(8).toString("hex")}.tmp`;
    try {
      if (value === null) {
        await unlink(filePath).catch((error) => { if (error.code !== "ENOENT") throw error; });
      } else {
        await writeFile(temporaryFile, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
        await rename(temporaryFile, filePath);
      }
    } catch (error) {
      await unlink(temporaryFile).catch(() => {});
      throw error;
    }
  }

  async function mutate(operation) {
    let release;
    const previous = queue;
    queue = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      const result = await operation();
      return result;
    } finally {
      release();
    }
  }

  async function create(input) {
    const next = normalizeVenueCommunity(input);
    return mutate(async () => {
      if (community) throw Object.assign(new Error("A community already exists on this host."), { status: 409 });
      await persist(next);
      community = next;
      return structuredClone(community);
    });
  }

  async function update(input) {
    const next = normalizeVenueCommunity(input);
    return mutate(async () => {
      if (!community) throw Object.assign(new Error("Create a community before editing it."), { status: 404 });
      await persist(next);
      community = next;
      return structuredClone(community);
    });
  }

  async function remove() {
    return mutate(async () => {
      await persist(null);
      community = null;
    });
  }

  return {
    load,
    get: () => community ? structuredClone(community) : null,
    exists: () => Boolean(community),
    create,
    update,
    remove,
  };
}
