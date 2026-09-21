# Task 09 — Cart and quote basket

- **Status:** Done
- **Phase:** 2 — Products and services
- **Dependencies:** Task 07, Task 08

## Objective

Provide one quote basket for parts and services with subtotal and submission readiness.

## Scope

- Mixed part and service line items.
- Equipment context on added items.
- Subtotal calculation.
- Empty basket state.
- Compatibility readiness and next action.
- RFQ submission affordance.

## Acceptance criteria

- [x] The basket contains both part and service item types.
- [x] The basket shows item count and estimated subtotal.
- [x] The basket provides the next action text.
- [x] RFQ submission is disabled when items are invalid or unavailable.
- [x] Existing demo cart items are preserved as prototype fixtures.

## Plan and verification result

- Used `CartRecord`, `LineItem`, `getCartSubtotal`, `canSubmitCart`, and `getCartNextAction`.
- Implemented the basket in `src/features/products/products-and-services.tsx`.
- Browser verified the mixed basket after adding a part and service; the fixture starts with two demo items, so the count becomes four.
- `npx tsc --noEmit` passes.
- `npm run build` passes.