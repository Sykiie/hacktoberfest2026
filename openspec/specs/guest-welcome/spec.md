# Guest Welcome Specification

## Purpose

Define the guest-facing entry route and its separation from host administration.

## Requirements

### Requirement: Separate guest experience from administration
The guest join URL SHALL open the guest-facing community experience and SHALL NOT display the host administration screen. The host computer SHALL provide a way for the owner to preview or open the same guest-facing experience locally.

#### Scenario: Visitor follows the join URL
- **WHEN** a visitor opens the join URL or scans its QR code
- **THEN** the system opens the guest-facing community experience
- **AND** does not display host administration controls

#### Scenario: Owner previews the guest experience
- **WHEN** the owner chooses to open the guest-facing interface on the host computer
- **THEN** the system displays the same guest-facing experience locally

### Requirement: Honor hosting availability
Guest devices SHALL be able to access the guest-facing experience only while guest hosting is enabled and the host is reachable on the local network. Disabling hosting SHALL make the guest route inaccessible to other devices while leaving local host administration and preview available.

#### Scenario: Guest opens the join URL while hosting is enabled
- **WHEN** a guest device can reach the host while guest hosting is enabled
- **THEN** the system opens the guest-facing experience

#### Scenario: Guest opens the join URL while hosting is disabled
- **WHEN** a guest device attempts to open the join URL while guest hosting is disabled
- **THEN** the system does not provide access to the guest-facing experience

#### Scenario: Host previews while guest hosting is disabled
- **WHEN** the owner opens the guest-facing interface locally while guest hosting is disabled
- **THEN** the owner can still preview it on the host computer
