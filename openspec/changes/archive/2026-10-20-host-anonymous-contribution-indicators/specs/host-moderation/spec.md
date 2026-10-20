# Spec Delta

## Purpose

Provides the venue owner a private moderation view that shows signed-in authors and clearly distinguishes their public anonymity choice from their actual account identity.

## ADDED Requirements

### Requirement: Host moderation indicates contributions posted anonymously to guests
The system SHALL show the signed-in username and a clear anonymity indicator for a post or comment that its signed-in author chose to publish anonymously to guests.

#### Scenario: Owner reviews an anonymous signed-in post
- **WHEN** the owner views a post published anonymously by a signed-in account
- **THEN** the moderation feed shows the account username and indicates that the post is anonymous to guests

#### Scenario: Owner reviews an anonymous signed-in comment
- **WHEN** the owner views a comment published anonymously by a signed-in account
- **THEN** the moderation feed shows the account username and indicates that the comment is anonymous to guests

#### Scenario: Owner reviews a publicly attributed signed-in contribution
- **WHEN** the owner views a post or comment published with the signed-in user's public identity
- **THEN** the moderation feed shows the username without an anonymity indicator

#### Scenario: Owner reviews accountless guest content
- **WHEN** the owner views a post or comment created without an account
- **THEN** the moderation feed continues to label its author as an anonymous guest without showing a username
