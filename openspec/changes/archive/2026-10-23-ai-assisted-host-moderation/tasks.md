# Tasks

## 1. Provider Configuration and Adapters

- [x] 1.1 Define supported local and cloud provider configuration, select the initial providers, and document setup and cloud data disclosure; verify local setup works without a key and cloud setup requires a provider key.
- [x] 1.2 Implement provider adapters that classify plain text, validate structured flag/reason output, apply timeouts, and report unavailable errors; verify behavior with focused tests using fake providers.

## 2. Persisted Feed Check State

- [x] 2.1 Add per-post and per-comment AI check metadata to the community store, default legacy records to not checked, and invalidate prior results on edits; verify old JSON still loads and stale results cannot apply to changed text.
- [x] 2.2 Add store-level tests for checked, flagged, unavailable, and host-reviewed states, including persistence across reloads and post deletion cascading to comments; verify the existing feed data remains readable.

## 3. Asynchronous Checks and Recovery

- [x] 3.1 Add a bounded background worker that checks newly created and edited content after persistence without holding the store mutation queue; verify publishing succeeds while inference is delayed and results update the current item only.
- [x] 3.2 Resume unavailable checks at startup and retry when the provider recovers, using capped backoff and avoiding duplicate work; verify outage, recovery, and restart behavior with provider lifecycle tests.
- [x] 3.3 Broadcast content-free feed-change events when check status changes and verify open host moderation views refresh through their authorized endpoint without moderation data in event payloads.

## 4. Host Moderation and Setup

- [x] 4.1 Extend the owner moderation projection and Feed view with pending, unavailable, clear, flagged, and reviewed statuses plus flag reasons; verify public feed responses never expose AI metadata and owner-only routes retain their existing access checks.
- [x] 4.2 Add an owner action to mark an AI flag reviewed while retaining existing edit/delete actions; verify the review action preserves content and a later edit triggers a fresh check.
- [x] 4.3 Update host setup and community moderation documentation for local/cloud configuration, secret handling, provider data processing, unavailable status, automatic retry, and human review; verify documented settings match the provider adapters.

## 5. Integration Verification

- [x] 5.1 Verify a full flow from guest post/comment creation through an unavailable model, automatic recovery check, private host flag display, and host review using the project test suite and production build.
