# Proposal

## Why

Guests and the host currently see posts and comments from other devices only after manually refreshing or taking another action that reloads the feed. Server-Sent Events will notify open feeds when community content changes so the interface can update in place.

## What Changes

- Add a server event stream that signals when posts or comments are created, edited, or deleted.
- Have open guest and host moderation feeds reload their authorized feed data when they receive a change notification, without reloading the page.
- Refresh the feed after an event stream reconnects so clients recover updates missed while disconnected.

## Capabilities

### New Capabilities
- `community-feed`: Keep open guest and host moderation feeds up to date when community posts or comments change.

### Modified Capabilities

None.

## Impact

- A new Server-Sent Events endpoint and change notifications in the existing Express host server.
- React guest and host moderation feed components subscribe to updates and reuse their existing feed APIs.
- No additional runtime dependency is expected. The event stream carries change notifications only; feed contents continue to use the existing authorized HTTP endpoints.
