# Design

## Context

The host scans pending and unavailable AI checks from the community feed and noteboard, filters out items whose retry delay has not expired, and submits ready items in chunks of five. The scan is triggered after content changes and periodically for retries. Provider requests currently have a 30-second abort timeout. See `proposal.md` for the motivation and `specs/` for the required behavior.

## Goals / Non-Goals

**Goals:**
- Add a bounded collection window while retaining one shared queue across feed and noteboard.
- Keep each provider request at or below five items and send a full batch without waiting for the timer.
- Limit each provider request to 60 seconds, preserving existing unavailable status and retry handling.

**Non-Goals:**
- Change which content categories the classifier flags or how host review works.
- Change retry backoff, provider configuration, or whether content remains visible during checks.
- Persist queued timer state across host restarts; pending and unavailable records are rediscovered from their stores.

## Decisions

- **Use one shared in-memory collection window for all eligible items.** Start the window when an item is first found eligible and no collection window is active. Subsequent eligible feed or noteboard items join without resetting its deadline. This preserves the current combined queue and allows contributions from either module to share provider requests. A per-module window was considered, but would fragment batches and increase requests.
- **Dispatch at five items or at the 60-second deadline, whichever comes first.** Send at most five items in a request. If more than five are eligible when dispatch occurs, process the remainder as subsequent batches under the same bounded rules. Do not hold a partial batch past its deadline to wait for additional arrivals.
- **Keep retry eligibility separate from batch timing.** An unavailable item joins the collection only after its existing `nextAt`; items still in backoff do not delay or block eligible new items. The periodic retry scan continues to discover newly retry-ready items.
- **Set the provider request abort timeout to 60 seconds.** A timeout follows the existing failed-request path: mark affected items unavailable and calculate retry backoff. A single timeout applies to the whole batch request.

## Risks / Trade-offs

- **A sparse queue waits up to 60 seconds before review starts** → This delay is bounded by the selected collection window; a full batch dispatches immediately.
- **Items may wait longer when a prior provider batch is still in flight** → Keep the worker serialized to avoid duplicate checks and concurrent provider load; queued items start or continue their collection window and run after the active request completes.
- **A host restart loses the in-memory collection deadline** → Persisted pending/unavailable items are rediscovered on startup and enter a fresh window.

