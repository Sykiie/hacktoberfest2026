# Design

## Context

The application is a locally hosted Node service with JSON-backed venue and account stores. Community account records currently contain authentication and moderation fields; venue configuration contains the venue type, name, and enabled modules. The guest interface already renders venue and member identities.

## Goals / Non-Goals

**Goals:**
- Store and serve venue and member images locally.
- Keep image ownership separate: the host manages the venue image, and members manage their own.
- Expose images publicly in the community interface with name-derived initials as the fallback.

**Non-Goals:**
- External image hosting, image galleries, or multiple images per profile.
- Profile editing for anonymous guests.

## Decisions

- Store one image per venue and one image per signed-in account in the host's local data directory. Keep image bytes separate from JSON configuration and account records; store a stable image reference or metadata in those records.
- Add authenticated upload, replacement, and removal operations for the venue and the current member. Public read operations serve only the profile image associated with the configured community or public member identity.
- Validate file type and size on the server, use generated storage names rather than user-supplied paths, and only publish a replacement after validation and persistence succeed. Reject unsupported types and oversized uploads; specific limits should be selected from the existing deployment's practical local storage needs during implementation.
- Use browser-rendered initials derived from venue name and account display username when the corresponding image is absent. For multiword names, use the first character of the first two words; for a single word, use its first character.
- Render the venue image in the guest-facing community identity area and member images beside authored posts, comments, and signed-in account identity where shown.

## Risks / Trade-offs

- Local image files can consume disk space → enforce conservative upload limits and replace or remove prior files when images change.
- Public images can reveal metadata embedded in uploaded files → normalize or strip metadata during image processing if a suitable existing dependency is available; otherwise document accepted image formats and avoid exposing original filenames.
- Image data and JSON references can get out of sync after an interrupted write → write new images to temporary files and update references only after persistence succeeds; clean up unreferenced temporary files on failure.

## Migration Plan

Existing venue and account records need no migration; missing image references use the initials fallback. Rollback can remove the new image routes and UI while leaving unreferenced image files for manual cleanup.
