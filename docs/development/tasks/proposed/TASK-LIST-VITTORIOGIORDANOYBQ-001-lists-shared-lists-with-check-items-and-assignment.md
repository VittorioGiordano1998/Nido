---
id: TASK-LIST-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: lists
severity: High
opened: 2026-10-14
done: null
next: Proposed; independent of the calendar, ready to pick up.
related: [PLAN-VITTORIOGIORDANOYBQ-001, TASK-HOME-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Lists: shared lists with check items and assignment

## Task Description

M1 / Fase 1.2. Shared lists are the everyday core of the app (groceries, films, packing for
a trip): multiple lists per couple, items checked as "done by" one partner, the other sees it
live. `task_lists` and `tasks` already exist with RLS and realtime; the page is a placeholder.

Impact: the home summary (Fase 1.5) shows open tasks; the weekly plan (Fase 2.4) reuses the
same tables.

## Desired Outcome

- `/lists`: the couple's lists with an open-item count; create, rename, delete.
- `/lists/:id`: items with check/uncheck (records `done`, `done_by`, `done_at`), add, delete,
  optional assignment to one of the two partners.
- Partner changes arrive without a manual refresh (Realtime on `task_lists` and `tasks`).
- `npm run build` + `npm run lint` green; flows verified with two browser profiles.

## Proposed Implementation

- `app/src/features/lists/useLists.ts` (NEW) — state layer: lists + items, CRUD, Realtime
  subscription for both tables filtered by `couple_id`, row ⇄ model mapping.
- `app/src/features/lists/ListsPage.tsx` (rewrite) — index with counts and "new list".
- `app/src/features/lists/ListView.tsx` (NEW) — detail: item rows with checkbox, assignee
  chip, add field; delete list.
- `app/src/app/router.tsx` — add `/lists/:id`.
- `app/src/ui/icons.tsx` — `PlusIcon`, `TrashIcon` if missing.
- Home's "Attività aperte" section is wired in TASK-HOME-VITTORIOGIORDANOYBQ-001.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `task_lists`, `tasks` DDL.
- `app/src/features/coupling/CoupleProvider.tsx` — couple id, members, fetch patterns.
- `app/src/features/calendar/useEvents.ts` — the sibling state-layer pattern (whichever lands
  first sets the shape).

## Verification Procedure

- Two browser profiles: create a list, add items; check an item on one side → the other sees
  it checked, with the right `done_by`, without refresh; delete a list on one side → gone on
  the other.
- `cd app && npm run build` and `npm run lint`.
- RLS probe: items of a couple are not readable with another couple's token.

## Notes

- `position` int keeps append order for now; drag reorder is deferred (list the fields,
  don't build the interaction).
- `tasks.due_date` and `tasks.note` stay out of the MVP editor; they are used from Fase 2.
- Assignment is optional (null = anyone).

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
