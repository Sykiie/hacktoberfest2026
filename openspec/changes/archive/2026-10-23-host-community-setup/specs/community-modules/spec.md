# Spec Delta

## ADDED Requirements

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
