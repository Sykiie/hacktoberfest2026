# Spec Delta

## Purpose

Defines how guests enter the shared community and how the venue host navigates its local controls. It keeps the guest entry choice and host-only tools clear before visitors interact with the feed.

## ADDED Requirements

### Requirement: Unauthenticated visitors choose how to enter before viewing the feed
The system SHALL show an unauthenticated visitor sign-in, account creation, and guest continuation choices before displaying the shared feed.

#### Scenario: New visitor opens the community
- **WHEN** a visitor without an active account session opens the guest link
- **THEN** the visitor sees only the sign-in and account creation options and a Continue as guest action
- **AND** the shared feed is not displayed until the visitor chooses an option

#### Scenario: Visitor signs in or creates an account
- **WHEN** a visitor successfully signs in or creates an account
- **THEN** the system opens the shared feed

#### Scenario: Visitor continues as guest
- **WHEN** an unauthenticated visitor selects Continue as guest
- **THEN** the system opens the shared feed with accountless anonymous posting and commenting available

#### Scenario: Existing account session opens the community
- **WHEN** a visitor with a valid account session opens the guest link
- **THEN** the system opens the shared feed directly

### Requirement: Host controls are organized into tabs
The system SHALL organize host controls into separate Hosting, Community, and Security tabs, displaying only the selected tab's content.

#### Scenario: Owner opens host controls
- **WHEN** an authenticated owner opens the host admin page
- **THEN** the system presents the Hosting, Community, and Security tabs
- **AND** the Hosting tab is selected by default

#### Scenario: Owner selects a host control tab
- **WHEN** the owner selects a tab
- **THEN** the system displays that tab's relevant controls without stacking the other tab contents on the same page

### Requirement: Host public participation uses a regular community account
The system SHALL keep the owner's admin credentials separate from the account used to publish publicly in the shared community.

#### Scenario: Owner opens the public feed to participate
- **WHEN** the owner chooses to participate in the shared community
- **THEN** the owner opens the shared feed and signs in or registers with a regular venue-local account
- **AND** public posts and comments use that account's standard username or anonymous display choice
