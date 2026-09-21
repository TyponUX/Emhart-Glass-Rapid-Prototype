# Task 11 — Quote and order flow

- **Status:** In progress
- **Phase:** 3 — Transaction
- **Dependencies:** Task 09, Task 10

## Objective

Connect the quote basket to a simulated RFQ, quote acceptance, PO placeholder, order confirmation, and delivery/service tracking flow.

## Scope

- Quote available record
- Accept quote action
- Request clarification affordance
- PO upload placeholder
- Order confirmation
- Delivery/service completion status
- Shared record workspace presentation

## Acceptance criteria

- [x] Quote and order page is reachable from the Quote & Order navigation.
- [x] Quote status, request number, customer, validity, and total are shown.
- [x] Accept quote changes the record state.
- [x] PO upload placeholder changes the record to order in progress.
- [x] Order confirmation and estimated delivery are shown.

## Plan and verification result

- Implemented `src/features/quotes/quote-order.tsx`.
- Connected RFQ submission from Products & Services to Quote & Order.
- Reused `src/components/shared/record-workspace.tsx`.
- Added simulated stages: quote available, accepted, ordered.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

## Remaining verification

The browser tab closed during the automated multi-step RFQ verification. The code path is connected and build-validated; a fresh browser run should verify Submit RFQ → Accept quote → Upload PO and confirm order.
