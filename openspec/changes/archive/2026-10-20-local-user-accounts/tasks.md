# Tasks

## 1. Add local user account storage and authentication

- [x] 1.1 Implement the venue-local account store with normalized unique usernames and salted `scrypt` password hashes; verify persisted records contain no plaintext passwords and duplicate concurrent registrations cannot succeed.
- [x] 1.2 Add LAN guest APIs for username availability, registration, sign-in, current session, and sign-out using user sessions separate from owner admin sessions; verify valid, invalid, duplicate, and signed-out flows with automated tests.

## 2. Add optional guest account entry

- [x] 2.1 Add create-account and sign-in screens from the guest welcome page while preserving an obvious continue-anonymously path; verify anonymous access works without account credentials and signed-in users can sign out.
- [x] 2.2 Add username format and password confirmation feedback, availability checking, and the prototype HTTP security notice before password submission; verify account creation and sign-in UI build successfully.
- [x] 2.3 Document venue-local accounts, anonymous access, password storage, the HTTP interception tradeoff, and the recommendation to use a unique disposable password; verify the README matches the implemented flows.

## 3. Verify account access on the venue network

- [x] 3.1 Verify the guest can register and sign in through the LAN while hosting is enabled, anonymous welcome remains available, LAN access ends when hosting is disabled, and owner admin routes remain host-only; run the automated account and host lifecycle tests.
