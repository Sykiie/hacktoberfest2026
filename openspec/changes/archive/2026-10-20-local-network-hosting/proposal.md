# Proposal

## Why

Local Community needs a reliable way to run from a computer at a venue and be opened by other devices on that venue's Wi-Fi before community features can be built. This milestone proves local network reachability and gives venue owners a clear way to share the address.

## What Changes

- Add a self-hosted mode that serves the web app from a venue computer to devices that can reach it over the local network.
- Use React for the web interface and show the host's usable local network address with a QR code that points to that address.
- Document the host and network prerequisites, including allowing local device-to-device traffic through the venue Wi-Fi.
- Make clear that network reachability limits access to devices on an allowed network but does not verify a person's physical presence.
- Defer community features, accounts, cloud hosting, internet access, and venue management beyond a single hosted instance.

## Capabilities

### New Capabilities

- `local-network-access`: Run the app on a venue computer and let reachable devices on the same local network open it through a shared local address.

### Modified Capabilities

None.

## Impact

- Affected areas: app server startup/binding, local address discovery and display, QR/join-link generation, and host setup documentation.
- No app implementation exists yet. The eventual implementation will need to account for host firewall rules and Wi-Fi client isolation, which can prevent devices on the same Wi-Fi from reaching one another.
- No cloud service or external identity provider is required for this milestone.
