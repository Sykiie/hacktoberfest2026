# Sticky Note Board Specification

## Purpose

Provides a shared, positioned sticky-note board for visitors to leave short messages in a venue's local community.

## Requirements

### Requirement: View a shared persistent noteboard
The system SHALL provide one shared noteboard to visitors who can access the local community. Notes SHALL remain on the board across application restarts and open board views SHALL update after board changes without a full page reload.

#### Scenario: Visitor opens the board
- **WHEN** a visitor selects the Noteboard module
- **THEN** the system displays the shared notes and their board positions

#### Scenario: Host restarts the application
- **WHEN** the host application restarts
- **THEN** notes already published on the board remain available

#### Scenario: A note is published or removed
- **WHEN** a note is published or removed
- **THEN** open noteboard views update without a full page reload

### Requirement: Submit a note with a public display name
The system SHALL allow a visitor, including an accountless guest, to submit a non-empty text note of no more than 500 characters with a public display name. A signed-in visitor's account identity SHALL remain available to the host independently of the chosen public display name. Noteboard notes SHALL show the public display name without displaying the author's profile image.

#### Scenario: Guest submits a note
- **WHEN** an accountless guest submits a note with a chosen display name
- **THEN** the board uses that display name after the note is published
- **AND** host moderation identifies the contributor as an accountless guest

#### Scenario: Signed-in visitor uses a display name
- **WHEN** a signed-in visitor submits a note with a public display name
- **THEN** the board uses that display name after the note is published
- **AND** host moderation can identify the associated account username

#### Scenario: Note exceeds the text limit
- **WHEN** a visitor submits a note longer than 500 characters
- **THEN** the system rejects the submission and reports the maximum length

#### Scenario: Note author has a profile image
- **WHEN** a visitor views a note authored by someone with a profile image
- **THEN** the board displays the note's public display name without the profile image

### Requirement: Choose whether a note displays its date
The system SHALL let the author choose while composing each note whether its calendar date is displayed. New notes SHALL show the date by default. When displayed, the note SHALL show the date without a time; when disabled, it SHALL show neither date nor time. The choice SHALL persist through guest review, automatic approval, and replacement placement. Existing notes without a saved choice SHALL continue to display their date.

#### Scenario: Author keeps the date visible
- **WHEN** an author submits a note with the date option enabled
- **THEN** the published note displays its calendar date without a time

#### Scenario: Author hides the date
- **WHEN** an author submits a note with the date option disabled
- **THEN** the published note displays neither a date nor a time

#### Scenario: Guest note is approved or repositioned
- **WHEN** a guest note with a date-display choice is approved or given a replacement position
- **THEN** the published note retains the guest's original choice

### Requirement: Choose and confirm a final note position
The system SHALL let each note author choose a position on the shared board and confirm that position before submission. Published notes SHALL retain their chosen position and SHALL NOT be movable or editable by their author.

#### Scenario: Visitor chooses a position
- **WHEN** a visitor selects a position for a note
- **THEN** the system shows the proposed placement and asks the visitor to confirm before submitting it

#### Scenario: Guest confirms a note submission
- **WHEN** an accountless guest confirms a note submission
- **THEN** the system warns that the guest cannot delete the note after publication

#### Scenario: Published note position is final
- **WHEN** a note has been published
- **THEN** its author cannot edit the note text or move the note

### Requirement: Limit combined note coverage
The system SHALL reject a placement if adding a new note would cause more than 30% of any existing note's area to be covered. This coverage check SHALL account for the combined area covered by the new note and all notes already layered above each affected note. A placement covering 30% or less of each affected note SHALL be allowed.

#### Scenario: Placement covers no more than 30% of each note
- **WHEN** a visitor chooses a position that covers no more than 30% of every affected note
- **THEN** the system allows the placement to continue to confirmation

#### Scenario: Placement covers more than 30% of a note
- **WHEN** a visitor chooses a position that would cover more than 30% of any affected note
- **THEN** the system rejects that position and asks the visitor to choose another

#### Scenario: Existing notes together would exceed the coverage limit
- **WHEN** a visitor chooses a position that combined with notes already layered above an affected note would cover more than 30% of its area
- **THEN** the system rejects that position

### Requirement: Review guest notes before publication
The system SHALL hold a guest's submitted note for host review for up to 10 minutes. The host MAY approve or reject the note during that period. If no decision is made within 10 minutes, the system SHALL approve and publish the note and mark it as needing review in the host moderation view.

#### Scenario: Host approves a guest note early
- **WHEN** the host approves a pending guest note before the review period ends
- **THEN** the system approves the note and checks its proposed position before publication

#### Scenario: Host rejects a guest note
- **WHEN** the host rejects a pending guest note
- **THEN** the system does not publish the note and invalidates its submission token

#### Scenario: Guest note reaches the review timeout
- **WHEN** the host has not approved or rejected a guest note within 10 minutes of submission
- **THEN** the system approves and publishes it if its position is valid
- **AND** marks the note as needing review in host moderation

### Requirement: Return approved notes for a replacement position
If an approved guest note's proposed position is invalid when approval is applied, the system SHALL keep the note unpublished and allow the guest 30 minutes to choose and confirm a valid replacement position. The approved note text SHALL NOT require another content review. The system SHALL invalidate the submission if the guest does not complete placement within 30 minutes.

#### Scenario: Approved position has become invalid
- **WHEN** an approved guest note would cause more than 30% of any note currently on the board to be covered
- **THEN** the system returns the approved note to the guest to choose another position
- **AND** starts a 30-minute placement window

#### Scenario: Guest confirms a replacement position
- **WHEN** the guest confirms a valid replacement position within the placement window
- **THEN** the system publishes the note at that position without another content review

#### Scenario: Replacement position is invalid
- **WHEN** the guest confirms a replacement position that would cause more than 30% of any published note to be covered
- **THEN** the system rejects that position and lets the guest choose again within the remaining placement window

#### Scenario: Placement window expires
- **WHEN** the guest has not completed placement within 30 minutes
- **THEN** the system invalidates the approved submission and removes its token

### Requirement: Use a submission token only for the pending note
The system SHALL issue a unique token for each guest note submission so the submitting browser can check its status and choose a replacement position. The token SHALL be invalidated and removed after successful publication or submission invalidation, and SHALL NOT grant permission to delete a published note.

#### Scenario: Guest checks or places a pending note
- **WHEN** the guest presents the valid token for a pending note
- **THEN** the system allows the guest to check that note's status and complete an allowed replacement placement

#### Scenario: Guest token is invalidated
- **WHEN** the note is published or its submission is invalidated
- **THEN** the system removes the token and rejects further requests using it

#### Scenario: Guest attempts to delete a published note
- **WHEN** an accountless guest attempts to delete a published note
- **THEN** the system denies the request

### Requirement: Publish signed-in notes with a cooldown
The system SHALL publish a signed-in user's note after position confirmation without guest pre-approval. For one minute after publishing a note, the account SHALL NOT publish another note or delete its notes.

#### Scenario: Signed-in user publishes a note
- **WHEN** a signed-in user confirms a valid note position
- **THEN** the system publishes the note and starts a one-minute account cooldown

#### Scenario: Signed-in user acts during cooldown
- **WHEN** a signed-in user attempts to publish another note or delete a note during the one-minute cooldown
- **THEN** the system rejects the action and reports that the account is temporarily cooling down

#### Scenario: Signed-in user acts after cooldown
- **WHEN** a signed-in user's one-minute cooldown has elapsed
- **THEN** the system allows the user to publish another note or delete their own note

### Requirement: Allow the host to remove any note
The system SHALL allow the authenticated host owner to remove any published note.

#### Scenario: Host removes a published note
- **WHEN** the authenticated host owner removes a published note
- **THEN** the system removes it from the shared board and updates open board views

### Requirement: Batch noteboard AI moderation checks
The system SHALL collect eligible noteboard AI checks for up to 60 seconds and send them in provider requests containing at most five items. A full batch SHALL be sent immediately, and each provider request SHALL have a 60-second response limit.

#### Scenario: Batch fills before the collection window ends
- **WHEN** five eligible noteboard items are queued before 60 seconds have elapsed from the first eligible item
- **THEN** the system sends those five items together immediately

#### Scenario: Collection window expires with a partial batch
- **WHEN** fewer than five eligible noteboard items are queued when 60 seconds have elapsed from the first eligible item
- **THEN** the system sends the queued items together

#### Scenario: More than five items are eligible
- **WHEN** more than five noteboard items are eligible for AI review
- **THEN** the system sends no provider request with more than five items
- **AND** remaining eligible items are sent in subsequent batches

#### Scenario: Noteboard check becomes retry-ready
- **WHEN** an unavailable noteboard item's retry delay expires
- **THEN** the item becomes eligible for the same collection and batch limits as new noteboard items

#### Scenario: Provider does not respond within the limit
- **WHEN** the provider has not responded within 60 seconds for a noteboard batch
- **THEN** the system treats the check as unavailable and retains it for automatic retry
