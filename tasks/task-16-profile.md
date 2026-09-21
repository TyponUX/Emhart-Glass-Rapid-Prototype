# Task 16 — My Profile

- **Status:** Done
- **Phase:** 5 — Dashboard and quality
- **Dependencies:** Task 01

## Objective

Provide profile and preference settings with user, company, role, and notification context.

## Scope

- User details
- Company and account details
- Role/persona selector
- Language preference
- Timezone preference
- Save confirmation state
- Notification categories

## Acceptance criteria

- [x] Profile shows user and company details.
- [x] The current role can be changed from the profile.
- [x] Language and timezone preferences are represented.
- [x] Save preferences has a confirmation state.
- [x] Notification categories are visible.

## Plan and verification result

- Implemented `src/features/profile/profile.tsx`.
- Connected it to the My Profile route.
- Reused shadcn Select, Input, Button, Badge, and Card components.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

## Known limitation

Preferences are prototype-local state and are not persisted to a backend.
