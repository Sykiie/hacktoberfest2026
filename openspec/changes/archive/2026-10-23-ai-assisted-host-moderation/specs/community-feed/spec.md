# Spec Delta

## ADDED Requirements

### Requirement: Check feed content with the venue host's AI model
The system SHALL check each new or edited post and comment with the local or cloud AI provider configured by the host. When a cloud provider is selected, the system SHALL disclose that contribution text is sent to that provider. The system SHALL keep content visible while it is being checked and after it is flagged; the AI SHALL NOT hide, edit, or delete content.

#### Scenario: Model returns a review flag
- **WHEN** the model identifies a new or edited post or comment for host review
- **THEN** the system stores the review status and model-provided reason with that content
- **AND** the content remains visible in the guest feed

#### Scenario: Model clears content
- **WHEN** the model checks a new or edited post or comment and does not flag it
- **THEN** the system records that the current content was checked and not flagged

#### Scenario: Content is edited while a prior check is pending
- **WHEN** a post or comment is edited before its earlier AI check completes
- **THEN** the system checks the current text
- **AND** does not apply a result for the earlier text to the edited content

#### Scenario: Host configures a cloud provider
- **WHEN** the host selects a cloud AI provider for feed checks
- **THEN** the system sends contribution text to that provider for classification
- **AND** the host-facing setup explains that content is processed by the selected provider

### Requirement: Preserve and retry unavailable AI checks
The system SHALL persist AI check status with feed content and automatically retry items marked unavailable when the venue host's model becomes available.

#### Scenario: Model is unavailable at submission
- **WHEN** a visitor creates a post or comment while the model is unavailable
- **THEN** the system publishes the content and marks its AI check as unavailable

#### Scenario: Model becomes available
- **WHEN** the host model becomes available while posts or comments have an unavailable AI check
- **THEN** the system automatically checks those items and updates their status

#### Scenario: Model remains unavailable during retry
- **WHEN** an automatic retry cannot reach the model
- **THEN** the system retains the unavailable status and retries again when the model is available

#### Scenario: Host restarts with unavailable checks
- **WHEN** the host application restarts while feed items have unavailable AI checks
- **THEN** the system retains those statuses and resumes checking them when the model is available
