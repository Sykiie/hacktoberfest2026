# Design

## Context

The Express host serves both the guest LAN feed and the loopback-only admin moderation feed. Each React view currently fetches its feed on mount and after its own mutations, but other clients' changes remain invisible until a manual or incidental refresh. See proposal.md and specs/community-feed/spec.md for the motivation and required behavior.

## Goals / Non-Goals

**Goals:**
- Deliver low-latency feed invalidation to connected guest and host moderation views.
- Preserve the existing HTTP feed endpoints as the source of truth and authorization boundary.
- Recover current content after an event stream reconnects.

**Non-Goals:**
- Send post or comment contents over the event stream.
- Add client-to-server live messaging, typing indicators, presence, or chat.
- Guarantee event delivery while a client is offline; reconnect refresh recovers the latest persisted state.

## Decisions

- Use the browser's native `EventSource` API and an Express Server-Sent Events endpoint. This is server-to-client communication, so WebSockets and an additional runtime dependency are unnecessary.
- Keep a set of connected event responses in the host process. After a successful create, edit, or delete of a post or comment—whether initiated by a guest or through host moderation—broadcast one generic feed-changed event to each connected client.
- Make the event payload contain no content or identity data. Both guest and host views respond by fetching their own existing feed endpoint, preserving guest visibility rules and loopback/admin authorization for moderation data.
- Remove a response from the connection set when the browser disconnects. Send periodic comment heartbeats so idle streams remain active across Wi-Fi and browser networking timeouts.
- On initial EventSource open and every reconnection, refresh the feed snapshot. This avoids event replay storage and recovers changes missed while disconnected.
- Open the stream only while its feed view is mounted. Native EventSource reconnect behavior handles temporary connection loss; closing/unmounting the view releases its stream.

## Risks / Trade-offs

- Each open browser tab holds an HTTP connection → Appropriate for the expected small venue community; ensure disconnect cleanup and heartbeat handling.
- A client may miss an event during a network interruption → Refresh the existing feed endpoint each time the stream opens or reconnects.
- A public guest event stream reveals when the feed changes, but no post details or private identity → Keep event payloads generic and continue fetching actual content through existing endpoints.
- A client can briefly display stale content before a change notification arrives → The existing HTTP fetch remains authoritative, and the event updates the view without a full page reload.

## Migration Plan

No stored data migration or new package is required. Deploy the updated host application, rebuild the React client, and restart the host. Older clients continue to work with the existing HTTP feed endpoints but will not receive live updates.
