# Task 19 — User Management

- **Status:** Done
- **Phase:** 6 — Extended modules (post-MVP)
- **Dependencies:** Task 01

## Objective

Provide an administration view for managing customer users, roles, and permissions.

## Context

User Management was previously out of MVP. See the User Management card in `docs/requirements/solution-logic.md`. It reuses the existing user and role model.

## Preconditions

- The shell and account scope are available.
- Users, roles, and permissions exist in `src/data/portal-data.ts`.
- The prototype's authorization assumptions are documented.

## Scope

In scope:

- Customer user list.
- Invite, activate, deactivate, and delete states.
- Role and permission display.
- Confirmation, validation, and error states.
- Distinction between administration and self-service profile actions.

Out of scope:

- Real account provisioning or identity integration.
- Production permission enforcement.

## Approach and assumptions

- Extend `UserRecord` where needed (status: active/invited/deactivated).
- Build `src/features/user-management/user-management.tsx` from shadcn Table, Badge, Button, and Dialog-like patterns.
- Gate the module behind an admin-capable role for demonstration.
- Add a `user-management` route and active navigation entry.

## Deliverables

- `src/data/portal-data.ts` user status additions.
- `src/features/user-management/user-management.tsx`.
- Route wiring in `src/App.tsx` and the shell.

## Acceptance criteria

- [ ] An authorised demo user can view the customer user list.
- [ ] Invite, activate, deactivate, and delete states are represented.
- [ ] Roles and permissions are visible.
- [ ] User actions have confirmation, validation, and error states.
- [ ] Administration is distinct from self-service profile actions.

## Plan and verification result

- Added `UserStatus` to the existing user model.
- Created `src/features/user-management/user-management.tsx`.
- Activated the User Management route in `src/components/shared/portal-shell.tsx`.
- Connected the route in `src/App.tsx`.
- Gated the view behind the `Procurement and admin` demonstration role.
- Added local invite, activate, deactivate, and delete display states.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

## MVP boundary

User Management remains an extension beyond the original MVP scope. Identity provisioning and production permission enforcement are not implemented.
