# Task 08 — Services catalogue

- **Status:** Done
- **Phase:** 2 — Products and services
- **Dependencies:** Task 05

## Objective

Provide purchasable services that enter the same quote basket as parts.

## Scope

- Compatible service catalogue.
- Service description, price, and lead time.
- Add-service action.
- Service line item with scope instead of quantity.

## Acceptance criteria

- [x] On-site baffle mechanism inspection is displayed.
- [x] Service price and lead time are visible.
- [x] A service can be added to the shared quote basket.
- [x] Service items remain equipment-linked.

## Plan and verification result

- Used `ServiceRecord` data from `src/data/portal-data.ts`.
- Implemented service selection in `src/features/products/products-and-services.tsx`.
- Browser verified Add service interaction.
- `npx tsc --noEmit` passes.
- `npm run build` passes.