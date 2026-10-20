# Spec Delta

## Purpose

Provides optional, venue-local user accounts while allowing visitors to reach the local community anonymously. This capability establishes user identity for future account-gated features without making sign-in a condition of joining.

## ADDED Requirements

### Requirement: Guest access does not require an account
The system SHALL let visitors use the guest-facing community without registering or signing in.

#### Scenario: Visitor continues anonymously
- **WHEN** a visitor opens the community and chooses the guest or anonymous path
- **THEN** the visitor reaches the guest-facing community without submitting an account name or password

### Requirement: Visitor can create a venue-local account
The system SHALL let a visitor create an account with a username and password scoped to the current host's community.

#### Scenario: Visitor registers with an available username
- **WHEN** a visitor submits a valid, available username and matching password confirmation
- **THEN** the system creates the account for this host and signs the visitor in

#### Scenario: Visitor submits a username that is already taken
- **WHEN** a visitor attempts to register a username already used in this host's community
- **THEN** the system rejects the registration and explains that the username is unavailable

### Requirement: Username availability is checked and enforced
The system SHALL report whether a username is available and SHALL enforce username uniqueness when creating accounts, without relying only on a prior availability check.

#### Scenario: Visitor checks username availability
- **WHEN** a visitor checks an otherwise valid username
- **THEN** the system reports whether that username is available in the current host's community

#### Scenario: Two visitors attempt the same username
- **WHEN** multiple registration attempts race to create the same username
- **THEN** no more than one account is created with that username

### Requirement: Passwords are stored as salted password hashes
The system SHALL store a salted, slow password hash for each account and SHALL NOT store the account password in plaintext.

#### Scenario: Account password is persisted
- **WHEN** an account is saved on the host
- **THEN** persistent account data contains a salted password hash rather than the submitted password

### Requirement: Account holder can sign in and out
The system SHALL allow an account holder to sign in with the account username and password and to end the current signed-in session.

#### Scenario: Account holder signs in
- **WHEN** a visitor submits valid credentials for an existing account
- **THEN** the system signs the visitor into that account

#### Scenario: Visitor submits invalid credentials
- **WHEN** a visitor submits an unknown username or incorrect password
- **THEN** the system denies sign-in and reports a generic credential error

#### Scenario: Account holder signs out
- **WHEN** a signed-in account holder signs out
- **THEN** the current browser session is invalidated and the guest-facing community remains available anonymously

### Requirement: Prototype account security limitation is disclosed
The system SHALL tell visitors before account creation that this prototype uses HTTP on the local network, credentials and sessions are not encrypted in transit, and a unique password not used elsewhere is recommended.

#### Scenario: Visitor opens account registration
- **WHEN** a visitor views the account registration form
- **THEN** the system displays the prototype security notice before the visitor submits a password
