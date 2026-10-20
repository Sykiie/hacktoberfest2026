# Proposal

## Why

The guest screen currently exposes the feed before a visitor chooses how to enter, and the host dashboard puts all controls on one long page. The host also has to enter the admin password a second time to reach moderation, even though the local admin session already protects that view.

## What Changes

- Make sign-in, account creation, and **Continue as guest** the unauthenticated entry screen; show the shared feed only after one of these choices. An already signed-in user can return directly to the feed.
- Organize host controls into tabs for hosting and QR access, community moderation, and security settings.
- Show the host a moderation feed that resembles the shared feed, reveals signed-in identities, and provides controls to edit or delete any post or comment.
- Remove the second admin-password prompt for moderation. Keep the existing host admin sign-in and loopback-only restriction.
- Keep public host posts and comments tied to a regular venue-local account, separate from the owner admin credentials.

## Capabilities

### New Capabilities

- `community-interface`: Guest entry flow and tabbed host dashboard for the community.
- `host-moderation`: Loopback-only moderation feed available to an authenticated host admin without an additional password prompt.

### Modified Capabilities

None. This project has no durable main specs yet; these capabilities establish the behavior for future changes.

## Impact

- Affected UI: `src/App.jsx` and `src/styles.css`.
- Affected server behavior: remove the step-up moderation grant flow while retaining owner authentication and loopback checks in `server/host.js`; remove `server/moderation-auth.js` if no longer used.
- Affected tests: guest entry/feed access, host tab navigation, moderation access and LAN denial, and regular-account host participation.
- Affected documentation: setup, guest sign-in/anonymous entry, host tabs, and moderation behavior in `README.md`.
