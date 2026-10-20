# Spec Delta

## Purpose

Provides a separate, simple welcome screen for people joining the venue's local community. The screen is the destination of the guest join link and can also be previewed from the host computer.

## ADDED Requirements

### Requirement: Guest join link opens the welcome screen
The system SHALL direct the guest join URL and QR code to a guest-facing welcome screen separate from the admin interface.

#### Scenario: Guest scans the join QR code while hosting is enabled
- **WHEN** a guest scans the current join QR code while able to reach the host
- **THEN** the browser opens the guest welcome screen rather than the admin interface

#### Scenario: Hosting is disabled
- **WHEN** a guest tries to open the join URL while LAN hosting is disabled
- **THEN** the guest device cannot reach the welcome screen through the LAN

### Requirement: Welcome screen stays simple for this milestone
The system SHALL show a basic venue community welcome and SHALL NOT require guest accounts or provide posts, notes, comments, or reactions in this milestone.

#### Scenario: Guest opens the welcome screen
- **WHEN** a guest opens the welcome screen
- **THEN** the page welcomes the guest to the local community without requiring sign-in

### Requirement: Host can preview the guest welcome screen
The system SHALL provide a host-computer option to open the same guest-facing welcome screen locally.

#### Scenario: Host opens the local preview
- **WHEN** the owner selects the preview option from the local admin interface
- **THEN** the host computer opens the guest welcome screen without using the LAN join URL
