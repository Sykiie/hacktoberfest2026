# Tasks

## 1. Guest entry and shared feed

- [x] 1.1 Separate account entry from feed rendering: show sign-in, create-account, and Continue as guest before loading the feed; transition to the feed after login, registration, or guest selection, and resume directly when a valid session exists. Verify entry and transitions with UI/API tests, `npm test`, and `npm run build`.
- [x] 1.2 Update README guest instructions to explain the entry choices and returning signed-in behavior; verify the documented flow matches the UI.

## 2. Tabbed host dashboard and moderation

- [x] 2.1 Organize the authenticated host dashboard into accessible Hosting, Community, and Security tabs; move hosting/QR, moderation, and password controls into their panels. Verify only the selected panel is displayed and the production UI builds.
- [x] 2.2 Remove moderation password reauthentication and its in-memory grant/cookie; protect moderation reads and mutations with the existing loopback restriction and authenticated owner session. Verify an authenticated owner succeeds without a second prompt, unauthenticated and LAN access fail, and sign-out/restart still invalidate the owner session.
- [x] 2.3 Present host moderation in a feed-style interface with private usernames and owner edit/delete controls; keep public participation linked to the shared feed with a regular venue account. Update README and verify moderation display, mutations, and account separation.

## 3. Integration verification

- [x] 3.1 Verify guest entry, account and guest feed access, tab navigation, moderation identity visibility, author/admin permissions, LAN denial, hosting disable behavior, and persistence; run `npm test`, `npm run build`, and strict OpenSpec validation.
