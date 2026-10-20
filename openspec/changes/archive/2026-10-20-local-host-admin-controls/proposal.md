# Proposal

## Why

Once the app can be reached over venue Wi-Fi, the owner needs a private way to decide when guests can connect. A separate guest welcome screen also makes it clear that visitors are joining the venue community rather than viewing the host's control panel.

## What Changes

- Add a single admin login available only from the host computer. Fresh installs use the default password `locomi`, which the owner can change after signing in.
- Start each host process with LAN access disabled; after signing in locally, the admin can enable or disable LAN hosting without stopping the local admin screen.
- Let the host preview the guest-facing interface from the host computer, whether LAN hosting is enabled or disabled.
- Direct the join QR code and link to a separate, simple guest welcome screen while LAN hosting is enabled.
- Keep posts, notes, comments, reactions, additional accounts, and remote administration out of this milestone.

## Capabilities

### New Capabilities

- `host-administration`: Local-only admin authentication and control of whether the host accepts connections over the venue LAN.
- `guest-welcome`: A simple guest-facing welcome screen opened from the join link and previewable on the host computer.

### Modified Capabilities

None. The first milestone's `local-network-access` capability is still an unarchived change, not an existing main spec. This milestone builds on its LAN server and join-link behavior.

## Impact

- Affected areas: host server listener lifecycle, local-only admin routes and session handling, the React admin screen, a separate guest welcome route, and the QR/link target.
- Depends on the `local-network-hosting` milestone providing a runnable server and local network addresses.
- Fresh installs seed one owner credential with a salted password hash; the owner can change the password after signing in. This does not add general user accounts or cloud services.
