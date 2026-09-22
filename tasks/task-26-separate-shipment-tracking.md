# Task 26 — Separate Shipment Tracking

- **Status:** To do
- **Phase:** 7 — Connected journeys
- **Dependencies:** Task 11 (Quote/order workflow), Task 21 (quote-to-shipment journey), Task 25 (Repair Projects)

## Objective

Separate commercial order processing from physical shipment tracking in the Quotes & Orders area. Add a dedicated **Shipment** tab immediately to the left of **Orders**, while keeping the same repeated item-level status pattern used in Packages and Orders.

## Recommended information architecture

The commercial navigation becomes:

`Cart → Quotes → Orders → Shipment`

- **Quotes**: commercial approval stage before an order exists.
- **Orders**: the customer’s confirmed purchase commitments and order-level status.
- **Shipment**: physical fulfilment and delivery tracking after an order has been placed.

The existing Orders tab remains the primary place for the order record and commercial order status. Shipment becomes the dedicated place for delivery progress.

## 1. Orders tab responsibilities

Orders should show order-level commercial status only:

- **Order received** — the customer’s order has been registered.
- **Order confirmed** — the purchase has been accepted.
- **Preparing order** — items are being prepared or produced.
- **Order in progress** — the order remains active.
- **Order complete** — all order work is complete.

The Orders detail view should continue to list every order item individually. Each item must show its own current order status, while the order header shows the overall order status.

## 2. Shipment tab responsibilities

The new Shipment tab should show orders that have moved into physical fulfilment. It should list:

- Shipment reference
- Related order number
- Package/project name when available
- Destination/site
- Current shipment status
- Expected delivery information

Shipment statuses should follow the existing milestone model:

`Order confirmed → Preparing order → Ready to ship → Shipped → Out for delivery → Delivered → Received`

The shipment detail should show each order item individually, matching the Package and Order UI pattern. Every item gets its own shipment status chip, because items can ship separately or become available at different times.

## 3. Repeated item-level pattern

The same hierarchy should be used consistently:

```text
Package
  └── items with Package status
Order
  └── items with Order status
Shipment
  └── items with Shipment status
```

Before an order is approved, the Package controls item selection and package status. After quote approval, the resulting Order controls commercial status. Once fulfilment begins, the Shipment tab controls delivery status.

Item rows should retain:

- Part/service name or reference
- Quantity
- Availability or fulfilment state
- Current status chip
- Related package/order/shipment reference

## 4. Navigation and interaction

- Add a **Shipment** tab immediately after **Orders** in Quotes & Orders.
- Selecting an Order should show its order items and order status.
- Selecting a Shipment should show the same underlying items with shipment-specific status.
- The Package arrow should open **Quotes** before approval, **Orders** after approval, and **Shipment** once the order has entered shipment tracking.
- The current shipment milestone controls may remain simulated in prototype state, but the user should understand the difference between order progress and delivery progress.

## 5. State model

Extend the shared transaction model without duplicating item data:

- Keep one source of truth for order items.
- Add shipment-level selection or derived shipment records linked by `orderId`.
- Preserve existing shipment milestones and advance/receipt actions.
- Derive the Shipment tab from orders that have reached a fulfilment milestone, or expose a linked shipment record when the order is ready to ship.
- Keep package/order/shipment references connected so navigation never loses context.

## Acceptance criteria

- [ ] A Shipment tab appears immediately to the left of Orders.
- [ ] Orders show order-level status and individual order-item status chips.
- [ ] Shipment shows shipment-level status and individual shipment-item status chips.
- [ ] Orders and Shipment use distinct status vocabularies appropriate to their stage.
- [ ] Shipment uses the milestone flow: confirmed, preparing, ready to ship, shipped, out for delivery, delivered, received.
- [ ] Package, Order, and Shipment repeat the same item-level information pattern.
- [ ] The Package arrow routes to Quotes before approval, Orders after approval, and Shipment once fulfilment begins.
- [ ] Existing shipment advance and receipt interactions continue to work.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes.

## Open design decisions

- **Shipment creation:** derive shipments from Orders initially; introduce a separate `ShipmentEntry` only when multiple shipments per order are needed.
- **Partial shipment:** allow item-level status divergence without changing the parent order status prematurely.
- **Package relation:** retain the Package name as a visible reference on both Orders and Shipment.

## MVP boundary

Shipment tracking remains simulated prototype state. No carrier API, live tracking number lookup, warehouse integration, or real delivery event feed is implemented.
