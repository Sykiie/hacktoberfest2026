# Design

## Context

See [proposal.md](proposal.md) for motivation and the [host-administration](specs/host-administration/spec.md) and [guest-welcome](specs/guest-welcome/spec.md) specs for behavior. This milestone builds on `local-network-hosting`, which provides the host process and private LAN addresses. That first change is still in progress; the current server serves one React screen from both loopback and LAN listeners.

## Goals / Non-Goals

**Goals:**
- Keep the host process and loopback admin access alive while guest LAN access is disabled.
- Expose admin pages and actions only through a loopback connection.
- Route LAN join links to a distinct, simple welcome page.
- Let the host preview the welcome page locally whether or not guests can connect.

**Non-Goals:**
- Multiple administrators, guest accounts, password recovery, or remote administration.
- Persisting the hosting toggle across restarts; each process start begins disabled.
- Posts, notes, comments, reactions, or other community features on the guest page.
- HTTPS or sensitive guest data in this milestone.

## Decisions

### Keep loopback and LAN access as separate listeners

Keep a loopback listener available for the host admin UI and local guest preview. Start private LAN listeners only after an authenticated admin enables hosting, and close those listeners when hosting is disabled. The Node process remains running throughout so the host can log in and turn access back on. After every process start, initialize hosting as disabled.

**Alternative considered:** Stop and restart the whole process when toggling hosting. That would remove the control endpoint needed to turn hosting back on and would interrupt the local admin screen.

### Enforce the admin boundary in the server

Serve the admin page and its APIs only when the request arrived through the loopback listener. Check the server-side local connection address for every admin page and action; hiding admin links in React is not an access control. Guest requests through LAN listeners receive only the guest interface and guest-safe endpoints.

**Alternative considered:** Use a shared React app that hides controls based on the browser URL. That leaves admin endpoints reachable over the LAN and does not meet the host-only boundary.

### Seed a default owner credential and permit password changes

When no owner credential exists, initialize one using the default password `locomi` and store only its salted password hash in host-local data. Require local sign-in before hosting controls are available. Let the authenticated owner set a replacement password from the admin screen and persist its new salted hash. Use a process-local session with an HTTP-only, SameSite cookie; a server restart ends the session and also returns LAN hosting to disabled.

**Alternative considered:** Require an environment variable for the admin password. That makes initial setup and password changes less accessible to a venue owner.

### Separate admin and guest routes

Use `/admin` for the local owner screen and `/` for the simple guest welcome page. Generate the join QR and copyable URL from the current private host address plus `/`. From the admin screen, a preview option opens `/` on `127.0.0.1`; it works with LAN hosting disabled because loopback remains available. The QR is shown as usable only while LAN hosting is enabled.

**Alternative considered:** Reuse one route for both screens and select the view from the connecting interface. Separate routes make the QR destination explicit and reduce the chance of exposing owner controls to guests.

### Keep the guest welcome page free of sensitive data

The guest page contains only a basic welcome and venue/community identity. Admin authentication is local-only and the guest page has no account or private information. Add HTTPS before introducing sensitive content or any credential flow over the LAN.

**Alternative considered:** Add HTTPS and certificate distribution now. That would require each client device to trust a certificate and is unnecessary for a static welcome page with no credentials.

## Risks / Trade-offs

- [Admin route is accidentally served over a LAN listener] -> Enforce loopback access in server middleware and cover both pages and API actions with tests.
- [Host process restarts and owner expects guests to reconnect automatically] -> Start disabled deliberately and state this in host instructions; the owner signs in locally and enables hosting again.
- [Owner forgets the admin password after changing the default] -> Document that password recovery is out of scope for this milestone.
- [A guest keeps an old QR or URL after hosting is disabled] -> The network listener closes, so the old URL stops connecting; keep the admin page local to display current hosting state.

## Migration Plan

This change depends on the `local-network-hosting` milestone. After that host can start and advertise a private address, seed the default local owner credential and add the admin login and separate guest route. The owner can change the default password after signing in. Hosting remains disabled until the owner signs in and enables it. Rollback is to stop the process; the first milestone's direct LAN behavior must not be re-enabled as an implicit fallback.
