# Host Administration Specification

## Purpose

Define local owner authentication, host controls, and the host's separate guest-community preview and hosting state.

## Requirements

### Requirement: Restrict administration to the host computer
The system SHALL make the administration interface available only from the host computer. Owner authentication SHALL be required before administration controls can be used.

#### Scenario: Owner opens administration locally
- **WHEN** the owner opens the administration interface on the host computer and signs in successfully
- **THEN** the system displays the administration controls

#### Scenario: Another device requests administration
- **WHEN** a device other than the host computer requests the administration interface or its protected operations
- **THEN** the system denies access

#### Scenario: Visitor has not authenticated as owner
- **WHEN** an unauthenticated visitor requests a protected administration operation on the host computer
- **THEN** the system denies the operation and requires owner sign-in

### Requirement: Initialize and change the owner password
On a fresh installation, the system SHALL initialize the owner password to locomi. The authenticated owner SHALL be able to change the password, and the system SHALL require a new password of at least 10 characters. The system SHALL store a salted password hash rather than a plaintext password.

#### Scenario: Owner signs in on a fresh installation
- **WHEN** the owner signs in for the first time on a fresh installation using the default password
- **THEN** the system authenticates the owner

#### Scenario: Owner changes password
- **WHEN** an authenticated owner submits a valid new password of at least 10 characters
- **THEN** the system stores a salted password hash for the new password

#### Scenario: Owner submits a short password
- **WHEN** an authenticated owner submits a password shorter than 10 characters
- **THEN** the system rejects the change

### Requirement: Start with guest hosting disabled
The system SHALL start the application with guest network hosting disabled. The owner SHALL be able to enable or disable guest hosting without stopping local administration. The host SHALL be able to preview the guest community locally regardless of whether network hosting is enabled.

#### Scenario: Application starts
- **WHEN** the application process starts
- **THEN** guest network hosting is disabled
- **AND** local owner administration remains available

#### Scenario: Owner enables or disables guest hosting
- **WHEN** the authenticated owner changes the guest hosting control
- **THEN** the system applies the hosting state without stopping local administration

#### Scenario: Hosting state changes
- **WHEN** guest hosting is disabled
- **THEN** the owner can still access administration and preview the guest-facing community locally

### Requirement: Offer community creation after owner sign-in
After successful owner authentication, the system SHALL detect whether a community exists and offer its creation near the hosting controls when none exists.

#### Scenario: Owner signs in with no community configured
- **WHEN** the owner successfully signs in on an installation without a community
- **THEN** the Hosting tab shows a Create community action near the hosting controls

#### Scenario: Owner starts community creation
- **WHEN** the owner selects Create community
- **THEN** the system opens a prompt flow to enter the venue type, venue name, and enabled feature modules

### Requirement: Require a community before enabling hosting
The system SHALL require a configured community before enabling guest hosting and SHALL offer community creation when the owner attempts to enable hosting without one.

#### Scenario: Owner tries to enable hosting without a community
- **WHEN** the owner selects Enable guest hosting and no community exists
- **THEN** the system opens the community creation prompt
- **AND** guest hosting remains disabled until the community is created

#### Scenario: Owner enables hosting after creating a community
- **WHEN** the owner completes community creation while trying to enable hosting
- **THEN** the system can enable guest hosting

### Requirement: Manage community settings through a prompt
The system SHALL provide prompt flows for creating and editing the community rather than embedding its setup form in the Community tab, and SHALL require hosting to be disabled and the current owner password to confirm deletion.

#### Scenario: Owner edits an existing community
- **WHEN** the owner chooses to edit the configured community
- **THEN** the system opens a prompt flow for venue type, venue name, and enabled feature modules

#### Scenario: Owner deletes an existing community
- **WHEN** the owner chooses to delete the configured community
- **THEN** the system requires guest hosting to be disabled and asks for the current owner password before deleting the community and its associated data

#### Scenario: Owner chooses delete while hosting is enabled
- **WHEN** the owner chooses to delete the configured community while guest hosting is enabled
- **THEN** the system explains that hosting must be disabled before deletion can continue
