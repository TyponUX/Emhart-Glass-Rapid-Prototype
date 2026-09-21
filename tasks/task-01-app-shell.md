# Task 01 — Application shell and layout

- **Status:** Done
- **Phase:** 0 — Foundation
- **Dependencies:** None

## Objective

Create the application shell: sidebar navigation, header, and role/account context.

## Context

The shell wraps every page and holds the current user, role, and account scope. See `docs/requirements/solution-logic.md` sections 2.2, 2.3, 3.1, 3.15, and 3.16.

## Preconditions

- Vite, React, TypeScript, Tailwind, and shadcn/ui are set up and building.
- `src/data/portal-data.ts` provides users, accounts, and roles.

## Scope

In scope:

- Sidebar navigation for MVP modules.
- Disabled navigation entries for out-of-scope modules.
- Account and role selectors.
- Placeholder routes.
- Preserved component inventory route.

Out of scope:

- Real authentication.
- Feature page content beyond placeholders.

## Deliverables

- `src/components/shared/portal-shell.tsx`
- `src/App.tsx`

## Acceptance criteria

- [x] The shell renders on every route.
- [x] Switching account changes the active account context.
- [x] Switching role changes the selected persona context.
- [x] Out-of-scope modules are visibly disabled.

## Plan and verification result

- Implemented the shell with shadcn Buttons, Select controls, Lucide icons, and existing tokens.
- Added global search and notification controls to the shared header.
- Browser verified desktop navigation and placeholder route changes.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

## Known limitation

Only one account fixture exists, and role-specific action visibility will become meaningful when feature actions are implemented.
