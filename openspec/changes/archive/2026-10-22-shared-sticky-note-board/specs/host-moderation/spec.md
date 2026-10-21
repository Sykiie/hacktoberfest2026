# Spec Delta

## ADDED Requirements

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
