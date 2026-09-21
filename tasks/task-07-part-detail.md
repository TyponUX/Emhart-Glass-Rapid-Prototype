# Task 07 — Part detail and compatibility

- **Status:** Done
- **Phase:** 2 — Products and services
- **Dependencies:** Task 05

## Objective

Show a part with its number, compatibility, availability, price, supersession, alternatives, and quote action.

## Scope

- Part-number search and selection.
- Compatibility status.
- Availability, lead time, and price.
- Superseded-part replacement warning.
- Compatible alternatives.
- Add-to-quote action.

## Acceptance criteria

- [x] Part `210-208-1` can be selected.
- [x] Compatibility is displayed.
- [x] Availability, lead time, and price are displayed.
- [x] Alternatives and replacement relationships are supported by the data and UI logic.
- [x] A compatible part can be added to the quote basket.

## Plan and verification result

- Implemented in `src/features/products/products-and-services.tsx` using `src/lib/portal-logic.ts`.
- Connected to the Products & Services route.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- Browser verified part selection and Add to quote interaction.