# Task 22 — Products & Services catalogue redesign

- **Status:** Done
- **Phase:** 3 — Transaction (discovery)
- **Dependencies:** Task 07 (part detail), Task 08 (services), Task 09 (cart), Task 21 (transaction journey)

## Purpose

Enable customers to discover products and services across the **entire Emhart Glass catalogue** (not only their own installed base) and add any part or service to the shared cart for an RFQ.

This is the key difference from **My Equipment**:

- **My Equipment** = the customer's owned, installed machines (scoped to the account).
- **Products & Services** = the full Emhart Glass machines, parts, and documents catalogue plus all available services, searchable from one catalogue workspace.

## Capabilities (in scope)

- Spare parts catalogue
  - Search by machine, part number, name
  - Compatibility information ("fits your equipment")
  - BOM navigation (machine → assembly → part)
- Catalogue discovery
  - One search across machines, parts, and documents
  - Content filter: All / Machines / Parts / Documents
  - Machine filter applies to parts and documents
  - Grouped results when All is selected
- Machine details
  - Model, configuration, catalogue/owned status, assemblies, compatible parts, and related documents
- Document details
  - Title, document ID, type, revision, status, summary, related machines/parts, and PDF action
- Part details
  - Metadata, images
  - Part number history (supersede / replace chain)
  - Pricing & lead-time information
  - Availability information
  - Where used
- Shopping cart
  - Quantity selection per part
  - RFQ submission (via the Quotes & Orders hub)
- Service offerings
  - All available services, added to the same cart for RFQ

## Out of scope (removed)

- Product/service recommendations
- Service request submission
- Training offerings and training request submission

## Layout — two tabs, one shared cart

A top segmented control switches between the two tasks. Both feed the same cart; a persistent "View cart" button (with count) stays visible.

### Tab A — Catalogue (master → detail)

- **Left (find):** one search input (machine, document, part name/number/ID), content selector (`All`, `Machines`, `Parts`, `Documents`), and machine filter (`All machines` + each machine, owned ones flagged).
- **All:** grouped machine, part, and document results.
- **Machines:** machine results with a detail view containing machine metadata, assemblies, compatible parts, and related documents.
- **Parts:** flat results plus a `List / Browse BOM` mode. The detail view shows image, metadata, orderability, "fits your equipment / catalogue item", superseded notice, pricing and lead time, availability, **part number history**, **where used**, alternatives, quantity, and Add to cart.
- **Documents:** document results with a detail view containing document metadata, summary, related machines/parts, and a PDF view/download action. Documents are informational and cannot be added to cart.

### Tab B — Services

- Machine filter (`All machines` + each machine).
- Card grid of services: name, category, description, price, lead time, Add to cart.

## Data changes

- Add catalogue-only machines (not owned by any account) so the "full catalogue vs. my equipment" distinction is visible.
- Add catalogue assemblies and parts, including:
  - parts compatible with multiple machines (meaningful "where used"),
  - a supersession chain (legacy → current),
  - alternatives.
- Add more services, including multi-machine / catalogue-wide offerings.

## Logic helpers

- `getOrderability(part)` — compatible / warning (superseded) / unavailable, independent of a single machine.
- `fitsOwnedEquipment(part, ownedMachineIds)` — informational "fits your equipment" signal.
- `getPartNumberHistory(part, parts)` — ordered oldest → newest across the replace/supersede chain.
- `getWhereUsed(part, machines, assemblies)` — machines + assembly referencing the part.
- `searchParts(query, parts, machines, machineFilter?)` — catalogue search by part no. / name / machine.
- `searchCatalogue(query, contentType, records, machineFilter?)` — grouped machine/part/document discovery with relation-aware machine filtering.

## Acceptance criteria

1. The page has two tabs: Catalogue and Services, switchable without losing the cart.
2. Catalogue search can be filtered by All, Machines, Parts, or Documents.
3. All results are grouped by content type; selecting a result opens the matching detail view.
4. Parts can be found by search (part no., name, machine) and by BOM browse.
5. The machine filter narrows parts, documents, and BOM navigation, and lists all catalogue machines (owned flagged).
6. Machine detail shows metadata, assemblies, compatible parts, and related documents.
7. Document detail shows metadata, summary, relations, and a PDF action when available.
8. The part detail shows metadata, image, availability, pricing & lead time, part number history, where used, and alternatives.
9. A quantity selector sets the line quantity; the cart total reflects quantity.
10. Catalogue parts (not tied to owned equipment) can still be added and submitted for RFQ.
11. Superseded parts show a review notice and point to the current part.
12. Services can be filtered by machine and added to the same cart.
13. Recommendations, service requests, and training are not present.
14. `npx tsc --noEmit` and `npm run build` pass.
