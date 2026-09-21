# Task 06 — Document centre and downloads

- **Status:** Done
- **Phase:** 1 — Equipment and knowledge
- **Dependencies:** Task 04

## Objective

Show documents at the active machine, assembly, or part level with downloadable PDFs.

## Context

Documents follow the item at every level. See `docs/requirements/solution-logic.md` section 3.13.

## Preconditions

- Task 04 equipment context is available.
- Documents declare their machine, assembly, or part level.
- PDF assets exist in `assets/documents/`.

## Scope

- Current-level document list.
- Document ID, type, status, and summary metadata.
- PDF download links.
- Empty document state.

## Acceptance criteria

- [x] Documents appear for the selected machine/assembly/part level.
- [x] A user can see the Pantograph Baffle Arm technical bulletin at part level.
- [x] A PDF download link points to the source asset.
- [x] Document status is visible and not communicated by colour alone.

## Plan and verification result

- Implemented level-aware document retrieval in `src/features/equipment/machine-explorer.tsx` using shared logic helpers.
- Connected the TNB033 PDF download path from `src/data/portal-data.ts`.
- Browser verified the document list and PDF link at part level.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
