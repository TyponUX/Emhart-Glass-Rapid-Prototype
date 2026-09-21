# Task 03 — Notifications

- **Status:** Done
- **Phase:** 0 — Foundation
- **Dependencies:** Task 01

## Objective

Provide a shared notification list with typed statuses and read/unread behaviour.

## Context

Notifications aggregate from domain records and deep-link to related work. See `docs/requirements/solution-logic.md` sections 3.6 and 3.11 and `docs/design-guidelines/interaction-rules.md`.

## Preconditions

- The shell and header are available.
- Notification records exist in `src/data/portal-data.ts`.
- The shared status model is defined.

## Scope

- Notification button and unread count.
- Notification panel.
- Status, message, and read/unread state.
- Marking notifications read.

## Deliverables

- Notification behaviour in `src/components/shared/portal-shell.tsx`.

## Acceptance criteria

- [x] Notifications show title, message, and read state.
- [x] The unread count is visible before reading.
- [x] Clicking a notification changes it to read.
- [x] The panel displays an explicit empty/unread count state.

## Plan and verification result

- Connected the header notification control to the existing notification records.
- Added local read-state tracking for the prototype session.
- Browser verified unread count changes from `1 unread` to `0 unread` after opening the quote notification.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

## Known limitation

Notification deep links will connect to real quote, order, and support views when those feature tasks are implemented.
