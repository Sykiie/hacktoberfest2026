# Spec Delta

## Purpose

Keeps open community feed views current when posts or comments change, including the public guest feed and the host's private moderation feed.

## ADDED Requirements

### Requirement: Open community feeds update when content changes
The system SHALL notify open guest and host moderation feeds when a post or comment is created, edited, or deleted, and each feed SHALL update its displayed content without reloading the whole page.

#### Scenario: Guest feed receives a new post
- **WHEN** a visitor creates a post while another guest feed is open
- **THEN** the open feed displays the new post automatically

#### Scenario: Open feeds receive a new comment
- **WHEN** a visitor comments on a post
- **THEN** open guest and host moderation feeds display the new comment automatically

#### Scenario: Open feeds reflect edited or deleted content
- **WHEN** a visitor or host edits or deletes a post or comment
- **THEN** open feeds update to show the saved content or its removal

### Requirement: Reconnected feeds catch up on community changes
The system SHALL refresh an open feed after its live update connection is established or re-established so the feed reflects changes made while it was disconnected.

#### Scenario: Feed connection reconnects after a network interruption
- **WHEN** a guest device reconnects to the live update stream after losing its connection
- **THEN** its feed reloads the current community content

### Requirement: Live update messages protect feed data
The system SHALL use live update messages only to signal that community content changed; clients SHALL retrieve feed content through the existing access-controlled feed endpoints.

#### Scenario: Client receives a content change notification
- **WHEN** a guest or host moderation client receives a live update message
- **THEN** the message does not disclose post text, comment text, or private author identities
