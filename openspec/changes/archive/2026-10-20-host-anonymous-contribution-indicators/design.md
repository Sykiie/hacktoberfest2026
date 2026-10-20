# Design

## Context

The host moderation API already returns each signed-in contribution's username and `anonymous` flag. The moderation React component renders the username but does not currently render that flag. See proposal.md and specs/host-moderation/spec.md for the required behavior.

## Goals / Non-Goals

**Goals:**
- Make the author's public anonymity choice obvious to the host while retaining the username for moderation.
- Apply the same visual meaning to posts and comments.
- Keep accountless guest identities distinct from signed-in users who chose anonymity.

**Non-Goals:**
- Change guest-visible author labels or anonymity controls.
- Change moderation API responses, storage, or identity permissions.

## Decisions

- Render a short textual badge such as “Anonymous to guests” beside a signed-in username when the contribution's existing `anonymous` flag is true. Text makes the meaning clear without relying on color or an icon alone.
- Apply the same conditional to post authors and comment authors so the host sees a consistent status for either contribution type.
- Do not show this badge for accountless guest contributions, which remain labeled “Anonymous guest”; do not show it for signed-in contributions made public under the username.
- Reuse the existing moderation response fields rather than adding API data, because it already separates public anonymity from the host-visible account identity.

## Risks / Trade-offs

- A badge may make moderation rows denser on narrow screens → Keep the label short and allow it to wrap with the existing author metadata.
- The anonymity flag could be confused with accountless authorship → Preserve the distinct “Anonymous guest” label and reserve the badge for signed-in authors.
