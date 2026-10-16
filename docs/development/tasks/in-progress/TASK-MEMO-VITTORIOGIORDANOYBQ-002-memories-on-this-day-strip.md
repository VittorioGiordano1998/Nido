---
id: TASK-MEMO-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: memories
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; a manual pass with a memory dated one year ago is the remaining check."
related: [TASK-MEMO-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Memories: on this day strip

## Task Description

The journal's little magic is rediscovering the past. Owner request (2026-10-16): a "un anno fa oggi" strip that resurfaces memories from the same calendar day in previous years.

## Desired Outcome

- Ricordi page: above the grid, a "Un anno fa oggi" / "N anni fa oggi" section appears only when memories exist for the same month-day in a previous year; each shows the photo, the caption and the year.
- Tapping a card opens the existing detail sheet.

## Proposed Implementation

- `MemoriesPage`: a memoized `onThisDay` selection (`takenOn` month-day equals today's, year smaller), rendered as a compact strip of memory cards before the main grid.

## Relevant Files

- `app/src/features/memories/MemoriesPage.tsx`, `MemoryCard.tsx`.
- `app/src/core/dates.ts` — the day keys.

## Verification Procedure

- With a memory dated exactly one year ago: the strip appears and opens the detail; with none: nothing renders; a memory from today does not count as "a year ago".
- `npm run build` + `npm run lint` green.

## Notes

- No schema: computed from the loaded memories.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `MemoriesPage` computes the same-calendar-day memories from earlier years and renders the "Un anno fa oggi" / "N anni fa oggi" strip (compact cards with year, opening the detail) above the grid; hidden when empty.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
