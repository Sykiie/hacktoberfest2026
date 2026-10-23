# Tasks

## 1. Image storage and validation

- [x] 1.1 Add local profile-image storage and server-side type/size validation for venue and member images; verify accepted and rejected uploads with focused store/API tests.
- [x] 1.2 Add public image retrieval and safe replacement/removal behavior; verify missing images, successful replacement, invalid replacement preservation, and cleanup behavior.

## 2. Venue profile image

- [x] 2.1 Add host administration controls to upload, replace, preview, and remove the venue image; verify changes persist after reload and are rejected without owner authorization.
- [x] 2.2 Display the venue image in the shared community identity area and render venue-name initials when absent; verify both states in the UI.

## 3. Member profile image

- [x] 3.1 Extend member account profile operations to upload, replace, and remove only the authenticated member's image; verify authorization and persistence with API tests.
- [x] 3.2 Display member images with their community identity and use display-username initials when absent; verify rendering for image and fallback states.

## 4. Integration

- [x] 4.1 Verify image URLs and identity fallbacks work across enabled community modules, then run the production build and the full test suite.
