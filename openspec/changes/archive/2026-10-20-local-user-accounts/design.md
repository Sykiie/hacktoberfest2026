# Design

## Context

The host serves a static React guest welcome page over private LAN listeners and keeps admin routes restricted to loopback. Admin credentials live separately in `data/owner.json`; the existing auth helper uses Node's `scrypt` and process-memory sessions. There is no user database or guest authentication today. See proposal.md for motivation and the accepted HTTP prototype tradeoff.

## Goals / Non-Goals

**Goals:**
- Add optional venue-local account registration, sign-in, and sign-out.
- Keep anonymous use as the default path through the guest welcome page.
- Enforce unique usernames and persist account password hashes on the host.
- Make the prototype's lack of transport encryption clear at sign-up.

**Non-Goals:**
- Add social posts, private or sensitive data, roles, cross-venue accounts, email verification, or password recovery.
- Add HTTPS or change the existing owner-only admin authentication.

## Decisions

1. **Keep guest and account entry side by side.** The guest welcome stays open without a login. Provide clearly separate create-account and sign-in actions from that screen; account creation signs the visitor in. The signed-in view only confirms the local username and offers sign-out until later features need identity.

2. **Scope accounts to one host and keep admin auth separate.** Each host has its own account set in `data/users.json`. Reuse the existing local-auth patterns where appropriate, but use a distinct user auth service, API routes, session cookie, and records so guest accounts never grant owner controls.

3. **Use a small local JSON store for the prototype.** Store normalized username, display username, random salt, and a `scrypt` hash for each account; never persist the submitted password. Serialize account creation in the single Node process and re-check username availability inside that serialized operation so concurrent registrations cannot claim the same normalized username. Use a case-insensitive username key and a short documented format (3-24 ASCII letters, digits, or underscores). Keep the password minimum at 10 characters, consistent with the owner password-change flow.

4. **Use process-memory sessions and disclose their transport risk.** Issue an HttpOnly, SameSite cookie after sign-up or sign-in and clear it on sign-out or server restart. The prototype's HTTP listener means account credentials and session cookies are not encrypted in transit; show a clear notice before password submission and recommend a unique, disposable password. Keep all account-gated sensitive features out of scope until HTTPS is designed.

5. **Keep public APIs separate from admin routes.** Add user registration, availability, sign-in, sign-out, and current-session endpoints outside `/api/admin`. These endpoints are reachable only through the same guest LAN listener while hosting is enabled; the existing loopback guard on admin pages and APIs remains unchanged.

## Risks / Trade-offs

- [Credentials or sessions can be intercepted on an untrusted or compromised venue network] -> Disclose the limitation before registration, recommend unique non-reused passwords, avoid sensitive account features, and treat HTTPS as a prerequisite for raising account privileges.
- [A JSON store has less built-in integrity and concurrency support than a database] -> Keep the prototype single-process, serialize registrations, re-check uniqueness immediately before saving, and write the store through a temporary file before replacing it.
- [A public availability check reveals whether a username is registered] -> Return only availability for the requested username, do not expose account profile data, and keep sign-in errors generic.
- [Users may forget locally managed passwords] -> Keep account recovery and email out of this prototype; document that there is no self-service recovery yet.

## Migration Plan

Create `data/users.json` on the first successful registration; existing `data/owner.json` and host settings remain untouched. Rollback stops serving user-auth endpoints but preserves the account file for a later re-enable; do not delete account data automatically.
