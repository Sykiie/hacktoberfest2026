# Spec Delta

## MODIFIED Requirements

### Requirement: Sign in and out
The system SHALL allow account holders to sign in with their username and password and sign out of their community session. Invalid credentials SHALL produce a generic sign-in failure that does not reveal whether the username exists. For signed-in users, the community header SHALL show their signed-in identity as the account-menu trigger and place profile-image actions and sign-out inside that menu.

#### Scenario: Valid sign-in
- **WHEN** a visitor submits valid credentials
- **THEN** the system starts an authenticated community session

#### Scenario: Invalid sign-in
- **WHEN** a visitor submits an invalid username or password
- **THEN** the system rejects the sign-in with a generic error

#### Scenario: Signed-in user opens account menu
- **WHEN** an authenticated community user opens the account menu
- **THEN** the visible trigger identifies the signed-in username
- **AND** the menu offers Profile image, Remove image, and Sign out

#### Scenario: Sign out
- **WHEN** an authenticated user selects Sign out from the account menu
- **THEN** the system ends that user's community session
