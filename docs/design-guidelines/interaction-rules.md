# Interaction Rules

These rules define how the Emhart Glass prototype communicates interaction, progress, feedback, and system status. They complement shadcn/ui components and should be implemented through shadcn variants, props, ARIA attributes, and Tailwind classes.

## General principles

- Every interactive element must have a visible, understandable state.
- Preserve user input when validation fails or a request needs clarification.
- Do not use colour alone to communicate status; combine colour with text, icons, or labels.
- Keep the current machine, equipment, part, request, or order context visible.
- Use plain language that describes what happened and what the user can do next.
- Destructive or irreversible actions require confirmation.
- Use consistent feedback placement and wording across the portal.

## Component states

### Hover

- Apply only to elements that can be interacted with.
- Provide a subtle background, border, or elevation change.
- Preserve text and icon contrast.
- Do not make layout dimensions change.
- Do not use hover as the only way to reveal important information.

**shadcn usage:** Use component hover classes such as `hover:bg-accent` or the component's built-in hover styling.

### Focus

- Every keyboard-focusable element must show a visible focus ring.
- Focus must have sufficient contrast against the surrounding background.
- Focus must not be removed with `outline-none` unless a replacement focus style is present.
- Focus order should follow the visual reading order.
- After a modal closes, return focus to the control that opened it.

**shadcn usage:** Preserve the generated `focus-visible:ring-*` classes and use `:focus-visible`, not focus styles that appear during ordinary mouse interaction.

### Active

- Active means the user is currently pressing or engaging with a control.
- Use a brief visual change such as darker background, pressed scale, or border emphasis.
- The active state must not look like a disabled state.
- Do not rely on active styling to communicate a persistent selection.

### Selected

- Selected means the choice remains applied after the interaction ends.
- Use a persistent visual treatment and an accessible state such as `aria-selected`, `aria-pressed`, or `data-state="checked"`.
- Selected navigation should remain identifiable when the user moves focus elsewhere.
- For filters and multi-select controls, show the number or names of applied selections where useful.

### Disabled

- Disabled controls cannot currently be used.
- Use the native `disabled` attribute where supported.
- Reduce emphasis, but keep disabled text readable.
- Do not make disabled controls appear broken or hide them without explanation.
- If a user needs to complete another step first, explain the prerequisite nearby.

**shadcn usage:** Use the component's `disabled` prop and generated disabled styles instead of manually changing opacity only.

### Loading

- Show loading immediately after an action that may take noticeable time.
- Prevent duplicate submissions while the operation is in progress.
- Keep the action label understandable, for example `Submitting request...`.
- Preserve the surrounding context and user-entered information.
- Provide a recovery message if loading fails or takes too long.

**shadcn usage:** Combine Button, Skeleton, Spinner, and disabled states. Do not use a spinner without explaining what is loading.

## Feedback states

### Success

- Confirm what completed and include the resulting identifier when relevant.
- Provide the next useful action, such as `View request` or `Download confirmation`.
- Use a success icon and text in addition to colour.
- Keep success feedback visible long enough to be noticed; persistent confirmations should appear in the page content.

Examples:

- `Quote request Q-2026-0147 submitted.`
- `Part added to your quote request.`
- `Request SR-2048 is now under review.`

### Error

- Explain what failed in user language.
- Identify whether the issue is with a field, the request, or the system.
- Tell the user how to recover where possible.
- Keep valid input and show field-level errors next to the affected field.
- Avoid exposing technical stack traces or internal error codes.

Examples:

- `Enter a quantity greater than 0.`
- `This part could not be matched to the selected machine.`
- `We could not submit the request. Check your connection and try again.`

### Validation

- Validate required fields when the user leaves a field or submits the form, according to the interaction context.
- Mark required fields consistently.
- Place the message next to the relevant field and provide a summary for long forms.
- Do not show errors before the user has had a reasonable chance to complete the field.
- Validate compatibility before allowing quote or order submission.
- Preserve attachments and completed troubleshooting information when validation fails.

## Notifications

- Notifications should be relevant, actionable, and connected to a request, order, machine, or document.
- Distinguish unread and read states without relying on colour alone.
- Show a concise title, status, timestamp, and next action where needed.
- Group related notifications to prevent noise.
- Allow users to open the related record directly.
- Use urgent notifications only for issues requiring timely action.

Notification types:

- Request received
- Pending clarification
- Quote available
- Order confirmed
- Shipment or delivery update
- Support response
- Document update
- System or account notice

## Downloads

- Use an explicit action label such as `Download PDF`.
- Show the document title, document ID, revision, and file type before download.
- Keep the user on the current page unless a new preview is deliberately requested.
- Indicate when a download starts or has completed.
- Show an error with retry if the file is unavailable.
- Never present a prototype or reference document as current safety guidance without an appropriate label.
- Use URL-safe asset paths and preserve the original filename where practical.

## Search

- Make global search available from the main portal navigation.
- Support search by machine, part number, component, document title, order number, and request number.
- Show the search scope and allow filtering by result type.
- Preserve the submitted query when filters change.
- Show loading, results, no-results, and error states.
- Explain how to broaden a search when no results are found.
- Highlight matching terms only when it improves scanning and remains readable.
- Keep selected machine or equipment context visible and allow the user to clear it.

Search states:

- Empty: explain what can be searched.
- Typing: show suggestions only when they are useful.
- Loading: show a stable loading state without shifting the layout.
- Results: show count, type, title, status, and next action.
- No results: show the query and alternative suggestions.
- Error: explain that search failed and provide retry.

## Status transitions

Statuses must communicate both the current state and the next expected action.

### Service requests

1. Draft
2. Submitted / Request received
3. Under review
4. Pending clarification
5. In progress
6. Resolved
7. Closed

### Quote requests

1. Draft
2. Submitted / Request received
3. Under review
4. Pending clarification
5. Quote available
6. Accepted
7. Converted to order
8. Closed or expired

### Orders

1. Draft
2. Submitted
3. Confirmed
4. In preparation
5. Shipped
6. Delivered
7. Complete
8. Cancelled, where applicable

For every status:

- Show the current status prominently.
- Show when it changed and, where appropriate, who owns the next action.
- Explain the next action or why the user is waiting.
- Preserve the history of previous statuses and communications.
- Use consistent status labels across dashboard, detail pages, notifications, and search results.
- Do not allow users to perform actions that contradict the current status.

## Accessibility requirements

- All controls must be keyboard accessible.
- Use semantic elements and accessible names.
- Use ARIA state attributes only when native semantics are insufficient.
- Ensure focus indicators are visible.
- Provide text alternatives for icons and images.
- Announce important asynchronous updates to assistive technologies where appropriate.
- Maintain readable contrast for text, controls, and status indicators.

## Relationship to shadcn/ui

These rules do not interfere with shadcn/ui. They define how the project uses shadcn components:

- Keep generated components in `src/components/ui/`.
- Use component props such as `variant`, `size`, `disabled`, and `aria-*` attributes.
- Extend variants when a repeated Emhart-specific state is needed.
- Keep page-specific composition in `src/components/` or `src/features/`.
- Keep global colours and design tokens in `src/styles/globals.css`.
- Avoid editing generated primitives for one-off page styling unless the shared component behaviour must change.
