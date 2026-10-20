# Design

## Context

See [proposal.md](proposal.md) for motivation and [the local-network-access spec](specs/local-network-access/spec.md) for observable behavior. The repository currently contains no application code, so this change must establish the minimal runnable web app and its local hosting path. Host operating system, network interface, firewall, and Wi-Fi router settings are outside the app's control.

## Goals / Non-Goals

**Goals:**
- Keep the host computer as the only server and source of the app during this milestone.
- Give the owner a current local URL and QR code that encode the same destination.
- Make an actual cross-device connection the acceptance check, rather than treating the host's own browser as proof of LAN availability.

**Non-Goals:**
- Prove physical presence, identify users, or detect Wi-Fi association in the browser.
- Configure venue routers or silently change host firewall rules.
- Provide internet or cloud access, multiple venues, or community content features.

## Decisions

### Use React for the browser interface

Build the host screen as a React single-page app and serve its production build from the local host server. The server will also provide the selected join URL and a QR image generated from that same URL. This keeps the owner setup screen and the page opened by client devices on the same origin and avoids requiring a development server at the venue.

**Alternative considered:** Render the setup screen directly from the server. That would reduce frontend tooling, but the user has chosen React as the framework for the app.

### Serve from one host process on a venue LAN interface

The app's web server will run on the venue computer and listen on its local network interface at a documented port. It will not depend on a cloud relay or an external service. The host UI will advertise a private LAN address rather than `localhost`, since `localhost` on a client device points back to that client. If several private addresses are available, the implementation must provide a reliable way to select or identify the address on the venue Wi-Fi rather than silently presenting loopback or an unrelated public/VPN address.

**Alternative considered:** Require users to type a URL or configure a router manually. That makes the first connection harder to establish and share, so the app will show the address and QR code itself.

### Generate the QR code from the displayed URL

The QR code and copyable URL will come from one current join URL, including the server port. When the selected local address changes, both must update together. This avoids a QR code that points to a different endpoint than the one shown to the owner.

**Alternative considered:** Put a venue identifier or cloud redirect in the QR code. That would require internet infrastructure and is outside this local-only milestone.

### Treat network reachability as the access boundary

The user can open the app only when the host is running and their device can route to the host address and port. Setup instructions will cover host firewall permission and Wi-Fi client isolation. The app will not claim that this proves the user's physical location; a person with access to the same network may connect from elsewhere.

**Alternative considered:** Add browser location checks or Wi-Fi detection. Browsers do not expose a reliable Wi-Fi association check, and location would add permissions while still not proving network membership.

### Keep transport simple while no community data exists

The initial landing page and join flow can use HTTP on the local network because this milestone carries no accounts or community content. Do not collect secrets or sensitive user data in this milestone. Add transport security before introducing accounts or sensitive content.

**Alternative considered:** Require local HTTPS immediately. That requires certificate provisioning and trust setup on every client device, which is a substantial obstacle to proving the basic local connection.

## Risks / Trade-offs

- [Router guest isolation or host firewall blocks peer traffic] -> Explain how to allow local device-to-device access and validate with a second device; the app cannot override these settings.
- [Host has multiple adapters or its DHCP address changes] -> Advertise an active private LAN address and refresh the displayed URL and QR when address state changes; make the chosen interface visible to the owner.
- [HTTP traffic is observable to other devices on the network] -> Keep this milestone free of sensitive content and add HTTPS before accounts or sensitive community data.
- [Someone equates network access with venue presence] -> State in the interface and setup documentation that reachability is not physical-presence verification.

## Migration Plan

There is no existing application or deployed data to migrate. Start the host process, open the displayed local URL from another device on the venue Wi-Fi, and scan the QR code as an equivalent entry path. Rollback is stopping the host process and removing the new app files.
