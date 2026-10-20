# Proposal

## Why

The guest welcome page and optional venue-local accounts establish access and identity, but visitors still have no way to interact. A small shared text feed with comments will prove the core community experience while keeping accounts optional for participation.

## What Changes

- Replace the guest welcome screen with a shared feed of text posts and comments, ordered newest first and stored on the venue host.
- Let any connected visitor create posts and comments without an account; these appear as anonymous.
- Show signed-in authors' usernames by default and let them choose anonymity for each post or comment. The host privately retains ownership for signed-in users even when their public identity is hidden.
- Let signed-in authors edit or delete their own posts and comments. Accountless visitors can contribute anonymously but cannot edit or delete their contributions.
- Let the host participate in the public feed using a regular venue-local user account.
- Add a host-only moderation feed that reveals account identities behind anonymous content and lets the host edit or delete any post or comment. Require the owner to re-enter the admin password before revealing this view; enforce this on the server as well as in the interface.
- Keep reactions, sticky notes, attachments, and private messages out of this milestone.

## Capabilities

### New Capabilities

- `community-feed`: Shared text posts and comments for venue visitors, including account-optional contributions, display identity, ownership, and author controls.
- `host-moderation`: A hidden, reauthenticated host view for identifying and managing posts and comments.

### Modified Capabilities

None. There are no established main specs in `openspec/specs/`; this change introduces the feed and moderation behavior as new capabilities. It replaces the prior change's simple welcome-screen outcome at the guest route.

## Impact

- Affected areas: React guest feed and host moderation UI; LAN-accessible post and comment APIs; local persistent content storage; owner reauthentication for identity-revealing moderation; host-only route enforcement; account ownership checks; and README setup and privacy guidance.
- The host participates publicly through an ordinary venue-local user account. The owner admin password remains separate and is used only for host controls and moderator reauthentication.
- Anonymous display hides a signed-in author's username from other guests, but the host retains the account association for author controls and can see it in the reauthenticated moderation view. The app continues to use HTTP, so content and authentication traffic remain unencrypted in transit.
