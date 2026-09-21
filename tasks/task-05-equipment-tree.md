# Task 05 — Equipment tree and breadcrumbs

- **Status:** Done
- **Phase:** 1 — Equipment and knowledge
- **Dependencies:** Task 04

## Objective

Provide machine → assembly → part drill-down with breadcrumbs and part selection.

## Context

The equipment tree is the primary selection path to a quote. See `docs/requirements/solution-logic.md` sections 3.10, 3.12, and 3.16.

## Preconditions

- Task 04 equipment overview is available.
- Assembly and part records exist.
- `getEquipmentTree` and `getEquipmentBreadcrumbs` exist in `src/lib/portal-logic.ts`.

## Scope

- Expandable machine assembly tree.
- Part-level selection.
- Breadcrumb path.
- Part number visibility.
- Add-to-quote action.

## Acceptance criteria

- [x] A user can drill from machine to assembly to part.
- [x] Breadcrumbs show the active machine, assembly, and part.
- [x] A selected part exposes an add-to-quote action.
- [x] The selected machine context remains visible.

## Plan and verification result

- Implemented `src/features/equipment/machine-explorer.tsx`.
- Connected the explorer to My Equipment selection.
- Browser verified the Baffle mechanism → `210-208-1` path.
- Browser verified the button changes to `Added to quote`.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
