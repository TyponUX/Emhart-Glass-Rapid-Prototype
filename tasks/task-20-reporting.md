# Task 20 — Reporting

- **Status:** Done
- **Phase:** 6 — Extended modules (post-MVP)
- **Dependencies:** Task 04, Task 11, Task 13

## Objective

Provide reporting views that give customers transparency into equipment, orders, service, and platform activity.

## Context

Reporting was previously out of MVP. See the Reporting card in `docs/requirements/solution-logic.md`. It projects data from other domains.

## Preconditions

- The shell and account scope are available.
- Equipment, order, and support records exist.
- Report metric definitions and the MVP report set are agreed.

## Scope

In scope:

- Representative equipment, order, service, and support metrics.
- Labels, units, date ranges, and source-state context.
- Agreed prototype filters.
- Simulated export or scheduled-report state.
- Empty, unavailable, and no-result states.

Out of scope:

- Live analytics pipeline or scheduled delivery service.
- Custom report builder or production export.

## Approach and assumptions

- Derive metrics from existing machines, orders, requests, and notifications; add a small `reportMetrics` fixture only where derived values are insufficient.
- Build `src/features/reporting/reporting.tsx` from shadcn Card, Badge, and Table primitives.
- Mark simulated export and scheduling clearly as prototype behaviour.
- Add a `reporting` route and active navigation entry.

## Deliverables

- Optional report fixtures in `src/data/portal-data.ts`.
- `src/features/reporting/reporting.tsx`.
- Route wiring in `src/App.tsx` and the shell.

## Acceptance criteria

- [ ] Users can view representative equipment, order, service, or support metrics.
- [ ] Reports show labels, units, date ranges, and source-state context.
- [ ] Users can apply the agreed prototype filters.
- [ ] A simulated export or scheduled-report state is clearly marked as prototype behaviour.
- [ ] Empty, unavailable, and no-result states are understandable.

## Plan and verification result

- Created `src/features/reporting/reporting.tsx`.
- Derived equipment, support, order, and notification metrics from existing account records.
- Added a prototype date-range filter and simulated export state.
- Activated the Reporting route in `src/components/shared/portal-shell.tsx`.
- Connected the route in `src/App.tsx`.
- Kept the module visibly labelled as `Extended module · post-MVP`.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

## MVP boundary

Reporting remains an extension beyond the original MVP scope. Live analytics, scheduled delivery, and custom report building are not implemented.
