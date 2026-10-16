---
id: TASK-CAL-VITTORIOGIORDANOYBQ-004
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: calendar
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented; owner step: paste apply-event-reminders.sql, then a scheduling check."
related: [TASK-CAL-VITTORIOGIORDANOYBQ-003]
superseded_by: null
---

# Task: Calendar: per-event custom reminder

## Task Description

Every reminder is 15 minutes before (9:00 for all-day): no way to be warned the day before a trip, or to silence a recurring standup. Owner request (2026-10-16): a per-event custom lead time.

## Desired Outcome

- Event editor: «Promemoria» select — Come sempre (15 min / 9:00), Nessuno, 15 minuti, 30 minuti, 1 ora, 2 ore, 1 giorno prima (for all-day the lead counts back from 9:00).
- The choice applies to local notifications, server push and email alike (same materialized instants).
- "Nessuno" means no local notification and no `push_reminders` row for that event.

## Proposed Implementation

- Migration `20261016230000_nido_event_reminders.sql` (+ `apply-event-reminders.sql`, `apply-all.sql`): `events.remind_minutes int` (null = default, 0 = none, up to 10080) with a check constraint.
- `useEvents`: column mapping + input field; `EventEditor`: the select.
- `reminders.ts`: `reminderAtMs` uses `event.remindMinutes` (0 → skip; null → current defaults); materialization filters out none.

## Relevant Files

- `app/src/features/calendar/reminders.ts`, `EventEditor.tsx`, `useEvents.ts`.
- `supabase/migrations/20261015230000_nido_push_reminders.sql` — the pipeline affected.

## Verification Procedure

- Set "1 giorno prima" on a timed and an all-day event → local notification schedule and `push_reminders` rows at the expected instants; "Nessuno" → nothing anywhere; default unchanged.
- `npm run build` + `npm run lint` + `records check` green.

## Notes

- Owner step: paste `apply-event-reminders.sql`. Existing rows keep the default (null).

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261016230000_nido_event_reminders.sql` (+ `apply-event-reminders.sql`, `apply-all.sql`) with `events.remind_minutes` (null default, 0 none, ≤ 10080); `useEvents` carries the column; `EventEditor` gained the «Promemoria» select over `REMINDER_OPTIONS`; `reminderAtMs` returns null for muted events and counts the custom lead back from 9:00 for all-day; local timers and the `push_reminders` materialization skip muted events (email follows).

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
