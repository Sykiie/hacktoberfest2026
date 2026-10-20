# Spec Delta

## Purpose

Provides the venue owner with a private view of community posts and comments for moderation. The view identifies signed-in authors, allows the owner to manage content, and relies on the existing host-only admin session.

## ADDED Requirements

### Requirement: Authenticated host moderation is available without a second password prompt
The system SHALL provide moderation data and actions to an authenticated owner through the host computer's loopback connection without requiring the owner to re-enter the admin password.

#### Scenario: Authenticated owner opens the Community tab
- **WHEN** the owner is signed in to the local admin interface and opens the Community tab
- **THEN** the system displays the moderation feed and its moderation controls without another password prompt

#### Scenario: Unauthenticated request attempts to open moderation
- **WHEN** a request without a valid owner admin session attempts to access moderation data or actions
- **THEN** the system denies the request

#### Scenario: Guest device requests moderation over the venue network
- **WHEN** a guest device requests the moderation page or API over the LAN
- **THEN** the system denies the request without returning moderation data

### Requirement: Moderation identifies signed-in authors and distinguishes accountless guests
The system SHALL show the venue-local username associated with a signed-in contribution, including one displayed anonymously to guests, and SHALL identify contributions without an account as anonymous guest content.

#### Scenario: Owner reviews a signed-in anonymous contribution
- **WHEN** the owner views a signed-in user's post or comment that is anonymous in the public feed
- **THEN** the moderation feed shows the associated username

#### Scenario: Owner reviews accountless content
- **WHEN** the owner views a post or comment created without an account
- **THEN** the moderation feed labels its author as an anonymous guest

### Requirement: Owner can edit or delete any community contribution
The system SHALL let an authenticated owner edit or delete any post or comment in the moderation feed.

#### Scenario: Owner edits a contribution
- **WHEN** the owner saves an edit to a post or comment
- **THEN** the system stores the updated text and displays it in the shared feed

#### Scenario: Owner deletes a post or comment
- **WHEN** the owner deletes a post or comment
- **THEN** the system removes it from the shared feed

#### Scenario: Owner deletes a post with comments
- **WHEN** the owner deletes a post with comments
- **THEN** the system removes the post and all of its comments
