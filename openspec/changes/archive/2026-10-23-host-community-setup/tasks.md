# Tasks

## 1. Community persistence and host APIs

- [x] 1.1 Add persistent community settings with Cafe/Other custom type validation, venue name validation, one-community enforcement, and enabled module selection; verify valid and invalid create/update cases.
- [x] 1.2 Expose authenticated admin operations for reading, creating, updating, and deleting community settings, and report community existence in admin status; verify unauthenticated requests are denied and the status reflects create/delete.
- [x] 1.3 Gate enabling guest hosting on community existence and implement deletion that is rejected while hosting is enabled, requires the current owner password, clears posts, notes, community accounts, and moderation history, and preserves owner credentials; verify incorrect passwords and enabled hosting leave the community intact and deletion permits replacement creation.

## 2. Host setup and management prompts

- [x] 2.1 Show Create community near hosting controls after owner sign-in when no community exists, and implement the prompt flow for Cafe/Other, venue name, and module checklist with both modules selected by default; verify a fresh installation offers creation without embedding the form in the Community tab.
- [x] 2.2 Implement Edit and Delete prompt flows, require hosting to be disabled before deletion, request the current owner password for confirmation, and resume the enable-hosting action after setup when setup was opened from Enable guest hosting; verify create, edit, rejected deletion while hosting is on, password confirmation, and hosting continuation behavior.

## 3. Guest module selection

- [x] 3.1 Render only enabled module tabs and content in the guest community, and select an enabled module if the current tab becomes disabled; verify each module can be hidden and restored through host settings.

## 4. Integrated verification

- [x] 4.1 Verify the full owner flow from sign-in through community creation, hosting enablement, module visibility, editing, deletion, and replacement creation, including that deletion leaves owner sign-in available.
