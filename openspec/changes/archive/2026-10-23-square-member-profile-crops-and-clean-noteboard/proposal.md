# Proposal

## Why

Member profile images are uploaded without a crop step, so portrait or landscape photos can render inconsistently in square avatar slots and obscure nearby content. Noteboard notes also repeat profile pictures beside display names, adding visual clutter where the author name is sufficient.

## What Changes

- Add an interactive square crop step after a signed-in member selects a profile image and before the image is uploaded.
- Keep note author display names on the noteboard while removing their profile image from note cards.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `profile-images`: Require signed-in members to crop selected profile images to a square before saving.
- `sticky-note-board`: Display note author names without profile images on the noteboard.

## Impact

- Member profile image selector and upload flow in the community interface.
- Note card rendering in the noteboard.
- Existing profile image and sticky note board behavior specifications.
