export const COMMUNITY_MODULES = Object.freeze([
  Object.freeze({ id: "feed", label: "Shared Feed", enabledByDefault: true }),
  Object.freeze({ id: "noteboard", label: "Noteboard", enabledByDefault: true }),
]);

export const DEFAULT_COMMUNITY_MODULE_IDS = Object.freeze(
  COMMUNITY_MODULES.filter((module) => module.enabledByDefault).map((module) => module.id),
);

export const VENUE_TYPES = Object.freeze([
  "Cafe",
  "Library",
  "Coworking Space",
  "Community Center",
  "Other",
]);

export const CUSTOM_VENUE_TYPE = "Other";
