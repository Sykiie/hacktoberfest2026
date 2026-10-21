# Tasks

## 1. Noteboard storage and server rules

- [x] 1.1 Add persistent noteboard and audit stores with atomic writes; verify published notes, pending submissions, and audit events survive an application restart.
- [x] 1.2 Implement guest submission states, one-note tokens, the 10-minute review deadline, the 30-minute replacement-position deadline, and terminal token removal; verify rejected, published, and expired tokens no longer authorize requests, including after a restart.
- [x] 1.3 Implement server-side position geometry and overlap validation; verify coverage of 30% or less is accepted and larger combined coverage is rejected at initial placement, approval, and replacement placement, including coverage from stacked notes.
- [x] 1.4 Implement signed-in note creation and deletion ownership with the one-minute per-account cooldown; verify the server rejects both actions during cooldown and allows them after it expires.

## 2. Guest community modules and board

- [x] 2.1 Add Shared Feed and Noteboard as default-enabled guest-facing tabs; verify both are visible on entry and switching tabs preserves access to each module.
- [x] 2.2 Build the responsive board and note composer with a 500-character limit, public display name, placement preview, and position confirmation; verify the same note positions are shown on phone and desktop layouts.
- [x] 2.3 Add the guest warning, pending/rejected/approved status, and replacement-position flow; verify an approved note with an invalid position can be repositioned within 30 minutes without another content review, and expires when the window ends.
- [x] 2.4 Add signed-in note publication, author deletion after cooldown, and the one-minute cooldown feedback; verify notes cannot be edited or moved after publication.
- [x] 2.5 Add a per-note “Show date” choice to the composer. Persist the choice through guest review and replacement placement; show only the calendar date when enabled and no timestamp when disabled, defaulting new and legacy notes to date-visible.
- [x] 2.6 Ensure the display-name input can be fully cleared and replaced on mobile without autofill or text correction restoring the previous value.

## 3. Host moderation and account controls

- [x] 3.1 Add Feed, Noteboard, and Accounts sub-tabs inside the administration Community tab; verify existing feed moderation remains available and pending, auto-published, and placement-returned notes are visible in the Noteboard view.
- [x] 3.2 Add approve, reject, mark-reviewed, remove-note, freeze, and unfreeze actions; verify moderation remains limited to the authenticated host owner on loopback and opens without a second password prompt.
- [x] 3.3 Add the audit history with note text, author, action, and timestamp, capped at 500 events or 30 days; verify oldest entries are pruned and clearing requires the correct admin password without deleting board notes.
- [x] 3.4 Persist the 24-hour account freeze and enforce read-only access across feed and noteboard mutations; verify an owner can unfreeze early and that ordinary viewing remains available while frozen.
- [x] 3.5 Provide global account freeze controls in the Accounts tab and retain a shortcut in Noteboard moderation.
- [x] 3.6 Collapse the Noteboard audit history by default and keep its password-confirmed clear action inside the disclosure.

## 4. Live updates and user documentation

- [x] 4.1 Extend server-sent events for noteboard changes; verify open guest boards and host moderation views refresh after publication, approval, deletion, or moderation changes without a full page reload.
- [x] 4.2 Update README instructions for the feature modules, per-note date display, board behavior, guest review and token lifecycle, moderation history, and global account freeze; verify documented behavior matches the implementation.
- [x] 4.3 Build the React application and verify the host can load the guest modules and nested moderation views without runtime or build errors.
