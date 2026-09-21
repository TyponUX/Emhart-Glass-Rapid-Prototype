# Task 14 — Dashboard

- **Status:** Done
- **Phase:** 5 — Dashboard and quality
- **Dependencies:** Task 04, Task 11, Task 13, Task 03

## Objective

Provide a personalised overview that projects equipment, transaction, support, notification, and outstanding-action data.

## Scope

- Equipment count
- Active order count
- Open actions
- Unread notification count
- Outstanding actions
- Recent activity
- Quick links to equipment, products, quotes, and support

## Acceptance criteria

- [x] Dashboard reflects current account scope.
- [x] Equipment, orders, actions, and notifications are summarised.
- [x] Outstanding actions are visible.
- [x] Quick-access actions navigate to the owning domains.
- [x] Dashboard owns no duplicate records.

## Plan and verification result

- Implemented `src/features/dashboard/dashboard.tsx`.
- Connected the dashboard to the default portal route.
- Dashboard reads existing machines, orders, requests, and notifications.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
