# Proposal

## Why

Visitors should be able to use the local community without an account, while also having the option to create a venue-local identity for future features that need a signed-in user. This milestone validates the simplest account flow without making registration a condition of joining.

## What Changes

- Add optional account registration and sign-in with a unique username and password for this host's community.
- Check username availability and enforce uniqueness when the account is created.
- Store passwords as salted, slow hashes on the venue host; never store plaintext passwords.
- Keep the welcome page available to guests without registration, with a clear anonymous/guest path.
- Explain during registration that this prototype uses HTTP, so passwords and sessions are not encrypted in transit; advise using a unique password not used elsewhere.
- Keep accounts local to this host. Do not add posts, private messages, email verification, password recovery, or HTTPS setup in this milestone.

## Capabilities

### New Capabilities

- `user-authentication`: Optional venue-local username and password accounts, with a guest path that does not require sign-in.

### Modified Capabilities

None. Guest welcome remains accessible without an account; account creation and sign-in are added as a separate capability.

## Impact

- Affected areas: guest welcome and account screens in the React app; LAN-accessible account APIs, account persistence, password hashing, and user sessions in the Node host; host-local data files; and README setup/security guidance.
- This prototype deliberately accepts that account passwords and sessions travel over the existing HTTP local-network connection. It is for low-stakes use with non-reused passwords, not sensitive information.
