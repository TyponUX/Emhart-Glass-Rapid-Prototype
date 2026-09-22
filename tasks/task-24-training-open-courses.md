# Task 24 — Training open-course examples

- **Status:** To do
- **Phase:** 6 — Extended modules (post-MVP)
- **Dependencies:** Task 18

## Objective

Make the Training page act as the kickoff landing page for Emhart Glass training by showcasing three real open training courses as selectable course panels. No additional subpages are introduced; the page only displays real examples that lead users toward the training section.

## Context

The user likes the existing selectable course panels on `src/features/training/training.tsx`. Instead of generic demo offerings, the page should present real examples taken from the public Emhart Glass Open Training Courses page:

- Source: https://www.emhartglass.com/Products/LifecycleSolutions/TrainingDevelopment/OpenTrainingCourses

Three real courses selected from the live schedule:

1. **FleXinspect BC Gen III Operational & Job Change** — Munich, Germany · 16 November 2026
2. **AIS Mechanical Machine Training** — Sundsvall, Sweden · 23 November 2026
3. **SMARTFEEDER – Technical & Operational Training** — Sundsvall, Sweden · 1 December 2026

## Preconditions

- The Training route and shell navigation are available (Task 18).
- `TrainingRecord` and `trainingOfferings` exist in `src/data/portal-data.ts`.
- The selectable course panels in `src/features/training/training.tsx` are available.

## Scope

In scope:

- Replace the demo `trainingOfferings` examples with the three real open courses above.
- Keep the existing selectable course-panel layout the user likes.
- Show course title, audience, format, location, and next date on each panel.
- Present the Training page as the kickoff/leading page for the training section.
- Provide a clear "Sign up / request" call to action that reflects the real open-course intent.
- Let users filter and sort the course list by the source page parameters: topic, date, and location.

## Out of scope

- New subpages or a separate course-detail route.
- External enrolment, payment, or learning-platform integration.
- Live schedule fetching from emhartglass.com.

## Approach and assumptions

- Extend `TrainingRecord` (or reuse existing fields) to carry `location` and `nextDate` for real open courses.
- Update `trainingOfferings` in `src/data/portal-data.ts` with the three real courses; mark them `requestable`.
- Keep `compatibleMachineIds` empty where no owned-equipment mapping applies, so the courses always show as catalogue examples.
- Update `src/features/training/training.tsx` panels to surface location and next date, keeping the current panel styling.
- Add accessible filter controls for topic and location, plus date sorting controls for upcoming and latest courses.
- Keep filtering and sorting client-side because the course data is static prototype content.
- Data is static prototype content copied from the public page; it is not a live feed.

## Deliverables

- Updated `trainingOfferings` (and, if needed, `TrainingRecord`) in `src/data/portal-data.ts`.
- Updated panels in `src/features/training/training.tsx`.
- Topic, date, and location filter/sort controls in `src/features/training/training.tsx`.

## Acceptance criteria

- [ ] The Training page displays the three real open courses as selectable panels.
- [ ] Each panel shows title, audience, format, location, and next date.
- [ ] Users can filter trainings by topic.
- [ ] Users can filter trainings by location.
- [ ] Users can sort trainings by date, including upcoming and latest first.
- [ ] The existing panel styling/interaction is preserved.
- [ ] No new subpage or route is added.
- [ ] Content is clearly static prototype data sourced from the public page.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes.

## MVP boundary

Training remains an extension beyond the original MVP scope. The open courses are static examples; external enrolment, payment, live scheduling, and learning-platform integration are not implemented.
