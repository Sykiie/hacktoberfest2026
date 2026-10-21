# Proposal

## Why

Local Community currently provides a shared feed but no spatial, informal way for people at a venue to leave short messages. A shared sticky-note board adds that experience while giving the host a review path for guest submissions and tools to respond to abusive signed-in accounts.

## What Changes

- Classify Shared Feed and Noteboard as separate community feature modules, both enabled by default. Show each module in its own guest-facing tab; defer module enable/disable settings in administration.
- Add a persistent shared noteboard where users write short text notes (up to 500 characters), choose a public display name, and select a board position. Notes may overlap, but combined overlays cannot cover more than 30% of any note underneath; positions are final after publication.
- Let each note author choose while composing whether the note displays its calendar date; when shown, display the date only and never the time.
- Let signed-in users publish after confirming their chosen position. Apply a one-minute account cooldown after publishing during which the account cannot publish another note or delete its notes.
- Route guest notes through a ten-minute review window. The host may approve or reject them sooner; if no decision is made, publish them automatically and flag them as needing review in host moderation. If an approved position is no longer valid, return the locked note to the guest for a replacement position within 30 minutes, without repeating content review.
- Give each guest note submission a temporary token for checking its status and choosing a replacement position. Invalidate and remove the token after placement succeeds or the submission expires. Guests cannot delete published notes; the host can remove any note.
- Add separate Feed, Noteboard, and Accounts moderation views inside the host administration Community tab. Keep a shortcut for global account freezes in Noteboard moderation, and collapse the note audit history by default. Record note creation and deletion events, including note text and author identity, in a bounded audit history of up to 500 events or 30 days, whichever comes first. Require admin password confirmation to clear the history.
- Allow the host to freeze a signed-in account globally for 24 hours. A frozen account can continue viewing the community but cannot contribute or delete content in any enabled module. The host may unfreeze an account sooner.

## Capabilities

### New Capabilities
- \`community-modules\`: Define the enabled-by-default modules and their separate guest-facing tabs.
- \`sticky-note-board\`: Provide the shared, positioned note board and its guest and signed-in publishing rules.

### Modified Capabilities
- \`host-moderation\`: Add Noteboard moderation, guest review and placement handling, audit history, log clearing, and global account-freeze controls.
- \`user-authentication\`: Define the effect and duration of a host-imposed global freeze on a signed-in account.

## Impact

- React guest interface gains module tabs and the shared board; host Community administration gains Feed, Noteboard, and Accounts moderation views.
- Host APIs and persistent local data gain noteboard records, guest submission tokens, moderation state, audit events, and account freeze expiry.
- Reuse the existing server-sent event channel to refresh open board and moderation views after board changes.
- No new external service or package is required.
