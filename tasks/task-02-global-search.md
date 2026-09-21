# Task 02 — Global search

- **Status:** Done
- **Phase:** 0 — Foundation
- **Dependencies:** Task 01

## Objective

Provide federated global search across machines, assemblies, parts, documents, and services.

## Context

Search is a cross-cutting capability that returns typed results and supports part-number discovery. See `docs/requirements/solution-logic.md` sections 3.7 and 3.12.

## Preconditions

- The shell and header are available.
- `getSearchResults` exists in `src/lib/portal-logic.ts`.
- Machine, assembly, part, document, and service records exist.

## Scope

- Header search input.
- Typed search results.
- Search by part number.
- Empty query and no-results states.
- Result selection behaviour.

## Deliverables

- Search behaviour in `src/components/shared/portal-shell.tsx`.

## Acceptance criteria

- [x] Searching `210-208-1` returns the Pantograph Baffle Arm.
- [x] Results show type, title, and supporting text.
- [x] The result panel opens while typing.
- [x] No-results state is shown clearly.

## Plan and verification result

- Connected the shell search input to `getSearchResults`.
- Browser verified a part-number query returns the correct typed result.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

## Known limitation

Result routing currently closes the result panel and preserves the selected query; record-specific navigation will be completed with the feature pages.
