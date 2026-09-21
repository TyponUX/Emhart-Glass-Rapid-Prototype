# Task 18 — Training

- **Status:** Done
- **Phase:** 6 — Extended modules (post-MVP)
- **Dependencies:** Task 04

## Objective

Provide a view for discovering training offerings related to equipment and service work.

## Context

Training was previously out of MVP. See the Training card in `docs/requirements/solution-logic.md`. The Mia persona (`docs/personas/mia-training-coordinator.md`) is the primary audience.

## Preconditions

- The shell and equipment context are available.
- Training demo offerings are added to the data model.
- Shared card and detail components are available.

## Scope

In scope:

- Training offering catalogue.
- Training detail: purpose, audience, equipment relevance, request information.
- Equipment relevance linkage.
- Simulated training request action.
- Empty and unavailable states.

Out of scope:

- External learning platform integration, enrolment, payment.
- Skill-management backend.

## Approach and assumptions

- Add a `TrainingRecord` type and records to `src/data/portal-data.ts` (title, audience, description, compatibleMachineIds, format).
- Build `src/features/training/training.tsx` from shadcn components.
- Clearly mark marketing content as distinct from implemented prototype flows.
- Add a `training` route and active navigation entry.

## Deliverables

- `src/data/portal-data.ts` training records and type.
- `src/features/training/training.tsx`.
- Route wiring in `src/App.tsx` and the shell.

## Acceptance criteria

- [ ] Users can browse relevant training offerings.
- [ ] A training detail shows purpose, audience, and equipment relevance.
- [ ] Users can reach a simulated training request action.
- [ ] Marketing content is distinguished from implemented flows.
- [ ] Empty and unavailable states are understandable.

## Plan and verification result

- Added `TrainingRecord` and `trainingOfferings` to `src/data/portal-data.ts`.
- Created `src/features/training/training.tsx`.
- Activated the Training route in `src/components/shared/portal-shell.tsx`.
- Connected the route in `src/App.tsx`.
- Added simulated request confirmation and an unavailable catalogue state.
- Kept the module visibly labelled as `Extended module · post-MVP`.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

## MVP boundary

Training remains an extension beyond the original MVP scope. External learning-platform integration, enrolment, and payment are not implemented.
