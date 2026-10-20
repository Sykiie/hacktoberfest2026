# Local Network Access Specification

## Purpose

Define how a venue host exposes its community to devices on the venue's local network.

## Requirements

### Requirement: Host the community on a venue computer
The system SHALL allow a venue computer to host the web application so devices on the same reachable local network can open the guest community. The guest service SHALL bind only to a private IPv4 address selected from the host computer's active network interfaces, and SHALL NOT expose guest hosting through a public network interface.

#### Scenario: Guest device joins the same network
- **WHEN** guest hosting is enabled and a device on the same reachable local network opens the host's join address
- **THEN** the device can access the guest community

#### Scenario: No usable private address is available
- **WHEN** the host has no usable private IPv4 address
- **THEN** the system does not advertise a guest join address

### Requirement: Show the join address and QR code
The system SHALL display the current guest join URL and a QR code that encodes that URL on the host computer. If the selected local address changes while hosting is enabled, the system SHALL update the displayed URL and QR code.

#### Scenario: Guest hosting starts
- **WHEN** the owner enables guest hosting
- **THEN** the host interface displays the current join URL and a QR code for it

#### Scenario: Host address changes
- **WHEN** the active private IPv4 address changes while hosting is enabled
- **THEN** the displayed join URL and QR code are updated to use the current address

### Requirement: Local-network reachability defines access
The system SHALL make guest access depend on whether the device can reach the host on the local network. The system SHALL NOT claim that network access proves a visitor's physical presence at the venue.

#### Scenario: A reachable device opens the join URL
- **WHEN** a device can reach the host over the local network
- **THEN** it can open the guest community while hosting is enabled

#### Scenario: Network configuration prevents access
- **WHEN** firewall settings, Wi-Fi client isolation, or another network restriction prevents a device from reaching the host
- **THEN** the device cannot access the guest community even if it is connected to the venue Wi-Fi

### Requirement: Disable guest access when hosting is off
The system SHALL stop accepting guest-community requests over the local network when the owner disables hosting.

#### Scenario: Owner disables hosting
- **WHEN** the owner disables guest hosting
- **THEN** other devices can no longer access the guest community through the local network
