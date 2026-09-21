# Task 10 — Shared record workspace

- **Status:** Done
- **Phase:** 3 — Transaction
- **Dependencies:** Task 01

## Objective

Build one reusable record workspace pattern for quotes, orders, and support records.

## Scope

- Overview/title and status
- Details
- Metadata
- History timeline
- Next action
- Related transaction content

## Acceptance criteria

- [x] The workspace renders a record status and title.
- [x] Metadata, history, and next action are visible.
- [x] The pattern is reusable by Quote & Order and later Support.

## Plan and verification result

- Implemented `src/components/shared/record-workspace.tsx`.
- Added reusable status, metadata, history, and next-action layout.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

## Known limitation

Support-specific fields will be connected when Tasks 12–13 are implemented.
