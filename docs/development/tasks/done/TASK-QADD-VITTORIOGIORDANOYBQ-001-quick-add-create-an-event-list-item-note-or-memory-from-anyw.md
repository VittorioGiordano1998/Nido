---
id: TASK-QADD-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: quick add
severity: Medium
opened: 2026-11-11
done: 2026-11-11
next: null
related: []
superseded_by: null
---

# Task: Quick add: create an event, list item, note or memory from anywhere

## Task Description

Owner request (2026-11-11): creating something means first navigating to its section. Add a quick-add entry point reachable from every page.

## Desired Outcome

- A floating "+" button above the bottom navigation on phones and a sidebar button on desktop.
- A sheet offers event, list item, note and memory, filtered by the enabled sections.
- Each choice reuses the existing editor and hook; a confirmation toast offers to open the section of the created item.

## Proposed Implementation

- `app/src/features/quickadd/QuickAdd.tsx` (lazy-loaded sheet and per-kind wrappers), `QuickTaskForm.tsx` (list picker and title).
- `app/src/app/AppShell.tsx`: the entry points.
- Reuses `useEvents`, `useNotes`, `useMemories`, `useLists` and `EventEditor`, `NoteEditor`, `MemoryEditor`.

## Relevant Files

- `app/src/features/notes/NotesPage.tsx` — how a page drives its editor.
- `app/src/features/calendar/CalendarPage.tsx`, `app/src/features/memories/MemoriesPage.tsx`.

## Verification Procedure

- `cd app && npm run build && npm run lint && npm test`.
- Browser: create one item of each kind from Home and check it appears in its section.

## Notes

- Open pages refresh through the realtime channels the hooks already own.

## Touch History

- 2026-11-11 — VITTORIOGIORDANOYBQ — created
- 2026-11-11 — status Proposed → In Progress
- 2026-11-11 — status In Progress → Done

## Resolution

- `app/src/features/quickadd/QuickAdd.tsx` (lazy-loaded): a chooser for event, list item, note and memory, filtered by the enabled sections; each choice mounts the section hook and its existing editor (`EventEditor`, `NoteEditor`, `MemoryEditor`), plus a small list-item form.
- `AppShell`: the "+" in the middle of the phone bottom bar and the "Aggiungi" button in the desktop sidebar; on success a toast with an "Apri" action.
- `app/src/core/resync.ts`: `requestAppResync()`, called after a quick add so the page underneath refreshes at once instead of waiting for its Realtime event.

Verified on 2026-11-11 with `npm run build`, `npm run lint` (warnings only, none new) and `npm test` (10 files, 60 tests), plus a Playwright pass at 390x844 and 1440x900 in light and dark. The browser pass ran against a simulated backend (requests intercepted in the browser, invented data) because `app/.env.local` was not available on the machine.

Remaining limitation: not yet checked against the real Supabase project (Realtime delivery, real photos, real account). Checked in the browser: a note and a list item created from the notes page appear immediately; "Apri" opens the list. The memory flow (photo upload) was not exercised.
