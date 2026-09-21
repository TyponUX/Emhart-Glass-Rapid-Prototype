# Task 15 — Interaction states and accessibility

- **Status:** Done
- **Phase:** 5 — Dashboard and quality
- **Dependencies:** Core feature tasks

## Objective

Review the prototype's shared interaction states, accessibility basics, responsive behaviour, and cross-flow consistency.

## Scope

- Keyboard-accessible navigation and controls
- Visible focus states from shadcn primitives
- Search results and no-results state
- Notification unread/read state
- Empty, disabled, success, warning, and error states
- PDF download affordances
- Status labels and next actions
- Breadcrumb navigation
- Desktop and responsive layout review

## Acceptance criteria

- [x] TypeScript validation passes.
- [x] Production build passes.
- [x] Main controls expose accessible names or visible labels.
- [x] Navigation uses semantic buttons and `aria-current` for the active page.
- [x] Search input exposes an accessible label and typed result buttons.
- [x] Notifications expose unread count and read state as text.
- [x] Select, input, button, checkbox, and textarea components use shadcn focus/disabled behaviour.
- [x] Breadcrumbs provide links for previous equipment levels.
- [x] Empty search and empty cart states provide recovery or next-action text.
- [x] Status is communicated with text or badges, not colour alone.

## Plan and verification result

- Reviewed the interaction rules in `docs/design-guidelines/interaction-rules.md` against the implemented shell and feature views.
- Confirmed `npx tsc --noEmit` and `npm run build` pass.
- Browser-verified machine → assembly → part → document/PDF → quote basket flow.
- Browser-verified support request → reply → resolved flow.
- Browser-verified dashboard quick links, global search, notification read state, and profile controls during feature implementation.

## Known limitations

- The Vite config emits a non-blocking `__dirname` future-compatibility warning.
- Prototype state is local and resets on reload.
- No automated end-to-end test suite exists yet; browser verification was performed manually through the integrated browser.
