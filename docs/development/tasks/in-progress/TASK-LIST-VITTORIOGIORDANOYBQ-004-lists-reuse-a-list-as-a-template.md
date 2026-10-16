---
id: TASK-LIST-VITTORIOGIORDANOYBQ-004
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: lists
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; a manual reuse pass is the remaining check."
related: [TASK-LIST-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Lists: reuse a list as a template

## Task Description

Recurring lists (the weekly shopping) are rebuilt by hand: there is no way to start a new list from an existing one. Owner request (2026-10-16): "riusa questa lista".

## Desired Outcome

- From the list page a «Riusa» action opens a small sheet with the name (prefilled) and creates a new list copying the item titles, all unchecked, in order; attachments and cover are not copied.
- The new list opens immediately; both partners see it over Realtime.

## Proposed Implementation

- No schema: client-side copy through `useLists` (`reuseList(list, tasks, name)`: insert list then tasks).
- `ListView`: «Riusa» button + `ReuseListSheet` (name field, create, cancel).

## Relevant Files

- `app/src/features/lists/ListView.tsx`, `useLists.ts`.
- `app/src/features/lists/TaskAttachmentsSheet.tsx` — the sheet pattern.

## Verification Procedure

- Reuse a list with items → the copy has the same titles unchecked; the original is untouched; renaming in the sheet works; an empty list copies empty.
- `npm run build` + `npm run lint` green.

## Notes

- A template flag (marking source lists) is a possible follow-up, not needed for the recurring-shopping flow.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `useLists.reuseList` (new list + item titles copied unchecked, in order; no attachments/notes/cover) and the `ReuseListSheet` («Riusa lista» chip in the list header) with the name prefilled, a create button and a success toast navigating to the copy.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
