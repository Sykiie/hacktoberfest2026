# Community Feed Specification

## Purpose

Define the venue's shared text feed, including posts, comments, authorship, ownership, persistence, and live updates.

## Requirements

### Requirement: Shared venue feed
The system SHALL provide a text-post feed for a hosted venue community. The feed SHALL show posts newest first and provide access to each post's comments. Feed content SHALL be available to users who can reach the venue host while guest hosting is enabled.

#### Scenario: View the feed
- **WHEN** a visitor opens the community feed while guest hosting is enabled
- **THEN** the visitor sees posts ordered newest first and can open their comments

#### Scenario: Hosting is disabled
- **WHEN** a device on the venue network requests the community while guest hosting is disabled
- **THEN** the request cannot access the community feed

### Requirement: Create posts and comments
The system SHALL allow visitors, including visitors who continue as guests, to create text posts and comments without requiring an account. Post and comment text SHALL be non-empty and no longer than 2,000 characters. The system SHALL reject invalid submissions and report an error without creating the content.

#### Scenario: Guest creates a post or comment
- **WHEN** an accountless visitor submits valid text
- **THEN** the system creates the content with the public author label "Anonymous"

#### Scenario: Signed-in user creates content
- **WHEN** a signed-in user submits a post or comment without choosing anonymous posting
- **THEN** the system creates the content with that user's username as its public author label

#### Scenario: Signed-in user chooses anonymous posting
- **WHEN** a signed-in user submits a post or comment with anonymous posting enabled
- **THEN** other community visitors see the public author label "Anonymous"
- **AND** the host retains the signed-in user's ownership identity for moderation

### Requirement: Edit and delete own content
The system SHALL allow a signed-in author to edit or delete their own posts and comments. It SHALL deny ownership-based editing and deletion to accountless guests and deny signed-in users access to content owned by another account. Deleting a post SHALL also delete its comments.

#### Scenario: Signed-in author manages own content
- **WHEN** a signed-in author edits or deletes their own post or comment
- **THEN** the system applies the change

#### Scenario: User attempts to manage another author's content
- **WHEN** a signed-in user attempts an ownership-based edit or deletion of another author's content
- **THEN** the system denies the request

#### Scenario: Guest attempts ownership-based management
- **WHEN** an accountless guest attempts to edit or delete community content
- **THEN** the system denies the request

#### Scenario: Delete a post with comments
- **WHEN** a post is deleted by its author or the host administrator
- **THEN** the post and all of its comments are deleted

### Requirement: Persist community content
The system SHALL preserve posts and comments across application restarts.

#### Scenario: Restart the host application
- **WHEN** the host application restarts
- **THEN** previously created posts and comments remain available

### Requirement: Update open feeds live
The system SHALL update open guest and host moderation feeds after a post or comment is created, edited, or deleted, without requiring a page reload. Live update messages SHALL indicate that feed data changed without including post or comment content; clients SHALL retrieve current content through the existing authorized feed endpoints. A client that reconnects SHALL refresh its feed to obtain the latest state.

#### Scenario: Content changes while a feed is open
- **WHEN** any user creates, edits, or deletes a post or comment
- **THEN** open guest and host moderation feeds refresh to show the current feed without a full page reload

#### Scenario: Feed client reconnects
- **WHEN** a feed client's live-update connection is re-established
- **THEN** the client refreshes the feed and shows the latest content

#### Scenario: Live update is delivered
- **WHEN** the server notifies clients that feed data changed
- **THEN** the notification contains no post or comment body or author identity
- **AND** clients obtain feed data using their normal authorized requests
