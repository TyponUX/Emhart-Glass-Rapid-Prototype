# Task 13 — Support chat thread

- **Status:** Done
- **Phase:** 4 — Support
- **Dependencies:** Task 12

## Objective

Provide an equipment-linked chat thread with messages, unread state, replies, status, resolution, and next action.

## Scope

- Conversation messages
- Sender and timestamps
- Unread message state
- Reply input
- Attachment affordance
- Status selector
- Resolve action
- Feedback/closure next action

## Acceptance criteria

- [x] A request shows its conversation and status together.
- [x] Unread messages are visibly marked.
- [x] A user can send a reply.
- [x] A user can change status or mark the request resolved.
- [x] The next action changes after resolution.

## Plan and verification result

- Implemented the chat thread in `src/features/support/support-center.tsx`.
- Added local prototype message state and reply behaviour.
- Added support status selector and Mark resolved action.
- Browser verified a reply appears in the thread and resolution changes the next action to feedback/closure.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

## Known limitation

Messages and attachments are prototype-local state; there is no real case-management or messaging backend.
