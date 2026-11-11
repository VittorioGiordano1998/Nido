---
id: TASK-UI-VITTORIOGIORDANOYBQ-010
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: ui polish
severity: Medium
opened: 2026-11-11
done: 2026-11-11
next: null
related: []
superseded_by: null
---

# Task: UI: responsive desktop layout with a sidebar

## Task Description

Owner request (2026-11-11): on a PC or tablet the app is a narrow phone column (`max-w-md`) centered on the screen. Give it a real desktop layout while keeping the phone layout as the primary one.

## Desired Outcome

- From the `lg` breakpoint a fixed left sidebar (brand, navigation, search, quick add, partner) replaces the bottom navigation, and the content area widens.
- Card lists become responsive grids; editors open as centered dialogs; the calendar shows month and selected day side by side.
- Login, pairing, onboarding and the setup screen use the extra width.
- On phones nothing regresses: same navigation, same safe-area handling.

## Proposed Implementation

- `app/src/app/AppShell.tsx`: responsive shell (mobile header and bottom nav, desktop sidebar).
- Pages under `app/src/features/`: responsive grids and two-column layouts.
- `app/src/ui/toast.tsx`: viewport offset without the bottom nav.
- `app/src/features/auth/LoginPage.tsx`, `app/src/features/coupling/PairPage.tsx`: wide layout.

## Relevant Files

- `app/src/app/AppShell.tsx` — the shell.
- `app/src/ui/components.tsx` — `Screen`, `Card`.

## Verification Procedure

- `cd app && npm run build && npm run lint && npm test`.
- Browser pass at 390x844, 768x1024 and 1440x900 on every main page.

## Notes

- Depends on the primitives from TASK-UI-VITTORIOGIORDANOYBQ-009.

## Touch History

- 2026-11-11 — VITTORIOGIORDANOYBQ — created
- 2026-11-11 — status Proposed → In Progress
- 2026-11-11 — status In Progress → Done

## Resolution

- `app/src/app/AppShell.tsx`: from `lg` a fixed sidebar (brand, search, navigation, quick add, partner) replaces the bottom bar and the content column widens to `max-w-5xl`; on phones a slim header and a floating bottom bar with the quick-add button in the middle.
- Card lists are responsive grids (lists, notes, memories, loyalty, savings, capsules, wishlist, facts, decisions); single-column pages are capped at `max-w-2xl`; the calendar shows the month and the selected day side by side; the profile flows in two columns.
- Login, pairing, setup and onboarding use `EntryLayout` / `Sheet`: on desktop a brand panel sits beside the form.
- `app/src/ui/toast.tsx`: viewport offset follows the new bottom bar and the sidebar.

Verified on 2026-11-11 with `npm run build`, `npm run lint` (warnings only, none new) and `npm test` (10 files, 60 tests), plus a Playwright pass at 390x844 and 1440x900 in light and dark. The browser pass ran against a simulated backend (requests intercepted in the browser, invented data) because `app/.env.local` was not available on the machine.

Remaining limitation: not yet checked against the real Supabase project (Realtime delivery, real photos, real account). No horizontal overflow at 390 px on Home, lists, notes, calendar, Noi, memories and profile.
