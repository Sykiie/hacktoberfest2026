# Design

## Context

See proposal.md for the motivation and scope. The current host persists feed data in a local JSON file, persists community accounts separately, and holds account sessions in memory. Feed updates already use a server-sent event endpoint. The host administration Community tab currently contains feed moderation.

## Goals / Non-Goals

**Goals:**
- Keep the new board and its moderation data on the venue host.
- Preserve a stable shared board layout across screen sizes and connected visitors.
- Separate guest content review from final placement when the board changes during review.
- Enforce account freezes and note cooldowns on the server, not only in the interface.

**Non-Goals:**
- Add an administration module selector in this change; both modules remain enabled by default.
- Give accountless guests a persistent identity, deletion rights, or a global freeze.
- Allow authors to edit or move a published note.
- Add comments, reactions, attachments, or private messages to notes.

## Decisions

### Persist the noteboard independently from the feed
Store board notes, pending submissions, and moderation status in a host-local noteboard data file, separate from the existing feed data. Store the bounded audit history separately so clearing it cannot delete board content. Use the project's existing atomic JSON persistence pattern. Existing installations start with an empty board and empty audit history; existing feed data is unchanged.

### Use board-relative positions and server-side overlap validation
Represent each note position relative to a shared virtual board rather than storing browser pixel coordinates. Render the same virtual board responsively on phones and computers. Put the newest placed note above the notes it overlaps and limit combined coverage to 30% of each affected note. Calculate covered area as the union of all rectangles layered above each existing note, including the proposed note, so several overlaps cannot cumulatively cover more than the limit. Recheck on the server at approval and final placement to handle concurrent submissions and board changes.

### Keep guest review state and placement state separate
Persist timestamps and explicit states for review, approved placement, publication, rejection, and expiry. The review deadline is ten minutes from guest submission. A manual or automatic approval validates the proposed position; if it is no longer valid, retain the approved text and start a 30-minute replacement-placement window. Do not reserve a pending note's proposed board area, since that could block visitors while the host reviews it. Revalidate each replacement before publication.

Run deadline processing from persisted timestamps rather than relying only on in-memory timers, so the ten- and 30-minute rules remain correct after a host process restart. After automatic approval, flag the note for the host. Keep it unpublished while it awaits a valid replacement position; once placed, show the review flag in the Noteboard moderation view.

### Scope guest tokens to one pending note
Generate a high-entropy random token for each guest note submission. Give the token only the ability to retrieve that submission's status and complete an allowed replacement placement. Store a verifier for the token on the host rather than the raw token. Invalidate and remove the verifier when the submission is rejected, successfully published, or expires; the guest client also clears its copy when it learns that the submission is terminal. Do not use IP addresses or a long-lived browser identifier as guest identity.

This token does not let a guest delete a published note and cannot be used to freeze that guest across future submissions. A token presented after invalidation is rejected. Since the app currently uses HTTP, a capable local-network observer could intercept a pending token; limiting it to one pending note and its short lifetime limits its authority but does not remove that transport risk.

### Enforce signed-in cooldowns and freezes centrally
Persist a per-account note cooldown deadline and a freeze expiry with the account data. After a signed-in user publishes a note, reject note creation and author deletion by that account until its one-minute cooldown deadline. Check the global freeze before every community mutation endpoint, including feed posts, comments, and notes. Keep reads available during a freeze, and allow the host's moderator operations regardless of the affected account's state. Expiry restores contribution access without a separate user action; the host can clear a freeze earlier.

### Keep a bounded, private audit history
Append note creation, author deletion, and host deletion events with a text snapshot, timestamp, action, public display name, and private account username when available. Identify accountless authors as guests; do not retain the per-note token in the log. Prune entries older than 30 days and then remove oldest entries until the history is no larger than 500 events. A password-confirmed clear empties this history only.

### Extend the existing host Community tab
Keep the existing Community tab and add Feed, Noteboard, and Accounts tabs within it. The Feed tab retains current behavior. The Noteboard view includes pending guest reviews, approved notes awaiting placement, published notes needing review, a collapsed-by-default audit disclosure, and a shortcut to global account freeze controls. The Accounts view provides the full global freeze list. Freeze enforcement is shared across modules even when initiated from either view. Require the admin password only for clearing the audit history; opening and using moderation continues to rely on the authenticated owner session and loopback restriction.

### Reuse server-sent events for live board updates
Use the existing event-stream endpoint and add a Noteboard change event. Publish generic change notifications after note state changes; clients fetch current board or moderation data through the appropriate existing-authorized endpoints. Refresh the guest board and host Noteboard moderation view without reloading the whole page.

### Keep notes short
Use a 500-character maximum for note text as an initial product limit. This is a planning assumption based on the board's short-message purpose and can be adjusted before implementation review if needed.

### Store date visibility as part of each note
Include a `showDate` boolean in each note and in the guest submission's saved note data. Default new notes to showing their date. Render only the local calendar date when enabled and render no timestamp when disabled; never display a time on a note. Preserve the boolean through review, auto-approval, and replacement placement. Treat existing saved notes without the field as date-visible so upgrades retain their current date information.

### Keep the note name field editable on mobile
Keep the display name as a controlled text field that accepts an empty intermediate value while the author replaces it. Disable browser autofill and text correction for this field so mobile input does not restore the previous name while it is being cleared.

## Risks / Trade-offs

- [A guest note may become public without host review after ten minutes] → Mark automatic publication as needing review, provide host removal and account freeze controls for signed-in authors, and keep the guest token limited to its one pending submission.
- [A guest may not return within the 30-minute placement window] → Keep the deadline visible and state that the approved submission expires if no valid position is chosen.
- [A guest token may be exposed over the current HTTP connection] → Limit its authority to one pending submission and invalidate it at publication or expiry; HTTPS remains the stronger transport protection.
- [Board geometry can behave differently across devices] → Store normalized board-relative positions and use the same note dimensions and geometry rules for display and server validation.
- [Audit records retain deleted text] → Restrict access to the host, cap history by count and age, require password confirmation to clear it, and keep the log separate from board storage.
- [Accountless guests can obtain a new submission token for another note] → Treat guest approval as the primary content control. Per-session quotas and guest freezing are explicitly outside this change.

## Migration Plan

1. On startup, initialize empty noteboard and audit stores when absent; do not alter existing feed records.
2. Treat existing account records as unfrozen unless they contain a future freeze expiry.
3. Deploy by replacing the host application files and rebuilding the React client as for current updates.
4. To roll back, stop the application and restore the previous application version. Preserve the new noteboard and audit data files separately; the previous version will not display them.
