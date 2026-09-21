# Task 17 — Maintenance

- **Status:** Done
- **Phase:** 6 — Extended modules (post-MVP)
- **Dependencies:** Task 04, Task 05, Task 06

## Objective

Provide a maintenance view for planning and understanding equipment-related maintenance activities.

## Context

Maintenance was previously out of MVP. See the Maintenance card in `docs/requirements/solution-logic.md` and the source solution blueprint. It extends the existing equipment and document context.

## Preconditions

- The shell, account scope, and equipment context are available.
- Machine and assembly records exist in `src/data/portal-data.ts`.
- Maintenance demo records are added to the data model.

## Scope

In scope:

- Upcoming maintenance activities for account machines.
- Maintenance item detail: machine, activity, due date, status.
- Links to related documents, parts, or services.
- Overdue, upcoming, and completed states.
- Reachable from the dashboard and machine detail.

Out of scope:

- Scheduling engine or technician dispatch.
- Real maintenance integration or notifications.

## Approach and assumptions

- Add a `MaintenanceRecord` type and records to `src/data/portal-data.ts` (machine, activity, dueDate, status, relatedPartIds, relatedDocumentIds).
- Build `src/features/maintenance/maintenance.tsx` from shadcn Card, Badge, Button, and Table primitives.
- Add a `maintenance` route and move Maintenance into active navigation in `src/components/shared/portal-shell.tsx`.

## Deliverables

- `src/data/portal-data.ts` maintenance records and type.
- `src/features/maintenance/maintenance.tsx`.
- Route wiring in `src/App.tsx` and the shell.

## Acceptance criteria

- [ ] Users can view upcoming maintenance activities for a machine.
- [ ] A maintenance item shows machine, activity, due information, and status.
- [ ] Maintenance items link to related documents, parts, or services.
- [ ] Overdue and upcoming states are visually distinct with text.
- [ ] The view is reachable from navigation.

## Plan and verification result

- Added `MaintenanceRecord` and `maintenanceActivities` to `src/data/portal-data.ts`.
- Created `src/features/maintenance/maintenance.tsx`.
- Activated the Maintenance route in `src/components/shared/portal-shell.tsx`.
- Connected the route in `src/App.tsx`.
- Kept the module visibly labelled as `Extended module · post-MVP`.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

## MVP boundary

Maintenance remains an extension beyond the original MVP scope. The original requirements and logic documents were not changed to claim Maintenance is MVP.
