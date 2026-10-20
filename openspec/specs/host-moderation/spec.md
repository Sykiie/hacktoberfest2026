# Host Moderation Specification

## Purpose

Define host-only access to community moderation, private author visibility, and administrative actions on feed content.

## Requirements

### Requirement: Restrict moderation to the host owner
The system SHALL provide moderation tools only on the host computer to an authenticated venue owner. Requests from guest devices, unauthenticated requests, and requests that do not originate from the host computer SHALL be denied. The owner SHALL access moderation using the existing authenticated owner session without a second password prompt.

#### Scenario: Authenticated owner opens moderation on host
- **WHEN** the venue owner has an active owner session and opens moderation from the host computer
- **THEN** the system displays the host moderation interface

#### Scenario: Guest device requests moderation
- **WHEN** a request to view or change moderation data originates from another device on the local network
- **THEN** the system denies the request

#### Scenario: Unauthenticated request reaches host moderation
- **WHEN** a request to view or change moderation data has no valid owner session
- **THEN** the system denies the request

#### Scenario: Owner opens moderation with an active session
- **WHEN** an authenticated owner opens moderation on the host computer
- **THEN** the system does not ask the owner to re-enter the admin password

### Requirement: Reveal contribution identity to the owner
The system SHALL show the owner the account username responsible for each signed-in user's contribution, including contributions published anonymously to guests. For a contribution made by an accountless guest, the system SHALL show "Anonymous guest". When a signed-in user published anonymously, the moderation interface SHALL visibly indicate that the contribution was posted anonymously while also displaying the account username to the owner.

#### Scenario: Signed-in user posts anonymously
- **WHEN** the owner views a signed-in user's anonymously published post or comment
- **THEN** the interface identifies it as anonymous to guests
- **AND** displays the signed-in account username to the owner

#### Scenario: Accountless guest contributes
- **WHEN** the owner views a post or comment created without an account
- **THEN** the interface identifies the author as "Anonymous guest"

#### Scenario: Signed-in user posts publicly
- **WHEN** the owner views a post or comment published under a signed-in user's username
- **THEN** the interface displays that username as the author

### Requirement: Moderate any contribution
The system SHALL allow the authenticated owner to edit or delete any post or comment. Deleting a post SHALL also delete its comments.

#### Scenario: Owner edits or deletes a contribution
- **WHEN** the owner chooses to edit or delete any post or comment in moderation
- **THEN** the system applies the requested change

#### Scenario: Owner deletes a post with comments
- **WHEN** the owner deletes a post that has comments
- **THEN** the system deletes the post and all of its comments
