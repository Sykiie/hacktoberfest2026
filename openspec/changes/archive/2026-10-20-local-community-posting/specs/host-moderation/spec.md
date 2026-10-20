# Spec Delta

## Purpose

Provides the venue owner with a private moderation view of community posts and comments. It allows the owner to identify signed-in authors who chose anonymous display and manage any community contribution after confirming the owner password again.

## ADDED Requirements

### Requirement: Host moderation is restricted to the host computer
The system SHALL make the moderation view and its data available only through the host computer's loopback connection.

#### Scenario: Owner opens moderation on the host computer
- **WHEN** the owner opens the moderation view from the local admin interface
- **THEN** the system provides the host-only moderation flow

#### Scenario: Guest requests moderation over the venue network
- **WHEN** a guest device requests the moderation page or moderation API over the LAN
- **THEN** the system denies the request without returning moderation data

### Requirement: Owner re-enters the admin password to reveal moderation data
The system SHALL require an authenticated owner to confirm the current admin password before showing anonymous author identities or enabling moderation controls.

#### Scenario: Owner confirms the current admin password
- **WHEN** an authenticated owner submits the correct admin password to open moderation
- **THEN** the system reveals all community posts and comments with their associated signed-in usernames
- **AND** enables owner moderation actions

#### Scenario: Owner submits an incorrect admin password
- **WHEN** an authenticated owner submits an incorrect admin password
- **THEN** the system keeps moderation data and controls hidden
- **AND** reports that password confirmation failed

#### Scenario: Unauthenticated request attempts to reveal moderation data
- **WHEN** a request without a valid owner admin session attempts password confirmation or moderation access
- **THEN** the system denies the request

### Requirement: Owner can moderate any post or comment
The system SHALL let an owner with confirmed moderation access edit or delete any post or comment.

#### Scenario: Owner edits community content
- **WHEN** the owner edits a post or comment in the moderation view
- **THEN** the system saves the updated text and the feed displays it

#### Scenario: Owner deletes community content
- **WHEN** the owner deletes a post or comment in the moderation view
- **THEN** the system removes it from the shared feed

#### Scenario: Owner deletes a post with comments
- **WHEN** the owner deletes a post that has comments
- **THEN** the post and its comments are removed from the shared feed

### Requirement: Moderation reveals only identities associated with signed-in users
The system SHALL show the associated venue-local username for signed-in contributions, including those displayed anonymously to guests.

#### Scenario: Owner reviews an anonymous signed-in contribution
- **WHEN** the owner opens the confirmed moderation view for a signed-in user's anonymous post or comment
- **THEN** the owner can see the associated username alongside the contribution

#### Scenario: Owner reviews an accountless contribution
- **WHEN** the owner opens the moderation view for a contribution created without an account
- **THEN** the system identifies the author as an anonymous guest without claiming a username
