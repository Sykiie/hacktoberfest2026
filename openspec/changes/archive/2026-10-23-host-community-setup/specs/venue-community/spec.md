# Spec Delta

## Purpose

Defines the single venue community owned by a host installation, including its venue identity, selected feature modules, and lifecycle. It gives hosts a way to create, edit, and replace that community.

## ADDED Requirements

### Requirement: Create one venue community
The system SHALL let the owner create one community for the host installation with a venue type, venue name, and enabled feature modules.

#### Scenario: Create a Cafe community
- **WHEN** the owner selects Cafe, enters a venue name, and chooses feature modules
- **THEN** the system saves one community with those values

#### Scenario: Create a community with a custom venue type
- **WHEN** the owner selects Other, enters a custom venue type and venue name, and chooses feature modules
- **THEN** the system saves the custom type and other community settings

#### Scenario: Owner attempts to create a second community
- **WHEN** a community already exists on the installation
- **THEN** the system does not create another community

### Requirement: Edit venue community settings
The system SHALL let the owner edit the venue type, venue name, and enabled feature modules of the existing community.

#### Scenario: Owner saves community edits
- **WHEN** the owner changes one or more community settings and saves
- **THEN** the system stores the updated values for the existing community

### Requirement: Delete the venue community and its data
The system SHALL let the owner delete the existing community and remove its associated community content and accounts only when guest hosting is disabled and the owner confirms with the current owner password.

#### Scenario: Owner deletes a community with hosting disabled
- **WHEN** guest hosting is disabled and the owner submits the correct current owner password to confirm community deletion
- **THEN** the system removes the community settings, posts, notes, community accounts, and moderation history
- **AND** leaves no community configured on the installation

#### Scenario: Owner submits an incorrect password
- **WHEN** the owner submits an incorrect password to confirm community deletion
- **THEN** the system rejects the deletion and keeps the community and its data

#### Scenario: Owner tries to delete while hosting is enabled
- **WHEN** the owner attempts to delete the community while guest hosting is enabled
- **THEN** the system rejects the deletion and requires the owner to disable hosting first

#### Scenario: Create a replacement community
- **WHEN** the owner has deleted the existing community
- **THEN** the owner can create a new community on the installation
