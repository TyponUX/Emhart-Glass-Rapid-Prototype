# Task 04 — My Equipment overview

- **Status:** Done
- **Phase:** 1 — Equipment and knowledge
- **Dependencies:** Task 01

## Objective

Show account-scoped machines with searchable identity and configuration information.

## Context

My Equipment is the anchor domain for the equipment tree, documents, parts, and support work. See `docs/requirements/solution-logic.md` sections 3.1 and 3.10.

## Preconditions

- Task 01 shell and account context are available.
- Machine records and image assets exist.
- `getScopedMachines` exists in `src/lib/portal-logic.ts`.

## Scope

- Machine overview cards.
- Search by name, model, serial number, or site.
- Machine metadata and configuration.
- Navigation into a selected machine.
- Empty-state recovery.

## Acceptance criteria

- [x] Account machines are displayed with image, model, serial number, site, and configuration.
- [x] Search filters the machine cards.
- [x] Each machine opens its machine explorer.
- [x] Empty results provide a clear reset action.

## Plan and verification result

- Implemented `src/features/equipment/machine-overview.tsx`.
- Connected the My Equipment route in `src/App.tsx`.
- Browser verified machine cards and search-ready overview.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
