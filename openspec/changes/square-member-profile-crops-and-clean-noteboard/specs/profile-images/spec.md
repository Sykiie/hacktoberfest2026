## MODIFIED Requirements

### Requirement: Manage a signed-in member profile image
An authenticated community member SHALL be able to upload, replace, or remove their own profile image. Before a selected image is uploaded, the member SHALL be able to adjust it within a square crop area and confirm the crop. The saved image SHALL use the confirmed square crop.

#### Scenario: Member selects and confirms a profile image crop
- **WHEN** a signed-in member selects a valid image and confirms a square crop
- **THEN** the system saves the cropped image to that member's account

#### Scenario: Member cancels a profile image crop
- **WHEN** a signed-in member cancels the crop step
- **THEN** the system does not upload or replace the profile image

#### Scenario: Member attempts to change another profile
- **WHEN** a member attempts to upload, replace, or remove another account's image
- **THEN** the system rejects the request
