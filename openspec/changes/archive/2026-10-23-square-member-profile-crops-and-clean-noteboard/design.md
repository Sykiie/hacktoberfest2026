# Design

## Context

The community header currently sends the selected file directly to `PUT /api/account/profile-image`. Profile images are rendered in fixed-size avatar containers with `object-fit: cover`, but the stored source can have arbitrary aspect ratio. Noteboard cards render an `Avatar` beside each note display name.

## Decisions

- Add a client-side square crop confirmation step to the signed-in member image selection flow. The source image remains local until the member confirms; cancellation leaves the existing image unchanged.
- Upload the confirmed crop using the existing profile image endpoint and content type. Existing server-side size and format validation remains authoritative; handle any resulting upload error in the existing profile image error area.
- Keep the public note display name and remove the note avatar from the card. Profile image data may remain in API responses for other consumers; this change only affects noteboard presentation.
- Leave venue profile image uploads unchanged.

## Risks

- Client-side crop encoding can increase or decrease payload size; server validation should report a clear error if the result exceeds limits.
- Crop controls need keyboard-accessible confirmation and cancellation and should preview the resulting square image.

## Open Questions

None. The crop is assumed to be an interactive square selection that the member can position before confirming.
