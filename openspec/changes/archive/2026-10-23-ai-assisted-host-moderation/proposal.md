# Proposal

## Why

Venue hosts currently review feed posts and comments manually, so harmful or suspicious content can be easy to miss. Host-configurable local or cloud AI can triage content for the owner, while the host retains moderation decisions and chooses whether contribution text stays on the venue computer or is processed by a selected provider.

## What Changes

- Let the host choose a local open-weight model or cloud AI provider, configure credentials/settings in host administration, and check feed posts and comments with that provider.
- Store provider credentials on the host; never expose API keys to guests or send them to browser clients.
- Attach a review result, including a reason when flagged, and disclose when a configured cloud provider receives contribution text.
- Keep all content visible while awaiting a check or host review; AI flags never edit, hide, or delete content automatically.
- If the model is unavailable, publish content with an **AI check unavailable** status and automatically check those items when the model becomes available again.
- Show AI review status and flagged reasons in the existing host-only Feed moderation view.
- Persist check state with feed content so pending checks can resume after a host restart.

## Capabilities

### New Capabilities

### Modified Capabilities

- `community-feed`: Persist AI check status and retry unchecked posts and comments after the model returns.
- `host-moderation`: Show model flags and reasons to the host without taking automatic moderation action.

## Impact

- Feed creation and persistence in `server/community-store.js` and `server/host.js`.
- Existing host Feed moderation view in `src/App.jsx` and related styles.
- Host-selected local model runtime or cloud AI provider and secure host-side credential storage.
- Feed and moderation API projections, tests, and host setup documentation.
