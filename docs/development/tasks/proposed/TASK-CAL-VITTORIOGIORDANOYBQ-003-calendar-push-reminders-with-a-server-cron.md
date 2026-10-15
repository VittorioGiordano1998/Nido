---
id: TASK-CAL-VITTORIOGIORDANOYBQ-003
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: calendar
severity: Medium
opened: 2026-10-15
done: null
next: "Proposed; needs the push pipeline verified. Design: the client materializes the next occurrences, a cron sends them."
related: [TASK-CAL-VITTORIOGIORDANOYBQ-002, TASK-PUSH-VITTORIOGIORDANOYBQ-001, TASK-PUSH-VITTORIOGIORDANOYBQ-002, PLAN-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: Calendar: push reminders with a server cron

## Task Description

The with-app-closed half of the calendar reminders (owner request 2026-10-15). TASK-CAL-VITTORIOGIORDANOYBQ-002 shipped local reminders that fire **only while the app is open** — a web platform limit, and its own Resolution points here. This task delivers the real promise: "tra 30 minuti hai il dentista", arrival even with the app closed.

The design keeps the recurrence logic in one place: the **client** expands occurrences (existing recurrence.ts), the **server** only fires what has been materialized.

## Desired Outcome

- A push_reminders table: one row per occurrence (event_id, occurrence_key, fire_at, title/body snapshot, only_for uuid nullable = both partners, sent_at).
- On app open and on event changes the client materializes/refreshes the next **7 days** of reminders (same constants as the local reminders: 15 minutes before; 9:00 for all-day); re-materialization clears this couple's unsent future rows first (last write wins between the two devices, acceptable for private use).
- A **pg_cron job every 5 minutes** (pg_net, same pattern as the keep-alive migration) calls a new Edge Function send-reminders (secret header like send-push): it sends everything due to the right recipients, marks sent_at, and prunes rows older than about 30 days. Deleted events prune themselves (FK cascade on event_id).
- Private events notify **only their creator** (only_for); couple events notify both; devices need push enabled.
- If the app is never opened, no reminders beyond the materialized horizon: documented, accepted.
- npm run build + npm run lint green; two-account check (event in 20 minutes, app then closed).

## Proposed Implementation

- Migration nido_push_reminders.sql: the table + RLS (couple read, member write, sent_at system-managed) + the pg_cron/pg_net job template (secret left to the owner's paste, like the webhook scripts).
- app/src/features/calendar/reminders.ts: extend — alongside the local timers, materialize rows (upsert by event_id + occurrence_key, after deleting unsent fire_at > now() rows for the couple).
- supabase/functions/send-reminders/index.ts (NEW): due rows -> push_tokens -> Web Push; reuse the pruning lessons from send-push.
- supabase/config.toml: [functions.send-reminders] verify_jwt = false (secret header auth).

## Relevant Files

- app/src/features/calendar/recurrence.ts and reminders.ts — expansion and the local constants.
- supabase/functions/send-push/index.ts — the delivery/pruning pattern to mirror.
- supabase/migrations/20261014134705_nido_keepalive.sql — the pg_cron/pg_net pattern to follow.
- supabase/migrations/20261015180000_nido_push_nudges.sql — the push_tokens shape.

## Verification Procedure

- Create an event 20 minutes out, keep the app open a moment (materialization), then close everything: the notification arrives about 15 minutes before, on both devices.
- An all-day event fires at 9:00; a private event reaches only its creator.
- Moving an event updates the reminder (re-materialization); deleting it silences it (cascade).
- cd app / npm run build / npm run lint.

## Notes

- Owner steps at execution time: paste the apply script, deploy send-reminders, set its secret.
- DST: fire instants are computed client-side in local time (same approach as the local reminders); the cron only compares timestamptz.
- Keep the horizon (7 days) and the cadence (5 minutes) as constants in one place; revisit only with real usage.

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
