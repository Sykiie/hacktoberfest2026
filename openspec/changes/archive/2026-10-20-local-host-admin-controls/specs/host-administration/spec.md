# Spec Delta

## Purpose

Gives the venue owner a private, local-only way to authenticate and control whether guest devices can reach the app over the venue network. It keeps administrative control available on the host even while guest access is disabled.

## ADDED Requirements

### Requirement: Admin interface is available only from the host computer
The system SHALL expose admin login, password change, and control actions only through a loopback connection on the host computer.

#### Scenario: Owner opens admin locally
- **WHEN** the owner opens the admin interface from a browser on the host computer
- **THEN** the admin interface is available for sign-in or host controls

#### Scenario: A guest device requests an admin resource
- **WHEN** a device reaches the app through a venue LAN address and requests an admin page or action
- **THEN** the system denies the request without exposing admin controls

### Requirement: Owner must authenticate to use host controls
The system SHALL initialize one owner credential with the default password `locomi` on a fresh host, store only a salted password hash, and require valid authentication before changing hosting state or the password.

#### Scenario: Owner signs in on a fresh host
- **WHEN** the owner opens local admin on a fresh host and signs in with the default password `locomi`
- **THEN** the owner can access controls from the host computer

#### Scenario: Owner changes the default password
- **WHEN** the signed-in owner changes the password in local admin
- **THEN** the new password is stored as a salted hash and can be used for later sign-ins

#### Scenario: Invalid login attempt
- **WHEN** a person submits an invalid owner credential
- **THEN** the system keeps the admin controls unavailable and reports that sign-in failed

### Requirement: LAN hosting starts disabled
The system SHALL start each host process with guest access over the LAN disabled.

#### Scenario: Host process starts
- **WHEN** the app server starts
- **THEN** the local admin interface is available on the host while guest devices cannot reach the app over the LAN

### Requirement: Owner can enable and disable LAN hosting
The system SHALL let an authenticated owner enable or disable guest access over the LAN without stopping the local admin interface.

#### Scenario: Owner enables hosting
- **WHEN** the authenticated owner enables hosting
- **THEN** guest devices that can reach the host can open the guest welcome interface through the LAN address

#### Scenario: Owner disables hosting
- **WHEN** the authenticated owner disables hosting
- **THEN** guest devices can no longer reach the app over the LAN and the owner can still use the local admin interface

### Requirement: Host can preview the guest interface locally
The system SHALL let the owner open the guest-facing interface from the host computer regardless of whether LAN hosting is enabled.

#### Scenario: Owner previews while hosting is disabled
- **WHEN** the owner selects the local preview from the admin interface while guest access is disabled
- **THEN** the guest-facing interface opens on the host computer and remains unavailable to LAN clients
