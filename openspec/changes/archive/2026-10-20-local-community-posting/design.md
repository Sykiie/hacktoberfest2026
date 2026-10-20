# Design

## Context

See [proposal.md](proposal.md) for motivation and [the community-feed](specs/community-feed/spec.md) and [host-moderation](specs/host-moderation/spec.md) specs for behavior. The app is a single Express host with a React guest app, local JSON files for owner and user accounts, in-memory account/admin sessions, and LAN listeners that exist only while hosting is enabled. Admin APIs are restricted to loopback.

## Goals / Non-Goals

**Goals:**
- Keep one authoritative feed shared by guest devices and the host computer.
- Keep accountless participation open while enforcing ownership for signed-in users' edits and deletes.
- Prevent anonymous account identities from being exposed by public feed APIs.
- Require fresh owner password confirmation before a host sees account identities or moderates any contribution.

**Non-Goals:**
- Reactions, notes, attachments, private messages, accountless guest edit/delete, or multiple hosted communities.
- HTTPS, independent second-factor authentication, or content access outside the venue host and its reachable LAN.

## Decisions

### Store posts and comments together on the host

Use a new `data/community.json` store so the feed survives process restarts and remains local to one host. Model posts with IDs, text, timestamps, signed-in owner key (nullable for accountless visitors), public-anonymous flag, and embedded comments with the same author fields. Enforce non-empty plain text with a 2,000-character maximum for posts and comments. Serialize mutations in the single Node process, re-check authorization and parent records immediately before writing, and replace the file through a temporary file. Deleting a post removes its comments with it.

This follows the current file-based prototype and avoids a new database dependency. A database would provide better querying and concurrency if the feed grows, but is unnecessary for one low-volume venue host in this milestone.

### Keep public and moderation data projections separate

Expose the guest feed through public community APIs served by the existing loopback listener and, only while hosting is enabled, the LAN listeners. Build public response objects from an allowlist: when a signed-in author chooses anonymous display, omit the account key and username entirely and return only the Anonymous display label. Include a per-item `canEdit` result for the current signed-in author, but never trust it for authorization; enforce edit/delete ownership again on the server. Accountless authors have no edit/delete capability.

Use the venue-local account's stable normalized username as the owner key because the current account system has no username-change flow. The host participates publicly by signing in to a regular venue-local user account. Admin credentials never become public-feed identity or grant public author ownership.

### Keep host moderation under local admin routes

Add the moderation panel to the existing `/admin` experience, but keep its anonymous-author data out of the guest app and public API. Require both the existing owner session and a fresh password confirmation before returning identities or accepting moderation edits/deletes. Enforce loopback access, owner authentication, and the fresh confirmation on every moderation API request; do not rely on a hidden link or route.

Treat password re-entry as step-up confirmation, not as an independent second factor. Issue a separate in-memory moderation grant tied to the active admin session, expiring after ten minutes without moderation activity and on owner sign-out or server restart. The grant cookie is HttpOnly and SameSite Strict. This short window avoids repeated prompts while reducing exposure if the host is left unattended.

The confirmed moderation projection may show signed-in usernames for anonymously displayed posts/comments; accountless contributions remain labeled as anonymous guests. Host edits preserve the original author and public anonymity setting, and update the modification timestamp. Owner password confirmation errors do not disclose community content.

### Keep text rendering inert

Render submitted post and comment text as text in React and never treat it as HTML. Validate text length and emptiness on the server even when the UI also validates it. This keeps plain-text discussion from becoming a markup or script injection path.

## Risks / Trade-offs

- [A JSON file has limited scale and cross-process coordination] → Keep one host process, serialize all content mutations, and document the host-local store; move to a database if scale or multiple workers become necessary.
- [Anonymous public labels are not anonymity from the venue owner] → Disclose in the interface that signed-in anonymous posts remain identifiable to the reauthenticated owner; omit identities from every public response.
- [Passwords and content travel over HTTP] → Preserve the existing prototype warning and unique-password recommendation; keep admin/moderation APIs on loopback and require owner password confirmation before identity reveal.
- [Accountless guests can publish content but cannot later reclaim or remove it] → State this beside the composer; the owner can remove accountless contributions through moderation.
- [An expired moderation grant interrupts review] → Tell the owner to re-enter the admin password and restore the host-only view without losing content.

## Migration Plan

Create `data/community.json` when the first post or comment is submitted; existing account and owner files remain unchanged. On rollback, stop serving feed and moderation APIs but leave community data on the host. Do not delete stored posts or comments automatically.
