# Design

## Context

See [proposal.md](proposal.md) for motivation and [the community-feed](specs/community-feed/spec.md) and [host-moderation](specs/host-moderation/spec.md) deltas for observable behavior. The host is a single Express process. Posts and comments are stored in one JSON file, mutations are serialized, public and owner moderation projections are separate, and owner moderation APIs are loopback-only. Feed changes already notify clients through a content-free server-sent event.

## Goals / Non-Goals

**Goals:**
- Add model-assisted triage without making AI a gate for posting or a substitute for host judgment.
- Support local inference that keeps text on the venue host and cloud inference selected by the host.
- Recover persisted checks after model outage or host restart without applying stale results to edited content.

**Non-Goals:**
- Automatically hide, edit, delete, or punish users based on model output.
- AI review for Noteboard notes or image/file analysis.
- Re-scanning the existing feed as a bulk migration.

## Decisions

### Use a provider adapter for local and cloud inference

The owner configures either a local open-weight model runtime or a supported cloud provider. A provider adapter accepts plain text and returns a validated result (`flagged`, reason) or an availability/error result. Cloud credentials stay server-side and are stored using host-only secret storage; redact them from logs and never return them through guest APIs. Local inference sends no text off-host. Cloud setup clearly discloses that contribution text is sent to the chosen provider. The adapter has no tools or authority to mutate community data.

An adapter keeps provider-specific APIs out of feed logic. Bundling model weights with the app would make installation and updates large; cloud providers avoid local hardware limits but process submitted text externally.

### Persist status with each contribution and process checks outside store mutations

Store moderation metadata on each post and comment alongside the current content: check state, the content revision or hash checked, result reason when flagged, and check time. The states distinguish unchecked/pending, unavailable, clear, flagged, and host-reviewed. The public projection remains allowlisted and omits all moderation metadata; only the existing owner moderation projection includes it.

Persist the content first, then enqueue classification so a slow model never holds the JSON store's serialized mutation queue. A single bounded worker processes the latest revision for each item. If text changes during inference, discard the stale result and check the current text. Editing a reviewed item starts a new check. Marking a flag reviewed clears the active review state but retains the model result for context.

### Retry from persisted state

On startup, and whenever the configured provider becomes reachable, scan persisted posts and comments for unavailable checks and enqueue them. Periodically retry provider health with a capped backoff when unavailable. A provider failure leaves the item available to guests with an unavailable status and preserves it for retry; success updates the private moderation projection and broadcasts the existing content-free feed-changed event.

This uses the existing feed JSON as the durable queue, avoiding another queue store or service. Existing contributions without AI metadata are treated as not checked and are not automatically backfilled; new and edited content enters the check flow.

### Keep host moderation actions human-controlled

Extend the Feed moderation view to show pending, unavailable, clear, flagged, and reviewed states. Show the model reason only to the authenticated owner. Add an owner action to mark a flag reviewed; retain existing edit and delete actions. A result or state transition does not go in the SSE payload; clients refresh through the already authorized feed endpoints.

## Risks / Trade-offs

- [Local models may be slow or exceed the host's memory] → Keep posting independent of inference, process checks one at a time, and allow the host to configure a model compatible with the computer.
- [Model output can be wrong or manipulated by text crafted as instructions] → Treat submitted text as untrusted data, use a constrained classifier prompt/output schema with no tools, show the reason as a suggestion, and leave decisions to the host.
- [A local runtime or cloud provider can be stopped while guest hosting remains active] → Persist unavailable status and retry with backoff; do not lose or block contributions.
- [Cloud credentials or contribution text could be exposed] → Store keys server-side, redact them from logs, keep them out of public projections, and disclose provider processing in host setup.
- [Feed updates could disclose moderation metadata if projections are mixed] → Keep public and owner projections separate and send only content-free event notifications.
- [A model response can arrive after content was edited or deleted] → Check the current text revision before persisting any result; ignore results for removed items.

## Migration Plan

Existing JSON records remain readable. Treat their missing AI metadata as not checked and do not automatically scan historical content. New or edited contributions acquire AI metadata. Rollback can ignore the optional metadata fields; community text and author fields remain unchanged. No migration removes content.

