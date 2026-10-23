# Community Modules Specification

## Purpose

Defines the venue community's feature modules and how visitors navigate between the enabled parts of the community.

## Requirements

### Requirement: Enable the initial community modules by default
The system SHALL provide Shared Feed and Noteboard as distinct community feature modules and SHALL enable both modules by default for a local community.

#### Scenario: Start a local community
- **WHEN** a venue starts its local community with the default module configuration
- **THEN** Shared Feed and Noteboard are both enabled

### Requirement: Navigate enabled modules in separate tabs
The guest-facing community interface SHALL present each enabled module in its own tab and SHALL display the selected module's interface.

#### Scenario: Open the default community
- **WHEN** a visitor enters a local community with the default modules enabled
- **THEN** the interface offers separate Shared Feed and Noteboard tabs

#### Scenario: Select a module
- **WHEN** a visitor selects an enabled module tab
- **THEN** the interface displays that module without navigating to host administration

### Requirement: Apply the host's enabled module selection
The system SHALL let the host enable or disable Shared Feed and Noteboard for the venue community and SHALL present only enabled modules to guests.

#### Scenario: Host disables a module
- **WHEN** the host saves community settings with one existing module disabled
- **THEN** guests do not see that module's tab or interface
- **AND** guests can still use the enabled module

#### Scenario: Host re-enables a module
- **WHEN** the host saves community settings with a previously disabled module enabled
- **THEN** guests can access that module again

#### Scenario: Host submits no enabled modules
- **WHEN** the host attempts to save community settings with both modules disabled
- **THEN** the system rejects the settings and keeps the current configuration
