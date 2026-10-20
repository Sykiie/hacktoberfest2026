# Spec Delta

## Purpose

Provides a shared, persistent text feed where visitors connected to one venue host can publish posts and comments. Accounts remain optional, and authors can choose whether signed-in identities are shown to other visitors.

## ADDED Requirements

### Requirement: Visitors can read a shared feed
The system SHALL provide one venue-local feed of text posts and their comments to visitors who can reach the community.

#### Scenario: Visitor opens the feed while hosting is enabled
- **WHEN** a visitor opens the guest link while the host accepts LAN connections
- **THEN** the visitor sees the shared feed and its posts

#### Scenario: Feed is ordered by recent activity
- **WHEN** the feed contains posts created at different times
- **THEN** the newest posts appear first and each post shows its comments

#### Scenario: Hosting is disabled
- **WHEN** a remote device opens the old guest link after the owner disables hosting
- **THEN** the device cannot reach the feed over the LAN

### Requirement: Visitors can publish text posts and comments without an account
The system SHALL allow any visitor who can reach the feed to publish a non-empty text post or comment without creating an account.

#### Scenario: Accountless visitor creates a post
- **WHEN** an unsigned visitor submits a valid text post
- **THEN** the post is added to the shared feed and its author is displayed as Anonymous

#### Scenario: Accountless visitor comments on a post
- **WHEN** an unsigned visitor submits a valid comment on an existing post
- **THEN** the comment appears under that post with its author displayed as Anonymous

#### Scenario: Visitor submits empty or oversized text
- **WHEN** a visitor submits an empty post or comment, or text longer than 2,000 characters
- **THEN** the system rejects the submission and explains the content limit

### Requirement: Signed-in authors can choose their public display identity
The system SHALL display a signed-in author's venue-local username by default and let the author choose anonymous display for each post or comment.

#### Scenario: Signed-in author publishes publicly
- **WHEN** a signed-in visitor submits a post or comment without choosing anonymous display
- **THEN** the shared feed displays that visitor's username as the author

#### Scenario: Signed-in author publishes anonymously
- **WHEN** a signed-in visitor chooses anonymous display before submitting a post or comment
- **THEN** other visitors see Anonymous instead of the account username
- **AND** the host privately retains the account association for author controls and moderation

#### Scenario: Host joins the public community
- **WHEN** the host signs in to a regular venue-local account and opens the shared feed
- **THEN** the host can post and comment under the same identity and anonymity rules as other signed-in visitors

### Requirement: Public feed does not expose anonymous account identities
The system SHALL hide the account identity associated with an anonymously displayed post or comment from other feed visitors.

#### Scenario: Visitor reads another user's anonymous contribution
- **WHEN** a visitor reads a post or comment submitted anonymously by a signed-in account
- **THEN** the visitor sees Anonymous and cannot retrieve the associated username through the public feed

### Requirement: Signed-in authors can manage their own contributions
The system SHALL let a signed-in author edit or delete their own posts and comments, including contributions displayed anonymously.

#### Scenario: Author edits their own contribution
- **WHEN** a signed-in author edits a post or comment they created
- **THEN** the system saves the updated text and keeps its public author display choice

#### Scenario: Author deletes their own contribution
- **WHEN** a signed-in author deletes a post or comment they created
- **THEN** the contribution is removed from the shared feed

#### Scenario: Author deletes a post with comments
- **WHEN** a signed-in author deletes a post that has comments
- **THEN** the post and its comments are removed from the shared feed

#### Scenario: Accountless visitor attempts to manage a contribution
- **WHEN** an unsigned visitor attempts to edit or delete an anonymous contribution
- **THEN** the system denies the action

#### Scenario: Signed-in visitor attempts to manage another author's contribution
- **WHEN** a signed-in visitor attempts to edit or delete a contribution they did not create
- **THEN** the system denies the action

### Requirement: Posts and comments persist on the venue host
The system SHALL preserve posts and comments on the host across application restarts.

#### Scenario: Host restarts the application
- **WHEN** the application stops and later starts again
- **THEN** previously saved posts and comments are still available in the shared feed
