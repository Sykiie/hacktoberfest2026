# User Authentication Specification

## Purpose

Define optional community accounts for visitors while preserving guest access to the local community.

## Requirements

### Requirement: Allow optional community accounts
The system SHALL allow visitors to use the community without creating an account. Visitors SHALL also be able to create an account and sign in with a unique username and password. Community account credentials SHALL be separate from the venue owner's administration credentials.

#### Scenario: Visitor continues as guest
- **WHEN** a visitor chooses to continue without an account
- **THEN** the system allows the visitor to enter the community without signing in

#### Scenario: Visitor creates an account
- **WHEN** a visitor submits a valid, available username and password
- **THEN** the system creates the account and signs the visitor in

### Requirement: Validate unique usernames
The system SHALL accept usernames containing 3 to 24 letters, numbers, or underscores. Usernames SHALL be unique without regard to letter case. The system SHALL allow visitors to check username availability and SHALL enforce uniqueness when an account is created, including when concurrent requests submit the same username.

#### Scenario: Check username availability
- **WHEN** a visitor checks a syntactically valid username
- **THEN** the system reports whether that username is available

#### Scenario: Register an existing username
- **WHEN** a visitor attempts to create an account with a username already in use, ignoring case
- **THEN** the system rejects the registration

#### Scenario: Concurrent registration
- **WHEN** multiple registration requests attempt to claim the same username at the same time
- **THEN** at most one request creates the account
- **AND** the other requests are rejected as unavailable

### Requirement: Store passwords safely
The system SHALL store passwords using a salted, slow password-hashing function and SHALL NOT store plaintext passwords.

#### Scenario: Account is created
- **WHEN** the system stores a new account
- **THEN** it stores a salted password hash rather than the submitted password

### Requirement: Sign in and out
The system SHALL allow account holders to sign in with their username and password and sign out of their community session. Invalid credentials SHALL produce a generic sign-in failure that does not reveal whether the username exists.

#### Scenario: Valid sign-in
- **WHEN** a visitor submits valid credentials
- **THEN** the system starts an authenticated community session

#### Scenario: Invalid sign-in
- **WHEN** a visitor submits an invalid username or password
- **THEN** the system rejects the sign-in with a generic error

#### Scenario: Sign out
- **WHEN** an authenticated user signs out
- **THEN** the system ends that user's community session

### Requirement: Explain transport limitations at registration
The account creation interface SHALL tell users that credentials and sessions are not encrypted when the application is accessed over HTTP, and recommend using a unique password that is not used for other services.

#### Scenario: Visitor opens account creation
- **WHEN** a visitor opens the account creation form
- **THEN** the interface explains the HTTP credential and session risk and advises using a unique password
