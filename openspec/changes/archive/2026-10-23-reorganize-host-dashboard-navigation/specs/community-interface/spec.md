# Spec Delta

## MODIFIED Requirements

### Requirement: Organize administration into tabs
The administration interface SHALL organize its primary controls into Hosting, Community, and Security tabs centered in the upper area of the dashboard. Only the selected tab's content SHALL be displayed, and Hosting SHALL be selected by default.

#### Scenario: Owner opens administration
- **WHEN** an authenticated owner opens the administration interface
- **THEN** the Hosting tab is selected by default
- **AND** Hosting, Community, and Security are presented as the centered primary navigation

#### Scenario: Owner selects an administration tab
- **WHEN** the owner selects Hosting, Community, or Security
- **THEN** the system displays that tab's content and hides the other tabs' content

## ADDED Requirements

### Requirement: Align community identity and host participation
The Community administration view SHALL place Community Identity and Host Participation in two columns on wide screens and stack them on narrow screens. It SHALL omit the shared Hosting intro from the Community view.

#### Scenario: Owner opens Community on a wide screen
- **WHEN** an authenticated owner opens the Community tab on a wide screen
- **THEN** Community Identity and Host Participation appear in adjacent columns
- **AND** the shared Hosting intro is not shown

#### Scenario: Owner opens Community on a narrow screen
- **WHEN** an authenticated owner opens the Community tab on a narrow screen
- **THEN** Community Identity and Host Participation appear in a single column

### Requirement: Align owner security and feed moderation
The Security administration view SHALL place Owner Security and Feed Moderation in two columns on wide screens and stack them on narrow screens. It SHALL omit the shared Hosting intro from the Security view.

#### Scenario: Owner opens Security on a wide screen
- **WHEN** an authenticated owner opens the Security tab on a wide screen
- **THEN** Owner Security and Feed Moderation appear in adjacent columns
- **AND** the shared Hosting intro is not shown

#### Scenario: Owner opens Security on a narrow screen
- **WHEN** an authenticated owner opens the Security tab on a narrow screen
- **THEN** Owner Security and Feed Moderation appear in a single column

### Requirement: Place and save the guest QR code
When guest hosting is enabled, the Hosting view SHALL place the QR join panel to the right of Guest Access on wide screens, stack it below Guest Access on narrow screens, and provide a way to save the QR image as a PNG file.

#### Scenario: Owner views Hosting on a wide screen
- **WHEN** an authenticated owner opens Hosting with guest hosting enabled on a wide screen
- **THEN** Guest Access appears to the left of the QR join panel

#### Scenario: Owner views Hosting on a narrow screen
- **WHEN** an authenticated owner opens Hosting with guest hosting enabled on a narrow screen
- **THEN** the QR join panel appears below Guest Access

#### Scenario: Owner saves the guest QR code
- **WHEN** an authenticated owner selects Save QR code
- **THEN** the browser downloads the QR image as a PNG file

### Requirement: Open the host participation link for guests
The Host Participation action SHALL open the same guest URL used by the QR code. The action SHALL be unavailable while guest hosting is off or the guest URL is not ready.

#### Scenario: Owner opens the guest link
- **WHEN** the guest URL is ready and the owner selects Open community feed
- **THEN** the browser opens the guest URL encoded by the QR code

#### Scenario: Guest URL is unavailable
- **WHEN** guest hosting is off or the guest URL has not loaded
- **THEN** the Open community feed action is unavailable

