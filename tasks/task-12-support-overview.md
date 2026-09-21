# Task 12 — Support requests overview

- **Status:** Done
- **Phase:** 4 — Support
- **Dependencies:** Task 10

## Objective

Provide an overview of equipment-linked support requests with independent statuses and next actions.

## Scope

- Request list
- Request number and subject
- Equipment/site context
- Priority
- Status
- Last activity
- Create support request affordance

## Acceptance criteria

- [x] Existing support request appears with status and metadata.
- [x] The request is linked to the machine and site.
- [x] Multiple request-ready structure is supported.
- [x] Create support request action is available.

## Plan and verification result

- Implemented the support overview in `src/features/support/support-center.tsx`.
- Connected it to the Support & Communication route.
- Browser verified SR-2048 appears with machine/site context and status.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
