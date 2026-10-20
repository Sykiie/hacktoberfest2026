# Design

## Context

See proposal.md for motivation and the spec files for observable behavior. The current React guest component renders account choices and the feed together. The owner dashboard stacks hosting, QR, password, and moderation controls. Moderation routes currently require an additional in-memory grant after owner sign-in, while the `/api/admin` middleware already restricts those routes to loopback requests.

The project currently has no durable `openspec/specs/` capabilities. This change establishes community-interface and host-moderation as new capabilities and supersedes the earlier change's step-up-password behavior.

## Goals / Non-Goals

**Goals:**

- Separate the guest entry choice from the feed rendering state.
- Make host controls navigable without presenting all sections in one long page.
- Reuse the community's post/comment presentation in a private host view while showing moderation-only identity and actions.
- Reduce moderation access checks to the existing owner session and loopback boundary.

**Non-Goals:**

- Let owner admin credentials create public posts or comments.
- Change the guest account model, post data format, hosting lifecycle, or community APIs.
- Add a second-factor authentication flow or a public moderation route.

## Decisions

### Use an explicit guest entry state before rendering the feed

Keep a small entry mode in the guest UI: account entry or community feed. A successful login, successful registration, or **Continue as guest** transitions to the feed. The existing session endpoint allows a valid returning user to start in the feed. Keep account actions such as sign-out accessible from the feed header. This avoids loading or exposing community content before an unauthenticated visitor makes an entry choice.

Alternative considered: leave the feed mounted but blur or cover it with an account prompt. That would still fetch and render feed data before the choice, so it does not meet the requested entry behavior.

### Use three in-page host tabs

Add tab state and accessible tab controls to the authenticated dashboard. Place hosting controls and the QR code in **Hosting**, the identity-revealing moderator feed and a link to public participation in **Community**, and owner password controls in **Security**. Render only the selected panel, defaulting to **Hosting**. Keep tabs in the local React view rather than introducing a routing dependency; the admin page remains loopback-only.

Alternative considered: split each section into a separate URL. That adds route handling and history behavior without a current need for deep links.

### Reuse the feed presentation for owner moderation

Keep public and moderation data APIs separate because the moderation response reveals linked usernames. Use the same post/comment card structure in both views, with a moderation mode that displays owner actions and the private author labels. The host's public participation link opens the regular feed, where the owner signs in with or creates a venue-local user account.

Alternative considered: use the public feed API for moderation and add a hidden identity toggle in the client. That would require exposing linked identity data to the public response and weaken the privacy boundary.

### Use the existing owner session for moderation authorization

Remove the moderation unlock endpoint, grant cookie, in-memory expiry map, and `requireModeration` middleware. Continue to apply the existing loopback restriction to all `/api/admin` routes and require the owner session for moderation reads and mutations. This honors the explicit request to remove the second password prompt while keeping the host-only boundary.

Alternative considered: retain password re-entry with a shorter or persistent grant. That preserves a prompt the owner asked to remove and adds state the UI no longer needs.

## Risks / Trade-offs

- [A stolen or unattended owner session can reach moderation without a second password check] → Keep moderation behind loopback and the authenticated owner session; sign out when leaving the host computer.
- [Visitors may refresh while using guest mode and see the entry screen again] → Guest continuation is intentionally a per-page choice; a guest can select it again, while signed-in users resume through their session.
- [A tabbed interface may be less discoverable than a long page] → Use clear tab names, an active indicator, and accessible tab semantics.

## Migration Plan

No content migration is required. The existing owner session remains the only credential for the admin dashboard. Existing moderation grant cookies become unused and expire naturally; previously stored posts and comments are unchanged. If the UI change must be rolled back, restore the previous stacked dashboard and step-up moderation guard together so the interface and API authorization stay aligned.
