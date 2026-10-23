# Proposal

## Why

The venue and signed-in community members currently have no way to identify their profiles with an image. Profile images will give the shared community interface clearer venue branding and recognizable member identities.

## What Changes

- Let the host upload or replace the venue's profile image from administration.
- Let signed-in community members upload or replace their own profile image.
- Display the venue image and member images throughout the shared community interface, visible to guests and signed-in members.
- Provide a default visual treatment when no image has been uploaded.

## Capabilities

### New Capabilities
- `profile-images`: Upload, replace, serve, and display public venue and signed-in member profile images.

### Modified Capabilities

## Impact

- Host administration UI and venue community configuration/storage.
- Signed-in account profile APIs and account data storage.
- Guest-facing community headers, posts, comments, and account controls.
- Image validation, storage, and public image-serving behavior; no external image service is assumed.
