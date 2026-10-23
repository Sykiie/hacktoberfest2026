## MODIFIED Requirements

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
