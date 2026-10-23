# Proposal

## Why

Hosts currently have to enable guest hosting without first describing the venue or choosing which community features to offer. A guided community setup will give each host a clear way to create and manage the single community served by this installation.

## What Changes

- Detect whether a community exists after the owner signs in, and show a Create community action near the hosting controls when none exists.
- Also offer community setup when the owner tries to enable hosting before creating a community.
- Collect a venue type (Cafe or Other with a custom type field), venue name, and enabled feature modules in a prompt flow.
- Allow the owner to edit the community's venue type, venue name, and enabled modules through a prompt, and to delete the community before creating a replacement by confirming with the owner password while hosting is disabled.
- Require an existing community before guest hosting can be enabled; keep the installation limited to one community at a time.
- Show only enabled feature modules in the guest community.

## Capabilities

### New Capabilities
- `venue-community`: Create and manage the single venue community and its identity.

### Modified Capabilities
- `host-administration`: Detect missing community after owner sign-in, provide create/edit actions, and gate hosting on community setup.
- `community-modules`: Let the host choose enabled modules and show only those modules to guests.

## Impact

Host administration UI and APIs in `src/App.jsx` and `server/host.js`; persistent host data under the existing data directory; guest module navigation and venue identity in `src/App.jsx`; requirements in the host administration and community modules specifications.
