# Solution Logic

**Status:** Working logic model
**Source:** Solution View blueprint (page cards), UX strategy, user journey, and prototype requirements.
**Purpose:** Capture what each page must contain and, more importantly, the underlying logic patterns that connect the pages so the prototype behaves as one coherent system.

## 1. How to read this document

- **Page logic** (section 2) records each page's purpose and the information it must hold, taken from the solution cards.
- **Derived logic** (section 3) defines the cross-cutting patterns that emerge when the pages are looked at together. These patterns are the reusable rules the prototype should follow.
- **Data relationships** (section 4) define how records connect.
- **Mapping** (section 5) links pages to feature folders and shared behaviour.

MVP status legend: **In** = build now, **Partial** = represent with placeholders, **Out** = navigation only or hidden.

## 2. Page logic

### Dashboard — In

**Purpose:** A personalised overview of relevant activity, recommendations, and outstanding actions.

Must contain:

- Equipment overview
- Order and request summary
- Recent support activity
- Notifications and updates
- Recommended or outstanding actions
- Quick access to key functions

**Logic role:** Read-only projection. Owns no data; aggregates from equipment, quotes, orders, support, and notifications.

### My Equipment — In

**Purpose:** A central place for all equipment information and lifecycle documents.

Must contain:

- Installed-base overview
- Machine details
- Installed equipment tree
- Metadata search
- Document centre
- Full-text (AI-enriched) search representation
- Documents: manuals, technical documentation, drawings, COFS, FAT, acceptance documents, pictures, videos, maintenance guidelines, SOPs
- Document-specific notifications

**Logic role:** The anchor domain. Provides the equipment context that every other domain filters and pre-fills from. The installed equipment tree is a primary selection path: a user drills down machine to mechanism/assembly to part, and can add a selected part directly to a quotation from any level of the tree.

### Products and Services — In

**Purpose:** Enable customers to discover products and services relevant to their equipment and business needs.

Must contain:

- Spare-parts catalogue
- Search by machine and part number
- Compatibility information
- BOM navigation
- Part details, metadata, and images
- Part-number history
- Pricing and lead-time information
- Availability information
- Where-used information
- Shopping cart or quote basket
- RFQ submission
- Product and service recommendations
- Service offerings that can be purchased (In)
- Training offerings and requests (Out)

**Logic role:** Discovery and selection. Produces the line items that flow into Quote & Order. Both spare parts and purchasable services are added to the same quote basket and follow the same quotation, order, checkout, and delivery process.

**Note on service requests:** Requesting *help* is a support request and belongs to Support & Communication. Buying a *service* (for example an inspection or on-site service) is a purchasable line item and follows the parts pipeline. The two are kept distinct.

### Quote and Order — In

**Purpose:** Support procurement through a consistent request and ordering workflow.

Must contain:

- Quote and order overview
- Details and metadata
- Submit RFQ
- View sales quotation
- Upload purchase order
- Status tracking
- History
- Shipment documents: Bill of Lading, Loading List, Packing List, Air Waybill, POD (Partial: placeholder links)
- Order-specific notifications
- View contract (Out)
- View invoice (Out)

**Logic role:** The transaction spine. Turns selected parts into a tracked commercial record.

### Support and Communication — In

**Purpose:** A structured way to interact with BEG and request assistance.

Must contain:

- Contact directory
- Support-request overview
- Create support request
- Equipment-linked requests
- Categorisation (for example General, Technical)
- Support-request details
- Status tracking
- History
- Metadata (date, requester, subject)
- Provide feedback
- Support-specific notifications
- Read/unread states

**Logic role:** Structured issue handling. Preserves context from equipment, documents, and parts when an issue is escalated.

### My Profile — In

**Purpose:** Manage personal settings, preferences, and access information.

Must contain:

- User details
- Company details
- Change password (Partial)
- Language, date/number format, timezone preferences
- Notification settings
- Views into document updates, support requests, quotes, and orders

**Logic role:** Per-user settings and personal cross-links into other domains.

### Maintenance — Out

Installed-base overview, maintenance plans and schedules, upcoming activities, recommended kits, required parts, guidelines, and SOPs. Represent as disabled navigation.

### User Management — Out

User overview, self-service create, invitation, activation, role and permission assignment. Represent as disabled navigation.

### Training — Out

Marketing content, training service request, news stream, WBT link, skill management. Represent as disabled navigation.

### Reporting — Out

Operational dashboards, equipment KPIs, order analytics, service reports, ticket statistics, usage metrics, filters, export, scheduled reports. Represent as disabled navigation.

### Cross-platform — In

- Global search
- Notifications
- Account selector

**Logic role:** The application shell that wraps every page.

## 3. Derived logic (the best logic patterns)

These patterns come from comparing the pages, not from any single card. They are the reusable rules that keep the prototype coherent.

### 3.1 Equipment is the anchor context

Every domain ties back to equipment: My Equipment owns it, Products & Services filters parts by it, Support links requests to it, Dashboard summarises it.

Rule:

- The app holds a current equipment context (or "all equipment").
- When a machine is selected, part search, compatibility, documents, support requests, and quote items pre-filter and pre-fill from that machine.
- The context is always visible and clearable.
- Compatibility is resolved against the selected equipment before any quote or order action.

### 3.2 One record lifecycle pattern, reused

Quote & Order, Support, and Maintenance all repeat the same shape: overview, detail, metadata, status, history, and domain notifications.

Rule:

- Build one shared "record workspace" pattern: list/overview, detail with metadata, a status timeline, a history/communication log, and a next action.
- Reuse it for quotes, orders, and support requests with different fields and statuses.
- Do not design these three pages independently.

### 3.3 Two flow directions: discovery and transaction

The portal has a read path and a write path.

- **Discovery (read):** Two entry points lead to a part or service. Either global search, or drilling down the equipment tree: machine to mechanism/assembly to part.
- **Transaction (write):** A selected part or service leads to the cart, then RFQ, then quotation, then PO upload, then order, then shipment or delivery tracking.
- **Support (write):** An issue leads to an equipment-linked support request that is handled as a tracked chat, then status, then resolution, then feedback.

Rule:

- Keep discovery and transaction visually distinct but connected: any discovered part or service can enter the transaction flow, and any record can link back to its equipment and documents.
- The equipment tree is a first-class selection surface, not only a browsing view. Every node that resolves to an orderable item exposes an add-to-quote action.

### 3.4 The dashboard is a projection, not a source

Everything on the dashboard already lives in another domain.

Rule:

- The dashboard reads from equipment, quotes, orders, support, and notifications.
- It never owns records; it summarises and deep-links into the owning domain.
- Each dashboard summary item links to the full record.

### 3.5 A single status and next-action model

Statuses appear on dashboard, detail pages, notifications, and search results.

Rule:

- Use one status vocabulary across the whole app (defined in `docs/design-guidelines/interaction-rules.md`).
- Every open record exposes a single, explicit next action and who owns it.
- The same status label and treatment is used everywhere a record appears.

### 3.6 Notifications are domain-typed and aggregated

The cards call out document-specific, order-specific, and support-specific notifications.

Rule:

- Each notification carries a type, a related record, a status, and a read/unread state.
- Notifications are created by their owning domain but aggregate in a shared notification list and on the dashboard.
- Opening a notification deep-links to the related record.

### 3.7 Federated search over typed results

Global search must cover equipment, documents, parts, quotes, orders, and requests.

Rule:

- One search queries all record types and returns typed results.
- Each result shows type, title, status, and a next action, and deep-links into its owning domain.
- The current equipment context narrows search but can be cleared.

### 3.8 Context preservation across escalation

The journey requires that troubleshooting context is not lost when a user asks for help.

Rule:

- Starting a support request from a document, part, or machine pre-fills the equipment, related records, and completed checks.
- Attachments and entered information persist through validation and clarification steps.

### 3.9 Parts and services share one purchase pipeline

Spare parts and purchasable services are different item types but the same commercial object: a quote line item.

Rule:

- Model a shared purchasable line item with a type of `part` or `service`.
- Both types are added to the same cart or quote basket, submitted in the same RFQ, priced in the same quotation, and converted into the same order.
- Both follow the same status pipeline through checkout and delivery or service completion.
- The item type may change presentation (a service shows scope and scheduling instead of quantity and stock), but it must not fork the pipeline.

### 3.10 The equipment tree is the primary selection path to a quote

The main way to reach an orderable item is drilling down the installed equipment.

Rule:

- Model the installed base as a hierarchy: machine, then mechanism or assembly, then part.
- Each level is selectable and shows what it contains and its related documents.
- Documents attach at every level: manuals, drawings, SOPs, and instructions can live on the machine, the assembly, and the individual part, and must be viewable and downloadable inline while drilling down.
- The user can search by part number at any level, so they can either browse the whole machine or jump straight to a known part.
- A part node exposes its part number, compatibility, availability, price, its related documents, and an add-to-quote action.
- An assembly node may expose its parts and, where offered, a related service.
- Selecting from the tree carries the equipment context into the cart so compatibility is already resolved.

### 3.11 Support is a tracked, chat-based conversation

Support is the third core flow and must feel like easy, trackable help.

Rule:

- Each support request is a conversation thread with messages, attachments, timestamps, and read/unread state.
- A user can hold multiple support requests, each independently tracked with its own status, category, and next action.
- The support overview lists all requests with status and last activity so nothing is lost.
- New requests are equipment-linked and pre-filled from the originating equipment, part, or document.
- The chat thread and its status timeline are the same record, so communication and progress stay together.

### 3.12 Part number is the identity and search spine

The part number is how users recognise, find, and trust a part across the whole portal.

Rule:

- Every part carries a canonical part number shown consistently in the tree, search, detail, cart, quote, and order.
- Users can search by part number at any level of the equipment tree and from global search.
- The goal is completeness: a user must be able to reach every part of a machine by drilling down, and jump to any known part number directly.

### 3.13 Documents follow the item at every level

Manuals and instructions are only useful at the point of the task.

Rule:

- Documents are linked to machines, assemblies, and parts, not only to a central library.
- While drilling down, the relevant manuals, drawings, SOPs, and instructions for the current level are shown and downloadable in place.
- A part detail shows the exact documents a user needs to identify, order, install, or maintain that part.

### 3.14 Superseded part numbers and alternatives

Parts change over time; the portal must keep users on a valid purchase path.

Rule:

- A part can be superseded: an old part number resolves to its replacement, and the replacement links back to what it replaces.
- When a user opens a superseded part, show the current replacement and offer it as the purchasable item.
- A part can list compatible alternatives that the user may purchase instead, each with its own compatibility, availability, and price.
- Superseded and alternative relationships appear during tree drill-down and on the part detail, so the user always sees a valid, orderable option.

### 3.15 Role and account scope

Who is viewing and which account they act for filters everything in the portal.

Rule:

- The app holds a current user with a role and a current account scope (organisation and optional site).
- The account scope filters machines, parts, documents, quotes, orders, support requests, and notifications.
- Switching the account or site refreshes all visible data consistently.
- Role controls which actions are available, not only which navigation is visible.
- A single user may have access to more than one account or site (for example a fleet manager across sites).

Prototype roles and primary actions:

- **Maintenance technician:** view equipment, identify parts, download documents, request support.
- **Procurement and admin:** request quotes, review pricing, upload PO, place and track orders.
- **Asset and reliability manager:** view installed base and lifecycle context across a site.
- **Fleet and engineering manager:** compare equipment and activity across multiple sites.
- **Training coordinator:** view training-related content and knowledge (mostly out of MVP).

Rule for the prototype:

- Provide a role/account switcher so the different personas can be demonstrated.
- The switcher changes scope and permissions; it does not require real authentication.

### 3.16 Navigation and breadcrumbs

Users must always know where they are and be able to return without losing context.

Rule:

- The sidebar maps to the MVP modules; out-of-scope modules are shown disabled.
- The equipment tree exposes a breadcrumb path, for example: My Equipment > Machine > Assembly > Part.
- Any breadcrumb level is a link back to that level.
- Deep links preserve account, machine, assembly, part, document, and request or quote context.
- Search results and notifications open directly into the correct record with its context intact.
- The current equipment and account context stays visible when moving between documents, parts, quotes, and support.

### 3.17 Cart and checkout lifecycle

Parts and services share one cart and one checkout, connecting discovery to the transaction pipeline.

Rule for the cart:

- Items can be added from search, the equipment tree, an assembly, or a part or service detail.
- Parts allow a quantity; services allow scope, date, location, or notes.
- Items can be edited or removed, and the cart has an explicit empty state.
- Each line item preserves its source equipment and account context.
- The cart surfaces compatibility warnings, superseded-part replacements, and alternatives when an item is unavailable.
- The cart supports loading, error, and unavailable states.

Rule for checkout:

- One RFQ can contain both parts and services.
- Checkout confirms account, delivery or service location, and billing details.
- Checkout allows PO upload (or a prototype placeholder) and shows all line items, totals, dates, and notes.
- Submission is blocked while compatibility or required information is unresolved.
- After submission the user sees a confirmation number and the next status.

Cart status pipeline:

`empty` → `draft` → `submitted` → `quoted` → `accepted` → `ordered`

## 4. Data relationships

- **User** has a role and access to one or more accounts; the role determines available actions.
- **Account** is an organisation with optional sites; the current account scope filters all other records.

- **Equipment** is a hierarchy of machine, mechanism/assembly, and part. It is referenced by parts (compatibility, where-used), documents, support requests, quotes, and orders.
- **Part** has a canonical part number and references compatible equipment and its position in the assembly tree. It may be superseded by a replacement part, may replace an older part, and may list compatible alternative parts. It appears as a purchasable line item in cart, quotes, and orders.
- **Service** is a purchasable line item like a part; it references equipment and flows through the same quote and order pipeline.
- **Cart / quote line item** has a type of `part` or `service` and references the source equipment context.
- **Cart** belongs to an account, holds line items, and carries a status through the cart pipeline.
- **Document** references equipment at any level (machine, assembly, or part) and/or a specific part, and may own a downloadable file.
- **Support request** references equipment, optionally a part or document, and owns a chat thread of messages plus a status history.
- **Quote** references a request and its line items; an **order** references a quote and carries shipment or delivery status.
- **Notification** references exactly one owning record and carries a type and read state.
- **User/role** influences which navigation and actions are available.

These relationships are already reflected in `src/data/portal-data.ts` and should stay the single source of prototype records.

## 5. Page to implementation mapping

| Page (sidebar) | Feature folders | Shared patterns |
| --- | --- | --- |
| Dashboard | `dashboard/` | Record projection, status model, notifications |
| My Equipment | `equipment/`, `documents/` | Equipment context, record workspace, downloads |
| Products & Services | `parts/`, `documents/` | Equipment context, compatibility, discovery flow, cart |
| Quote & Order | `quotes/`, `orders/` | Record workspace, transaction flow, status model |
| Support & Communication | `support/`, `notifications/` | Record workspace, context preservation, notifications |
| My Profile | `profile/` | Cross-links, notification settings |
| Global search / Notifications / Account selector | app shell in `src/components/shared/` | Federated search, notification aggregation, equipment/account context |

## 6. Implications for the build order

1. Build the app shell first: navigation, equipment/account context, global search, and notification aggregation.
2. Build My Equipment, because it provides the context every other page consumes.
3. Build Products & Services on top of the equipment context and compatibility logic.
4. Build the shared record workspace once, then apply it to Quote & Order and Support.
5. Build the Dashboard last in the first pass, since it projects data the other domains produce.
