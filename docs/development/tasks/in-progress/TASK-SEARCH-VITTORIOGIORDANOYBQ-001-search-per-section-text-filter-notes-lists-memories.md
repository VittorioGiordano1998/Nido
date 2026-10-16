---
id: TASK-SEARCH-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: search
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; a pass on real content is the remaining check."
related: []
superseded_by: null
---

# Task: Search: per-section text filter (notes, lists, memories)

## Task Description

With real use, notes, lists and memories grow past a screen or two: finding one means scrolling. Owner request (2026-10-16): a client-side text filter per section, no database work.

## Desired Outcome

- Note: a search field filters by title and body (lowercase compare).
- Liste: filter by list title or by any item title; a list matching through its items still shows.
- Ricordi: filter by caption (works together with the year chips).
- A small "nessun risultato" state; the field appears only when the section has enough content to justify it.

## Proposed Implementation

- New `ui/SearchField.tsx` (shared input with a clear button).
- `NotesPage`, `ListsPage`, `MemoriesPage`: local filter state + memoized filtering; no schema.

## Relevant Files

- `app/src/features/notes/NotesPage.tsx`, `app/src/features/lists/ListsPage.tsx`, `app/src/features/memories/MemoriesPage.tsx`.
- `app/src/ui/components.tsx` — input primitives.

## Verification Procedure

- Filter with text in title/body only, with accents, with no results; clearing restores the list; the year filter combines with the text filter.
- `npm run build` + `npm run lint` green.

## Notes

- Client-side only, on already-loaded data: no query, no index.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `ui/SearchField.tsx` (shared field with clear button); `NotesPage` filters title+body, `ListsPage` filters by list title or any item title, `MemoriesPage` filters the captions (combined with the year chips); the field appears from 4+ items and a "nessun risultato" line covers the empty filter.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
