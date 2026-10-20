# Community Interface Specification

## Purpose

Define how visitors enter the community and how the host administration interface organizes its controls.

## Requirements

### Requirement: Choose an entry path before the feed
Visitors without an authenticated community session SHALL see options to sign in, create an account, or continue as a guest before entering the feed. Visitors with an existing authenticated community session SHALL proceed directly to the feed. A signed-in user's community identity SHALL remain separate from the venue owner's administration identity.

#### Scenario: Visitor has no community session
- **WHEN** a visitor opens the guest-facing interface without an authenticated community session
- **THEN** the system presents sign-in, account creation, and continue-as-guest choices before showing the feed

#### Scenario: Visitor continues as guest
- **WHEN** an unauthenticated visitor chooses to continue as a guest
- **THEN** the system opens the community feed

#### Scenario: User already has a community session
- **WHEN** a signed-in user opens the guest-facing interface with a valid session
- **THEN** the system opens the community feed directly

#### Scenario: Community user opens host administration
- **WHEN** a signed-in community user opens the host administration interface
- **THEN** the system still requires separate owner authentication

### Requirement: Organize administration into tabs
The administration interface SHALL organize its controls into Hosting, Community, and Security tabs. Only the selected tab's content SHALL be displayed, and Hosting SHALL be selected by default.

#### Scenario: Owner opens administration
- **WHEN** an authenticated owner opens the administration interface
- **THEN** the Hosting tab is selected by default

#### Scenario: Owner selects an administration tab
- **WHEN** the owner selects Hosting, Community, or Security
- **THEN** the system displays that tab's content and hides the other tabs' content
