# Spec Delta

## Purpose

Allows a venue to run the web app on a computer at the venue and lets other devices that can reach that computer over the same local Wi-Fi open the app in a browser. This capability establishes network access only; it does not verify physical presence.

## ADDED Requirements

### Requirement: Host serves the app on the local network
The system SHALL allow the venue owner to start the app on a venue computer and serve it at an address reachable by other devices on the venue's local network.

#### Scenario: Another device opens the hosted app
- **WHEN** the host is running and a client device can reach the host over the local network
- **THEN** the client can open the app in a browser using the host's local network address

#### Scenario: Network configuration prevents device-to-device access
- **WHEN** the Wi-Fi or host firewall blocks traffic between the client and host
- **THEN** the client cannot connect and the setup guidance identifies network isolation or firewall access as possible causes

### Requirement: Host provides a shareable local join address
The system SHALL show the host's local join address and provide a QR code that encodes that address for client devices to open.

#### Scenario: Client scans the host QR code
- **WHEN** a client device scans the displayed QR code while able to reach the host
- **THEN** its browser opens the app at the host's local join address

#### Scenario: Host address changes
- **WHEN** the host's local network address changes
- **THEN** the displayed join address and QR code reflect the current address

### Requirement: Local network access does not claim physical presence verification
The system SHALL describe access as limited by local network reachability and SHALL NOT represent a successful connection as proof that a user is physically present at the venue.

#### Scenario: User joins through the venue network
- **WHEN** a user opens the app from a device that can reach the host
- **THEN** the app grants access based on network reachability without claiming to have verified the user's physical location
