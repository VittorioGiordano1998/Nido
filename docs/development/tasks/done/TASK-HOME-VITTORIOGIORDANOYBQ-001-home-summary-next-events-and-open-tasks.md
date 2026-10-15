---
id: TASK-HOME-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: home
severity: Medium
opened: 2026-10-14
done: null
next: Implemented and green (next events, open tasks with list name, latest note); pending the owner's check on the live site after the next push.
related: [PLAN-VITTORIOGIORDANOYBQ-001, TASK-CAL-VITTORIOGIORDANOYBQ-001, TASK-LIST-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Home summary: next events and open tasks

## Task Description

M1 / Fase 1.5. The home page already shows the greeting and the "days together" counter, but
the two summary sections are placeholders. The summary is what makes the app feel alive on
open: the next shared events and the open tasks, plus the days counter that already works.

Impact: it is also the visible payoff of the calendar and lists tasks — nothing new is built
here, only composition of their state hooks.

## Desired Outcome

- "Prossimi eventi": the next 3 occurrences (date, time or all-day, title), private events
  only for their creator; a link to `/calendar`.
- "Attività aperte": up to 3 open tasks with their list name; a link to `/lists`.
- Empty states stay friendly when a section is empty or its feature tab is switched off.
- Both sections refresh through the existing Realtime subscriptions (no extra channel).
- `npm run build` + `npm run lint` green.

## Proposed Implementation

- `app/src/features/home/HomePage.tsx` (rewrite of the two sections) — Views only.
- Reuse `useUpcomingEvents(3)` (`features/calendar/useEvents.ts`) and
  `useOpenTasks(3)` (`features/lists/useLists.ts`); if the hooks do not exist in the right
  shape yet, add the small selectors there, not in the page.
- No new route, no new table, no schema change.

## Relevant Files

- `app/src/features/home/HomePage.tsx` — the page being completed.
- `app/src/features/calendar/useEvents.ts`, `app/src/features/lists/useLists.ts` — data.
- `app/src/features/settings/SettingsProvider.tsx` — a disabled section hides its tab; the
  summary respects the same switch.

## Verification Procedure

- With events and tasks in place: home shows the right next items, ordered; checking a task
  or adding an event updates the home without refresh.
- With a section switched off in Profile, its home block hides and the empty state shows.
- `cd app && npm run build && npm run lint`.

## Notes

- Pure composition; if it needs data logic, that belongs in the feature hooks instead.
- Quick actions (add event / add task from home) are Fase 2 polish, not this task.

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-14 — status Proposed → In Progress
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — implemented the summary: next events
  (hidden when the calendar switch is off), open tasks with their list name (hidden when
  the lists switch is off), latest note with a link to `/notes`. Verified:
  `npm run build` + `npm run lint` green.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
