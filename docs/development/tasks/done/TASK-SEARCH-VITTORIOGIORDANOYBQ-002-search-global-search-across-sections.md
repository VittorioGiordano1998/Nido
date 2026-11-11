---
id: TASK-SEARCH-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: search
severity: Medium
opened: 2026-11-11
done: 2026-11-11
next: null
related: []
superseded_by: null
---

# Task: Search: global search across sections

## Task Description

Owner request (2026-11-11): search exists only as separate per-section filters (TASK-SEARCH-VITTORIOGIORDANOYBQ-001). Add one search that looks across the whole app.

## Desired Outcome

- One overlay searches notes, lists and their items, events, memories, wishlist and the app destinations.
- Matching ignores case and accents; results are grouped by section and keyboard navigable.
- It opens from the header, the sidebar, `Ctrl/Cmd+K` and `/`.
- Selecting a result lands on the item where that is cheap (note, calendar day, list).

## Proposed Implementation

- `app/src/features/search/match.ts`: pure normalization and ranking, with tests.
- `app/src/features/search/useGlobalSearch.ts`: combines the existing hooks.
- `app/src/features/search/SearchOverlay.tsx`: lazy-loaded and mounted only while open, so no extra subscriptions at rest.
- `app/src/app/AppShell.tsx`: entry points and shortcuts.

## Relevant Files

- `app/src/ui/SearchField.tsx`.
- `app/src/features/notes/useNotes.ts`, `lists/useLists.ts`, `calendar/useEvents.ts`, `memories/useMemories.ts`, `wishlist/useWishlist.ts`.

## Verification Procedure

- `cd app && npm run build && npm run lint && npm test` (new tests for `match.ts`).
- Browser: search with and without accents, keyboard navigation, both shortcuts.

## Notes

- Client-side only: the data is already loaded by the hooks, no new query or index.

## Touch History

- 2026-11-11 — VITTORIOGIORDANOYBQ — created
- 2026-11-11 — status Proposed → In Progress
- 2026-11-11 — status In Progress → Done

## Resolution

- `app/src/features/search/match.ts`: accent- and case-insensitive matching with ranking (pure, tested).
- `useGlobalSearch.ts`: one query over notes, lists and their items, events, memories, wishlist and the app destinations, reusing the section hooks.
- `SearchOverlay.tsx` (lazy-loaded, mounted only while open): grouped results, arrow keys, Enter, Escape; opened from the phone header, the sidebar, `Ctrl/Cmd+K` and `/`.
- Landing: a note opens in its editor, an event selects its day in the calendar, a list or item opens the list.

Verified on 2026-11-11 with `npm run build`, `npm run lint` (warnings only, none new) and `npm test` (10 files, 60 tests), plus a Playwright pass at 390x844 and 1440x900 in light and dark. The browser pass ran against a simulated backend (requests intercepted in the browser, invented data) because `app/.env.local` was not available on the machine.

Remaining limitation: not yet checked against the real Supabase project (Realtime delivery, real photos, real account). Checked in the browser: `caffe` finds "Caffè in grani", `ragu` + Enter opens the matching note. The per-section filters of TASK-SEARCH-VITTORIOGIORDANOYBQ-001 are unchanged.
