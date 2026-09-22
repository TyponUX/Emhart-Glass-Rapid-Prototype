# Task 25 — Repair Projects

- **Status:** To do
- **Phase:** 7 — Connected journeys
- **Dependencies:** Task 09 (Cart), Task 11 (Quote/Order), Task 12/13 (Support), Task 21 (Quote-to-shipment journey), Task 23 (Support resolution journey)

## Objective

Introduce a **Projects** area where a customer manages **Repair Projects**. A Repair Project is the umbrella that connects everything needed to complete a repair: collected parts, documents and services; one or more orders; and any assisted-service support requests. Instead of starting from a basket, the customer starts from a project and collects items into it over time.

## Navigation

- Add a new **Projects** entry in the sidebar, positioned **between Training and Maintenance**.
- Add a `projects` route in `PortalRoute` and wire it in `src/App.tsx` and `src/components/shared/portal-shell.tsx`.

## Core concept

A Repair Project owns a single running **required-items list**. When the user triggers an order, the selected items are moved into a project-level **Package**. A Package behaves like a subfolder inside the project and groups the selected items through quote, order, and shipment tracking. This keeps one clear project list while making each purchase batch understandable.

The page should support two entry paths:

- **Create a project** from scratch.
- **Start from a Repair Kit template**, then adapt it before ordering.

Repair Kit templates are preconfigured project starters, not fixed orders. The user reviews the included items, removes anything unnecessary, changes quantities, adds notes or additional items, and only then creates an order batch.

## 1. Project record

Each project contains:

- Project name / reference
- Customer (account) and machine / equipment
- Repair issue or reason
- Project status
- Responsible person
- Target / expected completion date
- Related requests, orders, and shipments (linked, not duplicated)

## 2. Collecting items into a project

- A part, document, or service can be added to a project at **any time** — the customer does not need to know everything upfront.
- When adding an item, the user always gets a choice: **Add to project** or **Add to cart**.
- If **no project is active/open**, the item goes **directly into the cart** (today's behavior is preserved).
- Each project item shows:
  - Part number / name
  - Quantity
  - Availability
  - Price
  - Order status (`Planned → Ready to order → Ordered → Delivered`)
  - Related basket/order
  - Optional notes

## 2a. Default Repair Kits

Offer one or two curated default Repair Kits alongside the **Create project** action. The initial prototype should include two examples:

### Pantograph baffle repair kit

- Compatible machine context: IS Machine EF 5 1/2
- Suggested parts: Pantograph Baffle Arm, mounting parts set
- Suggested documents: Pantograph Baffle Arm bulletin, Pantograph Baffle Troubleshooting Guide
- Suggested service: on-site baffle mechanism inspection
- Suggested support action: request a Service Engineer review

### Gob distribution service kit

- Compatible machine context: Servo Gob Distributor / FlexGob
- Suggested parts: Servo gob scoop, feeder timing valve
- Suggested documents: relevant machine and feeder documentation
- Suggested service: gob distribution inspection or service support
- Suggested support action: request an engineer for diagnosis and recommissioning

Kit behavior:

- Selecting a kit opens a reviewable draft project; it must not immediately create a basket or order.
- Every suggested item has an individual checkbox or selection control.
- Users can remove suggestions, adjust quantities, add optional notes, and add other catalogue items before ordering.
- Documents and engineer services can be selected independently from parts; the user does not have to order the complete kit.
- The project header should identify the source template, for example `Started from: Pantograph baffle repair kit`.
- Once the user confirms the selected items, they become normal project items and follow the same `Planned → Ready to order → Ordered → Delivered` lifecycle.

## 3. Packages and multiple purchases under one project

A repair may need several separate purchases:

`Repair Project → Package 1 → Quote/Order/Shipment`

`Repair Project → Package 2 → Quote/Order/Shipment`

`Repair Project → Package 3 → Quote/Order/Shipment`

To avoid ending up with many confusing baskets:

- **Single project item list.** Items remain in the project until an order is triggered, with a per-item status.
- **Package creation on order.** The user selects ready items and presses **"Create package and order"**. The system creates a named **Package** (e.g. `Baffle repair · Package 1`) inside the project and moves the selected items into it.
- **Package contents.** The Package shows the selected items, quantities, notes, readiness, quote, order, and shipment status in one expandable subfolder-like area.
- **Package-level traceability.** Each Package is linked to exactly one quote/order flow, while the project remains the umbrella for multiple Packages.
- **Active-project context banner.** A persistent indicator in the shell shows which project the user is currently working in, so every add-to action has a clear target.
- **Group-by-readiness helper (optional).** The project can suggest which ready items should form the next Package, so a slow part never blocks a quick shipment.

The project acts as the umbrella connecting all resulting orders and shipments.

## 4. Self-service ↔ assisted service

Not every repair can be completed by the customer. From a project, the customer can:

- Request help from a Service Engineer
- Explain what support is needed
- Share the relevant machine, parts, and documents (pre-filled from the project)
- See the status of the support request
- Communicate with the assigned engineer

Reuse the existing `SupportProvider`: a project spawns a support request seeded with its machine/parts/documents and displays that request's status and messages inline. The project can switch between self-service and assisted service without leaving the project.

## 5. Project timeline / status

A simple, fixed step model so the customer understands where the repair is:

`Identify issue → Select parts → Order parts → Parts delivered → Service support → Repair → Reinstall → Completed`

- Each step aggregates the project's linked tasks, documents, orders, and support requests.
- When a ready-to-order package is ordered, those items move into an order the user can track (via the existing shipment milestones), and the project timeline advances accordingly.

## Approach and assumptions

- Add a `ProjectRecord` type and a `ProjectPackage` type. A `ProjectProvider` (or extension of `TransactionProvider`) holds projects, ungrouped required items, Packages, and links to quotes/orders/support requests.
- Add an "active project" concept in shared context, surfaced via an active-project banner/selector in the shell.
- Create a Package transactionally when an order is triggered: move selected items from the project list into the Package, then link the Package to the resulting quote, order, and shipment.
- Add static `RepairKitTemplate` records with suggested parts, documents, services, machine context, and support guidance.
- Present kit templates as editable project starters; never treat a kit as an inseparable order bundle.
- Extend add-to actions (equipment, catalogue, services) to offer **Add to project / Add to cart**, defaulting to cart when no project is active.
- Reuse existing `LineItem`, cart → quote → order flow, and `SupportProvider` rather than duplicating logic.
- Build `src/features/projects/projects.tsx` and supporting components from existing shadcn/ui primitives and shared cards.
- Keep all data as static prototype state; no backend.

## Deliverables

- `projects` route wired in `src/App.tsx` and `src/components/shared/portal-shell.tsx` (between Training and Maintenance).
- `ProjectRecord` type and project state/context.
- `src/features/projects/projects.tsx` project list and project detail.
- Two default Repair Kit starter cards with editable item selection.
- Active-project context banner and Add-to-project/Add-to-cart choice on item actions.
- Project Packages displayed as expandable subfolders with their item contents and commercial status.
- Project timeline component.

## Acceptance criteria

- [ ] A Projects entry appears between Training and Maintenance in the sidebar.
- [ ] Users can create a Repair Project with name, machine, issue, status, responsible person, and target date.
- [ ] Users can add parts, documents, and services to a project at any time.
- [ ] Users can start from one of the default Repair Kits or create a project from scratch.
- [ ] A Repair Kit opens as an editable draft and does not create an order automatically.
- [ ] Users can select only the kit items they need, change quantities, add notes, and add additional items.
- [ ] Kit parts, documents, services, and engineer support can be selected independently.
- [ ] Adding an item offers Add to project or Add to cart; with no active project, it goes to the cart.
- [ ] A project shows its collected items with quantity, availability, price, order status, related order, and notes.
- [ ] Triggering an order creates a named Package inside the project.
- [ ] Selected items move from the ungrouped project list into the new Package.
- [ ] Packages behave like expandable subfolders and show their item contents.
- [ ] Each Package links to its quote, order, and shipment status.
- [ ] Users can create multiple Packages under one project without losing traceability.
- [ ] An active-project banner shows which project the user is currently working in.
- [ ] A project can raise a support request pre-filled with its machine, parts, and documents, and show its status and messages.
- [ ] A project timeline shows the fixed repair steps and reflects linked orders and support requests.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes.

## Open design decisions (recommended defaults)

- **Basket sprawl:** single project item list + on-demand Packages created at order time, rather than one-basket-per-project or free-floating baskets.
- **Package model:** selected items move into a Package when ordering starts; the Package becomes the traceable subfolder for that purchase.
- **Routing choice:** global active-project selector with per-item Add-to-project/Add-to-cart choice; cart is the fallback.
- **Assisted service:** reuse `SupportProvider`; do not build a parallel support system.
- **Default kits:** provide two curated editable starters, not fixed packages or automatic orders.
- **Kit-to-order flow:** `Repair Kit → Draft Project → Select items → Create Package → Quote/Order/Shipment`.

## MVP boundary

Repair Projects are a connected-journey extension. Batching, timeline, and assisted-service switching are simulated in prototype state. No backend, real ordering, payment, or engineer scheduling is implemented.
