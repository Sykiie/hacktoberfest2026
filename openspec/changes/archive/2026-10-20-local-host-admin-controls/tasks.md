# Tasks

## 1. Confirm the first milestone foundation

- [x] 1.1 Complete and verify `local-network-hosting`; confirm the host process opens locally and a second device can reach its private LAN address before adding the admin toggle.

## 2. Add host-only admin authentication

- [x] 2.1 Seed the default owner password `locomi` as a salted hash and allow the authenticated owner to change it; verify default login, invalid login, password change, and restart behavior with automated tests.
- [x] 2.2 Enforce loopback access on admin pages and every admin API action at the server; verify LAN requests to admin routes are denied by automated tests.
- [x] 2.3 Document the default password, how to change it after sign-in, and local-only admin access; verify the README steps match the implemented flow.

## 3. Control LAN hosting state

- [x] 3.1 Initialize LAN hosting as disabled on every process start while keeping the loopback admin interface available; verify startup state and restart behavior with automated tests.
- [x] 3.2 Implement authenticated enable/disable actions that open and close private LAN listeners without stopping the host process; verify enabled clients connect, disabled clients cannot connect, and localhost admin remains available.
- [x] 3.3 Show the guest join URL and QR only while hosting is enabled, using the current private address and guest route; verify the QR encodes the displayed URL and refreshes after address changes.
- [x] 3.4 Document how the owner enables and disables LAN access and explain that restarting returns it to disabled; verify the host setup guide is accurate.

## 4. Add the separate guest welcome interface

- [x] 4.1 Replace the shared host/guest screen with a local `/admin` interface and a separate `/` guest welcome screen; verify both React routes build and render independently.
- [x] 4.2 Add a host-only preview action that opens the guest welcome screen through loopback while hosting is off or on; verify it works without enabling LAN listeners.
- [x] 4.3 Keep the guest view limited to a welcome message with no accounts, posts, notes, comments, or reactions; verify the screen and its setup documentation describe this scope.

## 5. Verify the complete hosting lifecycle

- [x] 5.1 Perform a manual second-device check: start disabled, enable hosting locally, open the guest QR/link, disable hosting, confirm the guest can no longer connect, and confirm the host can still use admin and preview locally.
