# Spec Delta

## ADDED Requirements

### Requirement: Enforce a global account freeze
The system SHALL keep a frozen community account in read-only mode across all enabled community modules for 24 hours from the freeze time, unless the host unfreezes it sooner.

#### Scenario: Frozen user views the community
- **WHEN** a frozen account holder signs in or continues an existing session
- **THEN** the user can view enabled community modules
- **AND** cannot create, edit, or delete contributions in any module

#### Scenario: Freeze period expires
- **WHEN** 24 hours have elapsed since an account was frozen and the host has not frozen it again
- **THEN** the system restores the account's contribution permissions across enabled modules

#### Scenario: Host unfreezes account early
- **WHEN** the host unfreezes an account before its 24-hour freeze expires
- **THEN** the system immediately restores the account's contribution permissions across enabled modules
