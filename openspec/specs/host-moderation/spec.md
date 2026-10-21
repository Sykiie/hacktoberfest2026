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

### Requirement: Separate community moderation views
The host administration Community tab SHALL provide separate Feed, Noteboard, and Accounts moderation tabs. The views SHALL remain protected by the authenticated owner session and host-only access restriction. The Accounts tab SHALL provide global freeze controls, and Noteboard moderation SHALL retain a shortcut to those same controls.

#### Scenario: Owner opens Community moderation
- **WHEN** the authenticated owner opens the administration Community tab
- **THEN** the interface offers separate Feed, Noteboard, and Accounts moderation tabs

#### Scenario: Owner switches moderation view
- **WHEN** the owner selects Feed, Noteboard, or Accounts moderation
- **THEN** the system displays the selected module's moderation view

#### Scenario: Owner manages a freeze from either view
- **WHEN** the owner opens Accounts or uses the freeze controls in Noteboard moderation
- **THEN** the owner can freeze or unfreeze the same signed-in community accounts globally

### Requirement: Review guest noteboard submissions
The system SHALL let the authenticated owner review pending guest notes and approve or reject them before their ten-minute review period ends. Automatically published guest notes SHALL be marked as needing review until the owner reviews or removes them.

#### Scenario: Owner approves a pending note
- **WHEN** the owner approves a pending guest note
- **THEN** the system applies the note's approved content and validates its position for publication

#### Scenario: Owner rejects a pending note
- **WHEN** the owner rejects a pending guest note
- **THEN** the system prevents it from appearing on the board and invalidates its submission token

#### Scenario: Owner reviews an automatically published note
- **WHEN** the owner opens a guest note that was automatically published after its review period
- **THEN** the system marks it as reviewed when the owner completes a review action

### Requirement: Keep a bounded noteboard audit history
The system SHALL record noteboard note creation and deletion events with the note text, event time, action, and author identity available to the host. Signed-in authors SHALL be identified by account username, and accountless guests SHALL be identified as guests with their selected public display name when provided. The history SHALL retain no more than 500 events or 30 days of events, whichever limit is reached first.

#### Scenario: Note is created
- **WHEN** a user creates or submits a noteboard note
- **THEN** the system records the note text, time, action, and author information for host review

#### Scenario: Note is deleted
- **WHEN** a signed-in author or the host deletes a noteboard note
- **THEN** the system records the note text, time, deletion action, and author information

#### Scenario: Audit history exceeds a retention limit
- **WHEN** the noteboard audit history exceeds 500 events or contains events older than 30 days
- **THEN** the system removes the oldest events until both limits are met

### Requirement: Collapse noteboard audit history by default
The Noteboard moderation view SHALL hide audit entries in a disclosure that starts collapsed, keeping the initial moderation view concise. Expanding the disclosure SHALL show the retained entries and the password-confirmed clear action.

#### Scenario: Owner opens Noteboard moderation
- **WHEN** the owner opens the Noteboard moderation view
- **THEN** the audit entries are hidden behind a collapsed disclosure

#### Scenario: Owner expands audit history
- **WHEN** the owner expands the audit history disclosure
- **THEN** the owner can review entries and access the clear-history form

### Requirement: Require password confirmation to clear noteboard logs
The system SHALL require the owner to confirm the admin password before clearing the noteboard audit history. Clearing the history SHALL NOT delete notes from the board.

#### Scenario: Owner confirms log clearing
- **WHEN** the authenticated owner submits the correct admin password to clear the noteboard audit history
- **THEN** the system clears the audit history and leaves board notes unchanged

#### Scenario: Owner submits an incorrect password
- **WHEN** the owner submits an incorrect admin password to clear the noteboard audit history
- **THEN** the system retains the history and reports that confirmation failed

### Requirement: Allow mobile authors to clear the display name field
The note composer SHALL allow authors to fully clear and replace the display name on touch devices. Browser autofill or text correction SHALL NOT force a character back into the controlled field after it is cleared.

#### Scenario: Author replaces the prefilled display name on a phone
- **WHEN** an author clears the display name field on a touch device and enters a different name
- **THEN** the field reflects the entered name without retaining a character from the previous value

### Requirement: Freeze or unfreeze a signed-in account globally
The system SHALL allow the authenticated owner to freeze or unfreeze a signed-in community account from host moderation. A freeze SHALL apply across all enabled community modules for 24 hours unless the owner unfreezes the account sooner.

#### Scenario: Owner freezes an account
- **WHEN** the owner freezes a signed-in community account
- **THEN** the system applies the global 24-hour freeze

#### Scenario: Owner unfreezes an account
- **WHEN** the owner unfreezes a frozen account before the freeze expires
- **THEN** the system restores that account's contribution permissions across enabled modules
