# Spec Delta

## ADDED Requirements

### Requirement: Batch feed AI moderation checks
The system SHALL collect eligible feed AI checks for up to 60 seconds and send them in provider requests containing at most five items. A full batch SHALL be sent immediately, and each provider request SHALL have a 60-second response limit.

#### Scenario: Batch fills before the collection window ends
- **WHEN** five eligible feed items are queued before 60 seconds have elapsed from the first eligible item
- **THEN** the system sends those five items together immediately

#### Scenario: Collection window expires with a partial batch
- **WHEN** fewer than five eligible feed items are queued when 60 seconds have elapsed from the first eligible item
- **THEN** the system sends the queued items together

#### Scenario: More than five items are eligible
- **WHEN** more than five feed items are eligible for AI review
- **THEN** the system sends no provider request with more than five items
- **AND** remaining eligible items are sent in subsequent batches

#### Scenario: Feed check becomes retry-ready
- **WHEN** an unavailable feed item's retry delay expires
- **THEN** the item becomes eligible for the same collection and batch limits as new feed items

#### Scenario: Provider does not respond within the limit
- **WHEN** the provider has not responded within 60 seconds for a feed batch
- **THEN** the system treats the check as unavailable and retains it for automatic retry
