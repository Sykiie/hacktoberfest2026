# Proposal

## Why

Host controls and moderation destinations are spread across the dashboard, making the main areas harder to scan and moderation views less direct to reach. A clear top-level navigation and a compact upper-left menu will make the host interface easier to move through.

## What Changes

- Place Hosting, Community, and Security in a centered primary navigation at the top of the host dashboard.
- Keep Feed, Noteboard, and Accounts in the Community moderation tabs.
- Keep Sign out available as a standalone action in the upper-right header.
- When guest hosting is enabled, place the QR join panel to the right of Guest Access and let the host save the QR image as a PNG.
- Show the Community Identity and Host Participation cards in a two-column Community layout, and remove the Hosting intro from Community and Security.
- Show Owner Security and Feed Moderation cards in a two-column Security layout.
- Keep moderation destinations protected by the existing authenticated owner session and host-only access rules.
- Keep the navigation usable with keyboard input and at narrow viewport widths; stack paired cards on small screens.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `community-interface`: Specify the host dashboard's primary navigation, upper-left menu, and routing from menu destinations to moderation views.
- `user-authentication`: Specify the signed-in community account dropdown and its account actions.

## Impact

- Host dashboard and signed-in community account navigation in `src/App.jsx` and their responsive styling in `src/styles.css`.
- No API or dependency changes are expected. Existing moderation components and authentication remain in use.
