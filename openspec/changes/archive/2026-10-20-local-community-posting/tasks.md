# Tasks

## 1. Persistent community content and APIs

- [x] 1.1 Add the host-local post/comment store with non-empty text validation, 2,000-character limits, serialized atomic writes, restart persistence, and cascade deletion; verify unit tests cover limits, concurrent mutations, persistence, and deleting comments with a post.
- [x] 1.2 Add public feed, post, and comment APIs for anonymous and signed-in visitors; ensure public responses omit linked identities for anonymous contributions and server-side ownership checks restrict author edits/deletes; verify tests cover create/read/edit/delete, identity filtering, accountless denial, and cross-author denial.

## 2. Guest and participant feed

- [x] 2.1 Replace the welcome-only guest page with the shared newest-first text feed, post composer, and inline comments for both signed-in and anonymous visitors; verify `npm run build` and host API tests confirm feed access follows the LAN hosting lifecycle.
- [x] 2.2 Add per-post and per-comment anonymous display toggles, signed-in author edit/delete controls, and clear accountless guest limitations; update the README and verify the UI build and feed authorization tests.

## 3. Host participation and private moderation

- [x] 3.1 Let the host join the public feed using a regular venue-local account, keeping owner admin credentials separate; verify the host account can create posts and comments through the loopback preview.
- [x] 3.2 Add server-verified owner password reauthentication and an expiring moderation grant bound to the owner session; verify correct/incorrect password, grant expiration, sign-out, and restart cases with automated tests.
- [x] 3.3 Add the loopback-only hidden moderation feed that reveals signed-in identities and lets the host edit/delete any post or comment; update the README and verify LAN requests cannot access moderation routes and moderation operations require the fresh owner confirmation.

## 4. End-to-end verification

- [x] 4.1 Verify anonymous and signed-in post/comment flows, author identity visibility, author and admin edit/delete permissions, deletion cascades, restart persistence, host-only moderation, and hosting disable behavior; run `npm test`, `npm run build`, and strict OpenSpec validation.
