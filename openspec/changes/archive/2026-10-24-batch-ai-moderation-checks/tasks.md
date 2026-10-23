# Tasks

## 1. Timed AI batching

- [x] 1.1 Update the host AI worker to collect eligible feed and noteboard checks for up to 60 seconds, dispatch at five items, cap requests at five, and preserve serialized processing; verify the queue timing, mixed-module batching, full-batch dispatch, and partial flush behavior in host tests.
- [x] 1.2 Ensure retry-ready items enter the same timed queue only after their existing backoff expires; verify pending items are not blocked by delayed retries and retry timing remains covered in host tests.

## 2. Provider response timeout

- [x] 2.1 Raise the provider batch request abort timeout to 60 seconds and retain existing unavailable/retry handling; verify timeout and successful response behavior in AI moderation and host tests.
- [x] 2.2 Update README moderation documentation to explain the 60-second collection window, five-item early dispatch, and 60-second provider response limit; verify the wording matches the implemented behavior.

## 3. Integration verification

- [x] 3.1 Run the relevant host and AI moderation test suites and the production build; confirm mixed feed/noteboard batches, bounded request size, timeout handling, and no UI or build regressions.
