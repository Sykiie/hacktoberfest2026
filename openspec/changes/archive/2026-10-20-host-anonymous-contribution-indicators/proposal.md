# Proposal

## Why

The host moderation feed currently displays a signed-in username without showing whether that contribution was published anonymously to guests. A clear indicator lets the host understand both the author's identity and the author's public anonymity choice.

## What Changes

- In the host moderation feed, show an anonymity indicator beside the signed-in username when a post or comment was published anonymously to guests.
- Continue showing the signed-in username for moderation and keep accountless contributions labeled as anonymous guests.
- Leave the public guest feed's anonymity behavior unchanged.

## Capabilities

### New Capabilities
- `host-moderation`: Provide the host a private moderation feed that distinguishes a signed-in author's identity from their public anonymity choice.

### Modified Capabilities

None.

## Impact

- Updates the React host moderation feed presentation for posts and comments.
- Uses the existing moderation feed data, which already includes the author's username and an anonymity flag; no API or storage change is expected.
