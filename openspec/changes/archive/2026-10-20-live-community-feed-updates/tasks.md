# Tasks

## 1. Host event stream

- [x] 1.1 Add a Server-Sent Events endpoint with heartbeat and disconnect cleanup; verify clients can subscribe and disconnected responses are removed.
- [x] 1.2 Broadcast a generic feed-changed event after successful guest and host create, edit, and delete operations for posts and comments; verify failed operations do not broadcast and event payloads contain no content or author identity.

## 2. Feed subscriptions

- [x] 2.1 Subscribe the guest feed and host moderation feed with EventSource, refresh their existing feed endpoint on open/reconnect and change events, and close subscriptions when views unmount; verify both feeds update in place after changes from another client.
- [x] 2.2 Document automatic feed updates and reconnect recovery in the README; verify the documented behavior matches the implementation.

## 3. End-to-end verification

- [x] 3.1 Perform a two-device LAN smoke check for new posts and comments, plus edits/deletions, confirming guest and host moderation views update without page reload and catch up after reconnect.
