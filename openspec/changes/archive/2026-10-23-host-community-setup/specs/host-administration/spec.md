# Spec Delta

## ADDED Requirements

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
