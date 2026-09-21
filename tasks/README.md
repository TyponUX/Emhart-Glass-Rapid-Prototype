# Prototype Tasks

Implementation tasks for the Emhart Glass service-portal prototype. Each task maps to the logic in `docs/requirements/solution-logic.md`.

## Task structure

1. Task number and title
2. Status
3. Phase
4. Dependencies
5. Objective
6. Context (with references)
7. Preconditions
8. Scope (in scope and out of scope)
9. Approach and assumptions
10. Deliverables
11. Acceptance criteria (checkbox items)
12. Plan and verification result

Status values: `Not started`, `Planned`, `In progress`, `Done`.

## Phases and tasks

### Phase 0 — Foundation
- [Task 01 — Application shell and layout](task-01-app-shell.md) — Done
- [Task 02 — Global search](task-02-global-search.md) — Done
- [Task 03 — Notifications](task-03-notifications.md) — Done

### Phase 1 — Equipment and knowledge
- [Task 04 — My Equipment overview](task-04-my-equipment.md) — Done
- [Task 05 — Equipment tree and breadcrumbs](task-05-equipment-tree.md) — Done
- [Task 06 — Document centre and downloads](task-06-documents.md) — Done

### Phase 2 — Products and services
- [Task 07 — Part detail and compatibility](task-07-part-detail.md) — Done
- [Task 08 — Services catalogue](task-08-services.md) — Done
- [Task 09 — Cart and quote basket](task-09-cart.md) — Done

### Phase 3 — Transaction
- [Task 10 — Shared record workspace](task-10-record-workspace.md) — Done
- [Task 11 — Quote and order flow](task-11-quote-order.md) — In progress

### Phase 4 — Support
- [Task 12 — Support requests overview](task-12-support-overview.md) — Done
- [Task 13 — Support chat thread](task-13-support-chat.md) — Done

### Phase 5 — Dashboard and quality
- [Task 14 — Dashboard](task-14-dashboard.md) — Done
- [Task 15 — Interaction states and accessibility](task-15-interaction-quality.md) — Done
- [Task 16 — My Profile](task-16-profile.md) — Done

### Phase 6 — Extended modules (post-MVP)
- [Task 17 — Maintenance](task-17-maintenance.md) — Not started
- [Task 18 — Training](task-18-training.md) — Not started
- [Task 19 — User Management](task-19-user-management.md) — Not started
- [Task 20 — Reporting](task-20-reporting.md) — Not started

### Phase 3 — Critical journey integration
- [Task 21 — Critical Journey 1: Equipment to quote to order to shipment tracking](task-21-journey-1-quote-to-shipment.md) — Planned

### Phase 4 — Critical journey integration
- [Task 23 — Critical Journey 2: Support request to resolution](task-23-journey-2-support-resolution.md) — Done

## Phase 6 implementation plan

These four modules were previously out of MVP scope. Adding them requires the same shared integration steps for each:

1. **Data:** add prototype records to `src/data/portal-data.ts` (maintenance activities, training offerings, managed users, report metrics).
2. **Logic:** add any reusable filters or derived values to `src/lib/portal-logic.ts` when a rule is shared.
3. **Feature view:** create `src/features/<module>/` and build the page from shadcn components.
4. **Shell route:** add the route to `PortalRoute`, move the item from `disabledNavigation` to `primaryNavigation` (or a secondary group) in `src/components/shared/portal-shell.tsx`, and render it in `src/App.tsx`.
5. **Validation:** run `npx tsc --noEmit`, `npm run build`, and a browser check.

Recommended order: Maintenance, then Training, then User Management, then Reporting. Maintenance and Training extend the existing equipment/account context; User Management and Reporting are more standalone.

## Scope note

Adding these modules changes the MVP boundary defined in `docs/requirements/prototype-requirements.md` and `docs/requirements/solution-logic.md`. Update those documents' exclusion lists when the modules are accepted as in scope.
