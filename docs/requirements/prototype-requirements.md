# Emhart Glass Service Portal Prototype Requirements

**Status:** Working MVP specification
**Source material:** UX strategy blueprint, solution requirements blueprint, user journey map, personas, product images, technical PDFs, and prototype documents.
**Related:** Page capabilities and cross-cutting logic patterns are defined in [solution-logic.md](solution-logic.md).

## 1. Prototype objective

Create a unified self-service portal that helps Emhart Glass customers find trusted technical information, identify compatible parts, request quotations, place orders, request support, and track progress.

The prototype should demonstrate how the portal reduces downtime, increases customer confidence, improves operational efficiency, and makes request status transparent.

## 2. Primary users

- **Maintenance technicians:** Find machine information, diagnose issues, identify parts, read procedures, and request support.
- **Procurement and admin specialists:** Check availability, prices, quotes, delivery information, and order status.
- **Asset and reliability managers:** Review installed equipment, lifecycle information, reliability risks, and maintenance context.
- **Fleet and engineering managers:** Compare equipment across sites and support standardisation and investment decisions.
- **Training coordinators:** Find and organise equipment-linked training and technical knowledge.

## 2.1 Business outcomes

The customer should be able to:

- Manage equipment information throughout its lifecycle.
- Plan maintenance activities at the right time.
- Buy products and book services needed to operate and maintain equipment.
- Resolve equipment issues and reduce downtime.
- Build operator and technician knowledge and skills.

## 2.2 Solution areas

The full solution blueprint identifies these navigation areas:

- Dashboard
- My Equipment
- Maintenance
- Products and Services
- Quote and Order
- Support and Communication
- User Management
- Training
- Reporting
- My Profile

The first prototype should prioritise the MVP areas listed in section 3.8. The remaining areas should be represented as disabled, labelled, or out-of-scope navigation rather than implemented as full workflows.

## 2.3 Cross-platform capabilities

- Global search
- Notifications
- Account selector

## 3. MVP scope

### 3.1 Documentation and search

The portal must allow a user to:

- Search by machine, product, component, part number, document title, order number, or request number.
- Filter results by equipment, document type, category, and status.
- View a result summary with title, document type, revision, applicable equipment, and status.
- Open technical content in a readable detail view.
- Download the original PDF where one exists.
- See related parts, machines, images, drawings, and documents.
- Distinguish current, reference, and prototype content.

### 3.2 Machine and equipment context

The portal must allow a user to:

- Select an installed machine or equipment record.
- See machine type, model, serial number, site, section, and configuration.
- View relevant machine images and technical drawings.
- Use the selected machine as context when searching for parts and documents.
- See compatibility warnings when a product or part may not match the selected equipment.

### 3.3 Part identification and validation

The portal must allow a user to:

- Search by part number, machine, equipment, or component.
- View part image, description, part number, category, and technical details.
- Check compatibility against machine type, revision, center distance, or configuration.
- See availability status and estimated lead time.
- Enter quantity and delivery location.
- Review unit price, total price, shipping, taxes, and additional costs where available.

### 3.4 Quote request

The portal must allow a user to:

- Add one or more parts to a quote request.
- Review quantities and delivery location.
- Add supporting information or special requirements.
- Submit the request.
- Receive and display a quote-request number.
- Show explicit request statuses:
  - Request received
  - Under review
  - Pending clarification
  - Quote available
- Open a quote and compare it with the original request.
- Accept a quote or request clarification.

### 3.5 Service request and escalation

The portal must allow a user to:

- Start a service request from a document, part, machine, or equipment record.
- Describe the problem and affected equipment.
- Preserve the troubleshooting context already completed.
- Attach photos, error codes, documents, or other evidence.
- Select urgency and affected section where relevant.
- Submit the request and receive a request number.
- View the request status, messages, attachments, and next action.
- Reply to requests for clarification.

### 3.6 Order and request tracking

The portal must allow a user to:

- View current and previous orders and service requests.
- Search by order number, request number, date, equipment, or status.
- See a visible status timeline.
- Review shipment, delivery, service, and communication updates.
- See outstanding actions and who is responsible for the next step.
- Open order confirmation details.
- Verify parts, quantities, prices, and delivery information.

### 3.7 Closure and feedback

The portal must allow a user to:

- Confirm that no open actions remain.
- Close a completed request.
- Add final comments.
- Rate the service or support experience.
- Submit feedback.

### 3.8 MVP solution modules

Based on the solution blueprint, the prototype MVP includes:

#### Dashboard

- Equipment overview
- Order and request summary
- Recent support activity
- Notifications and updates
- Recommended or outstanding actions
- Quick access to key functions

#### My Equipment

- Installed-base overview
- Machine details and configuration
- Installed equipment tree
- Metadata search
- Document centre
- Full-text document search representation
- Manuals, technical documentation, drawings, pictures, videos, maintenance guidelines, and SOP references

#### Products and Services

- Spare-parts catalogue
- Search by machine and part number
- Compatibility information
- BOM navigation representation
- Part details, metadata, and images
- Part-number history representation
- Pricing, lead time, availability, and where-used information
- Shopping cart or quote basket
- RFQ submission

#### Quote and Order

- Quote and order overview
- Quote and order details
- Submit RFQ
- View sales quotation
- Upload purchase order representation
- Status tracking and history
- Shipment-document links or placeholders
- Order-specific notifications

#### Support and Communication

- Contact directory representation
- Support-request overview
- Create support request
- Equipment-linked requests
- Request categorisation
- Request details, metadata, status, and history
- Feedback
- Read and unread notification states

## 4. Prototype screens

The first prototype should include these screens or views:

1. **Portal home / dashboard**
   - Global search
   - Quick links to Documentation, Parts, Service Requests, Orders, and Machines
   - Recent requests and orders
   - Outstanding actions

2. **Search results**
   - Search input
   - Filters
   - Result cards or table
   - Document, part, machine, and request result types

3. **Machine detail**
   - Machine image
   - Machine metadata
   - Installed equipment and related parts
   - Documentation and drawings

4. **Document detail**
   - Title, revision, type, and applicability
   - Summary and content preview
   - Related equipment and parts
   - Download PDF action

5. **Part detail and compatibility**
   - Product image
   - Part number and description
   - Compatibility result
   - Availability, lead time, and price
   - Add to quote action

6. **Quote request**
   - Selected parts and quantities
   - Delivery location
   - Supporting information
   - Submission confirmation and request number

7. **Service request**
   - Affected equipment
   - Problem description
   - Evidence upload area
   - Completed checks
   - Priority and submission

8. **Request and order tracking**
   - Status timeline
   - Messages and attachments
   - Required next action
   - Order, delivery, and service information

9. **Completion and feedback**
   - Confirmation details
   - Close request action
   - Rating and comment form

## 5. Required prototype data

### Machine data

- Machine type and model
- Serial number
- Site and location
- Section or cavity
- Revision and configuration
- Machine image
- Technical drawing links

### Part data

- Part number
- Name and description
- Category
- Image
- Applicable machine types
- Applicable revisions and configurations
- Compatibility status
- Availability and lead time
- Price and cost details

### Document data

- Title
- Document type
- Document ID
- Revision
- Date
- Applicable equipment
- Summary
- Markdown working content
- Original PDF download path
- Related parts and machines

### Request and order data

- Request or order number
- Type: service request, quote, or order
- Customer and site
- Related machine and parts
- Status
- Priority
- Created and updated dates
- Messages and attachments
- Next action
- Owner or responsible team

## 6. UX requirements

- Use self-service as the default path.
- Keep the current machine, part, or request context visible.
- Make compatibility and applicability clear before a user orders or follows guidance.
- Use progressive disclosure for technical details and advanced information.
- Show status and next action clearly after every submission.
- Provide a single, consistent search experience across documents, parts, machines, and requests.
- Preserve user input when moving from troubleshooting to escalation.
- Make errors, unavailable information, and pending states explicit.
- Support desktop-first layouts for plant offices and maintenance workstations.
- Keep critical actions usable on smaller screens for field and workshop use.
- Use the shadcn component library for consistent states: default, active, selected, disabled, loading, success, warning, and error.

## 7. Content and asset requirements

Use the current prototype assets as follows:

- `assets/images/Machines/` for machine and equipment views.
- `assets/images/Parts/` for part results and detail views.
- `assets/images/Assembley organism/` for assembly and mechanism views.
- `assets/images/technical drawings/` for drawings and documentation previews.
- `assets/documents/*.md` for searchable prototype content.
- `assets/documents/*.pdf` for download actions.

All prototype content must be labelled or understood as demo data. Technical references must not be presented as current safety or installation instructions without verification.

## 8. MVP exclusions

The requirements blueprint explicitly places these areas out of scope for the MVP:

- Service and Training offerings
- Self-user management
- Maintenance module
- Contracts and invoices
- BEG employee portal
- Invoices
- Reporting

The journey map also marks these areas as not MVP and they should not block the first prototype:

- Full problem-recognition workflow
- Automated diagnosis or diagnostic decision trees
- Production integrations with ERP, CRM, inventory, service, or learning systems
- Real authentication and permissions
- Live stock, pricing, shipment, or service data
- Real quote or order submission
- Real file upload storage
- Production analytics implementation

These can be represented with realistic static demo data and interactive prototype states.

## 9. MVP success criteria

### Customer success

- Access equipment-related information in one place.
- Find documents and machine information more easily.
- Identify and request spare parts completely through the portal.
- Track spare-parts requests, orders, and deliveries.
- Contact BEG and follow support interactions through a structured process.

### BEG success

The solution blueprint defines these target outcomes after go-live:

- Onboard at least 20 customer organisations within the first six months.
- Achieve at least 50 monthly active users.
- Have 50 percent of onboarded users place spare-parts requests through the portal.
- Receive no manual documentation requests from onboarded users.
- Have at least 80 percent of support requests contain all required information, reducing clarification loops.
- Establish the customer portal as the primary digital entry point for onboarded customer interactions.

## 10. Acceptance criteria

The prototype is ready for the first review when a user can:

- Search for the Pantograph Baffle Arm.
- Open a technical result and understand its equipment applicability.
- Download the corresponding TNB PDF.
- Select a machine and see related parts and documents.
- Open a part and see compatibility, availability, and lead time.
- Add a part to a quote request.
- Submit the quote request and see a request number and status.
- Open a service request with machine context and supporting evidence.
- View status updates and outstanding actions.
- Close a completed request and submit feedback.

## 11. Open decisions

- Which user role is the first usability-test priority?
- Which machine should be the default demo machine?
- Which fields are mandatory for service requests?
- Which statuses and status colours are approved by Emhart Glass?
- Should prices be shown in EUR, another currency, or omitted in early testing?
- Which documents are approved for the first stakeholder review?
- What authentication and role differences should be represented visually?
