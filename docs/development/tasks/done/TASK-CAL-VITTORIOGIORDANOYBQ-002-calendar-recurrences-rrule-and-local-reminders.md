---
id: TASK-CAL-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: calendar
severity: Medium
opened: 2026-10-14
done: 2026-10-15
next: null
related: [PLAN-VITTORIOGIORDANOYBQ-001, TASK-CAL-VITTORIOGIORDANOYBQ-001, TASK-PUSH-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Calendar: recurrences (RRULE) and local reminders

## Task Description

M1 / Fase 1.1 follow-up, split from TASK-CAL-VITTORIOGIORDANOYBQ-001 so the calendar core
ships first. `events.rrule` (iCal text) has been in the schema since M0 and the editor never
fills it; nothing expands recurrences, and no reminder ever fires. The original feature note
is "Eventi, tutto il giorno, ricorrenze (RRULE), promemoria locali, visibilità coppia/privato".

Impact: anniversaries and weekly rituals are the calendar's most natural content; without
recurrences they have to be re-entered by hand.

## Desired Outcome

- The event editor can set a recurrence: daily / weekly / monthly, interval, until-or-count.
- Month grid, day agenda and home summary expand recurrences into occurrences (the stored
  row stays a single `events` row with `rrule`).
- Local reminders fire for upcoming events while the app is open (Notification API); the
  profile offers the permission switch; all-day events remind at a chosen default hour.
- `npm run build` + `npm run lint` green; recurrence math covered by a small test or a
  documented manual check.

## Proposed Implementation

- `app/src/features/calendar/recurrence.ts` (NEW) — parse/serialize the RRULE subset and
  expand occurrences for a date window; pure functions.
- `app/src/features/calendar/useEvents.ts` — feed the views the expanded occurrences.
- `app/src/features/calendar/reminders.ts` (NEW) — schedule in-app notifications with
  `setTimeout`/`Notification`; no service worker here (delivery while the app is closed is
  TASK-PUSH-VITTORIOGIORDANOYBQ-001 territory).
- `app/src/features/calendar/EventEditor.tsx` — recurrence fields.
- `app/src/features/profile/ProfilePage.tsx` — notification permission switch.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `events.rrule`.
- `app/src/core/dates.ts`, `app/src/features/calendar/*` — from CAL-001.

## Verification Procedure

- Create a weekly event and check it lands on the right days across month boundaries; monthly
  on the 31st behaves month-by-month; an `UNTIL` date stops it.
- Reminder: with the app open, a Notification fires at the right minute; all-day events use
  the default hour.
- `cd app && npm run build && npm run lint`.

## Notes

- Decision to take when claiming: a hand-rolled RRULE subset (no dependency) versus the
  `rrule` npm package (MIT — needs a LEGAL-NOTES entry like the React Bits components).
- The web platform cannot schedule a local notification while the browser is closed; that
  gap closes with push (TASK-PUSH-VITTORIOGIORDANOYBQ-001).

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created (split from TASK-CAL-VITTORIOGIORDANOYBQ-001)
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; decision taken: hand-rolled RRULE subset (DAILY/WEEKLY/MONTHLY/YEARLY + INTERVAL/UNTIL/COUNT), no dependency.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `recurrence.ts` (subset parser/serializer, DST-safe wall-clock expansion, documented monthly clamp, fast-forward) + `app/scripts/check-recurrence.ts` (`npm run check:recurrence`, all assertions pass); occurrences wired into CalendarPage, HomePage and `useUpcomingEvents`; editor recurrence fields (frequency, interval, until/count) with a missing `Select` added to the shared components; `reminders.ts` fires a Notification 15 minutes before (9:00 for all-day) while the app is open, with `NotificationsCard` in Profilo and `remindersEnabled` in SettingsProvider; `rrule` added to `useEvents`. `npm run build` + `npm run lint` green.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; decision taken: hand-rolled RRULE subset (DAILY/WEEKLY/MONTHLY/YEARLY + INTERVAL/UNTIL/COUNT), no dependency.
- 2026-10-15 — VITTORIOGIORDANOYBQ — Owner verification passed on the live app (two-account pass, 2026-10-15); closed in the phase close-out.

## Resolution

Implemented: hand-rolled RRULE subset (FREQ/INTERVAL/UNTIL/COUNT, monthly clamp documented) with the runnable `npm run check:recurrence` (all assertions pass), occurrence expansion in the month grid, day agenda and Home, editor recurrence fields, and in-app reminders via the Notification API (15 minutes before; 9:00 for all-day) with the Profilo switch and the `remindersEnabled` device preference. Owner two-account pass on 2026-10-15. Limitation: notifications fire only while the app is open — delivery with the app closed is push territory (TASK-PUSH-VITTORIOGIORDANOYBQ-001).
