# Task 23 — Critical Journey 2: Support request to resolution

- **Status:** Done
- **Phase:** 4 — Support (critical journey integration)
- **Dependencies:** Task 04, Task 06, Task 10, Task 12, Task 13

## Objective

Make the customer-support journey work end to end as one persistent, equipment-linked case: identify an issue, create a support request, provide evidence, submit it, communicate with Emhart Glass, resolve the issue, and confirm closure.

## Core principle

One support issue equals one persistent request record and one communication thread. Equipment context, messages, evidence, status changes, ownership, and resolution must remain attached to that record throughout the journey.

```text
Identify issue → Create request → Add evidence → Submit
→ Triage → Communicate → Resolve → Confirm or reopen → Close
```

## Entry points

A customer can start the journey from:

1. **My Equipment** — select a machine, assembly, or part and choose `Request support`. The site and equipment context are prefilled.
2. **Support & Communication** — choose `New support request` and select the relevant equipment manually.
3. **Document or troubleshooting guide** — choose `Still need help`. The document and related equipment are attached as context.

All entry points create the same support-request type and lead to the same workspace.

## Support request data model

Each request must contain:

- Request ID and human-readable number, for example `SR-2049`
- Account and site
- Machine ID
- Optional assembly ID and part ID
- Optional related document IDs
- Issue category
- Priority
- Subject and problem description
- Issue start time/date
- Production impact: stopped, degraded, or unaffected
- Troubleshooting steps already attempted
- Status
- Assigned Emhart Glass specialist
- Current owner of the next action: customer or Emhart Glass
- Messages
- Evidence and attachments
- Timeline/system events
- Resolution summary and root cause
- Related parts, services, and documents used in the resolution
- Customer confirmation and optional satisfaction feedback

## Lifecycle

| # | Status | Trigger | Owner / next action |
|---|---|---|---|
| 1 | `draft` | User starts a request | Customer completes required information and evidence |
| 2 | `submitted` | User submits a valid request | Emhart Glass reviews the case |
| 3 | `under-review` | Emhart Glass begins triage | Emhart Glass assigns priority, specialist, and next step |
| 4a | `pending-customer` | Emhart Glass requests information | Customer replies or adds evidence |
| 4b | `in-progress` | Required information is available | Emhart Glass investigates and provides guidance |
| 5 | `resolved` | Emhart Glass records a resolution | Customer confirms resolution or reports that the issue persists |
| 6a | `closed` | Customer confirms resolution | Journey complete; feedback is optional |
| 6b | `in-progress` | Customer reports issue persists | Emhart Glass resumes investigation |

The interface must always display the current status and clearly identify who owns the next action.

## Request creation

The request form must collect:

- Site and machine
- Assembly or part, when known
- Issue category
- Priority
- Subject
- Problem description
- When the issue started
- Production impact
- Troubleshooting steps already attempted

Required fields must be validated before submission. Equipment context supplied by an entry point must be prefilled but remain reviewable.

## Evidence

The customer can associate evidence with the request:

- Photos
- Videos
- PDFs
- Log files
- Completed troubleshooting checks
- Existing portal documents

For the prototype, attachments may use local metadata and simulated uploads. Evidence must still appear as part of the request record and timeline rather than in a disconnected file area.

## Submission and triage

Submitting a valid draft must:

- Generate a service-request number
- Change status to `submitted`
- Add a submission event to the timeline
- Show the expected response time
- Set the next-action owner to Emhart Glass

Triage must support:

- Assigning a specialist
- Changing priority
- Moving the request to `under-review`
- Requesting additional information
- Starting investigation
- Attaching relevant documents
- Suggesting troubleshooting steps
- Linking an on-site service when appropriate

## Request workspace

Support & Communication uses a conversation-first, two-pane inbox. Selecting a request and continuing its conversation is the primary interaction; case details remain available on demand without occupying a permanent middle column.

1. **Requests pane**
   - Lists open, waiting, resolved, and closed requests
   - Filters by status, machine, priority, and date
   - Shows request number, subject, machine/site, status, priority, last activity, and next-action owner
2. **Selected conversation pane**
   - Sticky request header with request number, subject, status, priority, machine, owner, and next action
   - Chronological customer messages, Emhart Glass replies, attachments, and system events
   - Persistent reply composer at the bottom
   - Contextual lifecycle actions embedded near the relevant conversation state
3. **Collapsible request-details panel**
   - Issue summary
   - Equipment context
   - Priority and status
   - Assigned specialist
   - Production impact
   - Evidence
   - Current owner and next action
   - Resolution details when available

The details panel opens from the conversation header and is collapsed by default. The layout may adapt responsively, but request selection and conversation must remain the dominant visual hierarchy.

## Contextual action placement

- `draft` — the request form replaces the conversation content.
- `submitted` — a waiting state and triage action appear in the timeline.
- `pending-customer` — a prominent next-action banner appears above the reply composer.
- `under-review` / `in-progress` — Emhart Glass actions appear in a compact action area within the conversation pane.
- `resolved` — the resolution summary is shown as a conversation event followed by `Confirm resolved` and `Issue persists`.
- `closed` — the conversation becomes read-only and optional feedback appears at the bottom.

## Communication rules

- All messages and attachments remain in the selected request thread.
- When Emhart Glass requests information, status becomes `pending-customer` and the customer owns the next action.
- When the customer replies, status returns to `in-progress` and Emhart Glass owns the next action.
- Status changes appear as system events in the same chronological timeline.
- Unread messages are visibly distinguished and can be marked read.

## Resolution and closure

Before marking a request resolved, Emhart Glass records:

- Resolution summary
- Root cause, when known
- Actions taken
- Parts or services used
- Related documents
- Follow-up recommendations

When status is `resolved`, the customer can:

- **Confirm resolved** — status becomes `closed`; optional feedback becomes available.
- **Issue persists** — status returns to `in-progress`; a reopen event and customer note are added to the timeline.

## Scope

### In scope

- Shared support state accessible from all support entry points
- Equipment/document context handoff
- New support-request form and validation
- Simulated evidence attachment
- Request list and filters
- Persistent request detail and communication thread
- Role-aware customer and Emhart Glass actions
- Status lifecycle and next-action ownership
- Resolution, reopen, closure, and optional feedback

### Out of scope

- Real file storage or malware scanning
- Email or SMS delivery
- External CRM/case-management integration
- Live chat transport or push notifications
- Real SLA calculations
- Technician scheduling and dispatch
- Automated diagnostics

## Implementation approach

1. Introduce a shared support context at the app root for request records, selected request, messages, evidence, and lifecycle actions.
2. Extend the support data types rather than keeping request details as unrelated local component state.
3. Connect entry points from My Equipment and catalogue documents to request creation with prefilled context.
4. Rebuild Support & Communication as a two-pane request inbox and conversation with a collapsible details panel.
5. Implement customer and Emhart Glass actions through the existing role selector.
6. Add focused lifecycle and validation checks, then validate the complete browser journey.

## Acceptance criteria

- [x] A user can start a request from My Equipment with site, machine, assembly, and part context prefilled where available.
- [x] A user can start a request from Support & Communication and select equipment manually.
- [x] A user can start a request from a document with that document and its equipment context attached.
- [x] Required request information is validated before submission.
- [x] Evidence can be added and remains associated with the request.
- [x] Submission creates a unique request number, status, timeline event, response expectation, and next-action owner.
- [x] Requests can be filtered by status, machine, priority, and date.
- [x] Selecting a request shows its issue details, equipment, evidence, owner, next action, and conversation.
- [x] The default workspace prioritizes request selection and conversation without a permanent middle details card.
- [x] Request metadata and evidence are accessible through a collapsible details panel in the conversation header.
- [x] Lifecycle actions appear contextually in the conversation pane.
- [x] Customer and Emhart Glass messages remain in one chronological thread.
- [x] Requesting customer information changes status and next-action ownership correctly.
- [x] A customer reply returns the request to active investigation.
- [x] Resolution requires a summary and can include root cause, actions, parts/services, documents, and recommendations.
- [x] The customer can confirm resolution and close the request.
- [x] The customer can report that the issue persists and reopen the request.
- [x] Closed requests can collect optional customer feedback.
- [x] The full journey works without relying on disconnected local state.
- [x] `npx tsc --noEmit` and `npm run build` pass.
- [x] The journey is browser-tested from each entry point through closure and reopen.

## Plan and verification result

- Added `SupportProvider` as the single source of truth for requests, evidence, messages, ownership, resolution, closure, and reopen actions.
- Connected direct creation, My Equipment, and catalogue-document entry points.
- Rebuilt Support & Communication as a filtered request list, request detail, and conversation workspace.
- Browser-tested draft creation, submission, triage, clarification, customer reply, resolution, closure, feedback availability, reopen, equipment context, and document context.
- Browser-tested the two-pane request/conversation hierarchy, collapsed and expanded request details, and a 390 px mobile viewport with no horizontal overflow.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
