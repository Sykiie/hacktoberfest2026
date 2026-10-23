# Design

## Context

Host state is currently kept in memory for network hosting, while owner credentials, community posts, user accounts, and noteboard content are stored as separate JSON files under the host data directory. The guest interface currently renders Shared Feed and Noteboard unconditionally. See proposal.md for motivation and the spec deltas for required behavior.

## Goals / Non-Goals

**Goals:**
- Persist one community record per installation with venue type, venue name, and enabled module identifiers.
- Make the current community state available to authenticated host controls and the guest interface.
- Gate enabling guest network listeners on community existence.
- Ensure confirmed deletion disables hosting and removes community data while preserving owner authentication.

**Non-Goals:**
- Multiple communities, venue-type catalogs beyond Cafe and a per-community custom type, or new community modules.
- Changes to owner authentication or the existing guest account model.

## Decisions

- Store community settings in a dedicated JSON file in the existing data directory. A missing file represents an installation with no community, which supports existing installations without migration. Validate venue type, venue name, and a non-empty subset of the supported module identifiers on create and update.
- Expose the community record and existence state through the authenticated admin status/API flow. Keep create, update, and delete operations owner-only and host-loopback-only, matching existing admin security boundaries.
- Use a prompt-style modal wizard in the host dashboard. The Hosting panel shows Create community when the status says none exists, and Edit/Delete actions for an existing community. Starting enable hosting without a community opens the same create wizard and resumes enabling after a successful save.
- Make the guest module tabs data-driven from the enabled module identifiers. Keep each module's existing content and only change which modules are navigable.
- Permit community deletion only after guest hosting has been disabled. The delete prompt requires the current owner password, verified with the existing owner-auth mechanism, before clearing community-specific persisted stores (posts, user accounts, notes, and noteboard audit history) and removing the community settings record. Preserve the owner credential file. Store APIs should expose reset operations so in-memory state and files are cleared together; return an error if any part of deletion fails rather than reporting success.
- Treat both existing modules as selected in the initial create wizard, matching today's default behavior. Require at least one selected module so a configured community always has a guest-facing feature.

## Risks / Trade-offs

- [Deletion spans several files] → Require hosting to be off and the owner password to be correct before deletion; make each store reset operation persist an empty state before removing the community record, and surface failures to the owner.
- [Older installations have no community record] → Treat the missing record as unconfigured and present the create action after owner sign-in; do not alter existing data until the host explicitly creates or deletes a community.
- [Module selection can leave stale tab state] → When the selected module is disabled, move guest navigation to the first enabled module.

## Migration Plan

No migration is required. Existing installations will load with no community configured and must create one before enabling guest hosting. Rollback can remove the community settings file; community data already cleared by a confirmed deletion cannot be recovered.

## Open Questions

None.
