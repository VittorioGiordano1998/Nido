---
id: TASK-UI-VITTORIOGIORDANOYBQ-006
owner: VITTORIOGIORDANOYBQ
type: null
status: Done
area: UI
severity: null
opened: 2026-10-22
done: 2026-10-22
next: null
related: []
superseded_by: null
---

# Task: Stile più accattivante

## Task Description

The visual style of Nido is clean but quiet: neutral surfaces, flat primary buttons and a
plain home hero. The request is to give it more character without breaking the existing
theme system (light/dark, four accent presets).

## Desired Outcome

Primary actions, the home hero and the accent surfaces feel warmer and more lively, in both
themes and for every accent preset. Colors still come only from the tokens in
`app/src/index.css`; no new hard-coded colors in components.

## Proposed Implementation

[Detailed implementation proposal, with list of files to create/modify/delete.]

## Relevant Files

[List of files to read in order to acquire context.]

## Verification Procedure

[Describe how the task result is verified: tests to run, commands, manual checks.]

## Notes

[Optional constraints, dependencies, references or risks.]

## Touch History

- 2026-10-22 — VITTORIOGIORDANOYBQ — created
- 2026-10-22 — status Proposed → In Progress
- 2026-10-22 — status In Progress → Done

## Resolution

- `app/src/ui/components.tsx`: the primary `Button` gets a warm accent gradient, a tinted
  shadow that grows on hover and a light press scale. Disabled state drops the gradient and
  shadow.
- `app/src/features/home/HomeHero.tsx`: the default hero gradient starts one step deeper
  (`accent-200`), a soft blurred accent glow sits in the corner, and the days counter is
  extra-bold in `accent-ink` when there is no cover photo.

Only existing tokens are used, so all four accent presets and both themes pick it up.

Verified with `npm run build` (succeeds; the existing chunk-size warning is unchanged) and
`npm test` (7 files, 32 tests pass). Not checked in a browser: visual review in light and
dark mode, with each accent preset, is still to do.
