# Spec Delta

## ADDED Requirements

### Requirement: Configure the AI moderation provider on the host
The authenticated owner SHALL be able to select and configure a supported local or cloud AI provider from host administration. Provider credentials SHALL be stored server-side and SHALL NOT be returned to guest clients or included in guest-facing APIs.

#### Scenario: Owner configures cloud credentials
- **WHEN** the owner saves a supported provider and API key in host administration
- **THEN** the host stores the credential securely and uses it for AI checks
- **AND** the credential is not shown again in full or exposed to guests

#### Scenario: Owner selects a local model
- **WHEN** the owner configures a local model provider
- **THEN** the host uses the local model for checks without requiring a cloud API key

#### Scenario: Guest requests AI configuration
- **WHEN** a guest requests community data or configuration
- **THEN** the response contains no provider credential or secret configuration

### Requirement: Show AI review results in host feed moderation
The system SHALL show AI check status and any flag reason for posts and comments in the authenticated owner's host-only Feed moderation view. AI review details SHALL NOT be exposed through guest-facing feed APIs.

#### Scenario: Owner views a flagged contribution
- **WHEN** the authenticated owner opens Feed moderation for a contribution flagged by the AI model
- **THEN** the interface shows that it needs review and displays the model's reason

#### Scenario: Owner views content without a completed AI check
- **WHEN** the owner opens Feed moderation for content whose AI check is pending or unavailable
- **THEN** the interface shows the current check status

#### Scenario: Guest requests the public feed
- **WHEN** a guest requests feed content for a contribution with an AI review result
- **THEN** the response does not include AI status, reason, or other moderation-only details

### Requirement: Let the owner resolve an AI review flag
The system SHALL let the authenticated owner mark an AI-flagged post or comment as reviewed without changing its content. Existing owner edit and delete actions SHALL remain available.

#### Scenario: Owner marks a flagged contribution reviewed
- **WHEN** the owner completes review of an AI-flagged post or comment
- **THEN** the system clears its needs-review status and retains its content

#### Scenario: Owner edits or deletes a flagged contribution
- **WHEN** the owner edits or deletes a flagged post or comment
- **THEN** the system applies the existing moderation action
