# Design

## Context

The host dashboard currently renders its brand, hosting status, and Sign out in `admin-header`, followed by an intro and a three-tab `admin-tabs` row. The Community section renders `AdminModeration`, whose Feed, Noteboard, and Accounts selection is local state. See `proposal.md` and the `community-interface` spec delta for the user-facing contract.

## Goals / Non-Goals

**Goals:**

- Put the host menu at the upper left and center the three primary host tabs in the dashboard's top navigation area.
- Make menu selections activate the matching moderation view within Community.
- Preserve current owner authentication, host status visibility, and keyboard accessibility.
- Keep the navigation legible on narrow screens.

**Non-Goals:**

- Change visitor-facing navigation, community module settings, moderation behavior, or authentication APIs.
- Add a routing library or external UI dependency.

## Decisions

- Use the existing dashboard header as a three-region layout: menu/brand on the left, primary tabs centered, and hosting status on the right. Keep the dashboard intro below this navigation.
- Keep the existing Feed, Noteboard, and Accounts moderation tabs inside Community and keep sign-out as a standalone header action wired to the existing `logout` handler.
- In the visitor community header, use the signed-in username as the native account-menu trigger. Place Profile image, Remove image, and Sign out actions inside it; keep the guest Sign in action visible for unauthenticated visitors.
- Show the dashboard intro only on Hosting. Use two-column grids for Community Identity with Host Participation and Owner Security with Feed Moderation.
- Render Guest Access first in the Hosting grid and the QR join panel to its right on desktop. When hosting is off, let Guest Access use the full row because the QR panel is not available. Use the generated PNG data URL as a direct browser download for Save QR code.
- At small widths, keep the three primary tabs visible in a compact full-width row and stack all paired cards into one column.

## Risks / Trade-offs

- [A centered tab row can drift when left and right header content have different widths] -> Use a three-column grid with a flexible center column rather than relying on `space-between`.
- [The QR panel and Guest Access card can become cramped side by side] -> Switch to a single-column layout at the existing mobile breakpoint.
- [A Community Identity card may not exist before a venue community is configured] -> Let Host Participation span the available row until identity settings can be displayed.

## Migration Plan

No data or API migration is required. Replace the existing header placement and connect menu actions to the current dashboard state. Rollback consists of restoring the prior header and local moderation tab selection.
