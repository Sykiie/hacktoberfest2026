# Proposal

## Why

AI moderation currently sends a provider request as soon as it finds any ready item, which often means a one-item request. A short collection window can combine nearby contributions into fewer requests while keeping moderation latency bounded.

## What Changes

- Collect ready AI moderation items for up to 60 seconds before sending a partial batch.
- Send a batch immediately when it reaches five items; batches remain capped at five.
- Give each provider batch up to 60 seconds to return a response.
- Include retry-ready items in the same batching policy after their existing retry delay expires.

## Capabilities

### New Capabilities

### Modified Capabilities
- `community-feed`: Define timed batching and provider response limits for AI checks of feed content.
- `sticky-note-board`: Define timed batching and provider response limits for AI checks of noteboard submissions and notes.

## Impact

The host AI moderation worker and provider request timeout in `server/host.js` and `server/ai-moderation.js`; moderation queue behavior for feed and noteboard content. No API or provider configuration changes are required.
