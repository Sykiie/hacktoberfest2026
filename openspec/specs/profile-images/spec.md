# Profile Images Specification

## Purpose

Lets hosts and signed-in community members personalize their public community identities with profile images while retaining recognizable defaults when no image is set.

## Requirements

### Requirement: Manage the venue profile image
The host SHALL be able to upload, replace, or remove the venue profile image from administration.

#### Scenario: Host uploads a venue image
- **WHEN** the host uploads a valid image for the venue
- **THEN** the system saves it as the venue's public profile image

#### Scenario: Host replaces or removes the venue image
- **WHEN** the host replaces or removes the venue profile image
- **THEN** the shared community interface reflects the change

### Requirement: Manage a signed-in member profile image
An authenticated community member SHALL be able to upload, replace, or remove their own profile image. Before a selected image is uploaded, the member SHALL be able to adjust it within a square crop area and confirm the crop. The saved image SHALL use the confirmed square crop.

#### Scenario: Member uploads a profile image
- **WHEN** a signed-in member selects a valid image and confirms its square crop
- **THEN** the system saves the cropped image to that member's account

#### Scenario: Member selects and confirms a profile image crop
- **WHEN** a signed-in member selects a valid image and confirms a square crop
- **THEN** the system saves the cropped image to that member's account

#### Scenario: Member cancels a profile image crop
- **WHEN** a signed-in member cancels the crop step
- **THEN** the system does not upload or replace the profile image

#### Scenario: Member attempts to change another profile
- **WHEN** a member attempts to upload, replace, or remove another account's image
- **THEN** the system rejects the request

### Requirement: Display profile images in the community
The shared community interface SHALL display the venue profile image and signed-in members' profile images publicly wherever those identities are shown.

#### Scenario: Community displays a venue image
- **WHEN** a visitor or member views the shared community
- **THEN** the venue profile image appears in the community identity area

#### Scenario: Community displays a member image
- **WHEN** a visitor or member views content authored by a member with a profile image
- **THEN** that member's image appears with their identity

### Requirement: Use initials when a profile image is absent
When no profile image is set, the interface SHALL display initials derived from the venue name or the signed-in member's display username.

#### Scenario: Venue has no profile image
- **WHEN** the community has no venue profile image
- **THEN** the community identity area displays initials derived from the venue name

#### Scenario: Member has no profile image
- **WHEN** a signed-in member has no profile image
- **THEN** the member identity displays initials derived from that member's display username

### Requirement: Validate uploaded profile images
The system SHALL reject profile image uploads that exceed configured size limits or use unsupported image formats, and SHALL not replace an existing image when an upload is rejected.

#### Scenario: Upload is too large or unsupported
- **WHEN** a host or member submits an oversized image or unsupported file format
- **THEN** the system rejects the upload and preserves the current profile image
