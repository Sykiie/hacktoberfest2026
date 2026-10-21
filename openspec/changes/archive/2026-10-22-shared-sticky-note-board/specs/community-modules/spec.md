# Spec Delta

## Purpose

Defines the venue community's feature modules and how visitors navigate between the enabled parts of the community.

## ADDED Requirements

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
