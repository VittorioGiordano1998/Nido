---
id: TASK-CAL-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: calendar
severity: High
opened: 2026-10-14
done: 2026-10-15
next: null
related: [PLAN-VITTORIOGIORDANOYBQ-001, TASK-CAL-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: Calendar: shared events with visibility and realtime

## Task Description

M1 / Fase 1.1. The calendar is the MVP's flagship: the couple shares events (appointments,
anniversaries, reminders) and each partner can keep single events to themselves. The backend
is ready from M0 — `events` table, realtime publication and (since KI-VITTORIOGIORDANOYBQ-001)
RLS that reads `visibility = 'private'` — but the app still shows the placeholder page.

Impact: the home summary (Fase 1.5) and the gift radar (Fase 2.3) both build on calendar data.

## Desired Outcome

- `app/src/features/calendar/` serves the month grid (Monday-first) with a selected-day
  agenda, plus create / edit / delete of an event: title, all-day switch, date, start/end
  time, location, description, `couple`/`private` visibility.
- Events stream in from the partner without a manual refresh (Realtime).
- Private events are filtered out of the partner's view on top of the RLS enforcement.
- Home "Prossimi eventi" lists the next events (shared only) instead of the placeholder.
- `npm run build` and `npm run lint` green; flows verified manually with two browser
  profiles.
- Out of scope, tracked in TASK-CAL-VITTORIOGIORDANOYBQ-002: RRULE recurrences and local
  reminders.

## Proposed Implementation

- `app/src/features/calendar/useEvents.ts` (NEW) — state layer: load the couple's events,
  `createEvent` / `updateEvent` / `deleteEvent`, row ⇄ model mapping, Realtime subscription
  on `events` filtered by `couple_id` (unsubscribed on unmount).
- `app/src/features/calendar/CalendarPage.tsx` (rewrite) — month grid, day agenda, month
  navigation, "Oggi", opens the editor.
- `app/src/features/calendar/EventEditor.tsx` (NEW) — form sheet: fields above, validation
  (title required, end not before start), delete action in edit mode.
- `app/src/core/dates.ts` — add the local-date helpers the grid needs (date key, month
  matrix, time formatting), kept pure.
- `app/src/app/router.tsx` — no new route (the editor lives on `/calendar`).
- `app/src/features/home/HomePage.tsx` — use `useUpcomingEvents(3)` for the section.
- `app/src/ui/icons.tsx` — add `PlusIcon`, `LockIcon`, `TrashIcon` if missing.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `events` DDL.
- `supabase/migrations/20261014161502_nido_events_privacy.sql` — visibility policies.
- `app/src/features/coupling/CoupleProvider.tsx` — couple id and data-fetch patterns.
- `app/src/features/settings/SettingsProvider.tsx` — the section switch that hides the tab.
- `app/src/ui/components.tsx`, `app/src/core/dates.ts` — shared UI and date helpers.

## Verification Procedure

- `cd app && npm run build` and `npm run lint`.
- Two browser profiles (the owner's two accounts): create a couple event → it appears for
  both, including a refresh; create a private event → the partner never sees it (and, once
  `apply-events-privacy.sql` is applied live, `GET /rest/v1/events` with the partner's token
  does not return it); edit and delete from both sides; the partner's change appears without
  a manual refresh.
- Home: next events in the right order; private ones only for their creator.

## Notes

- All-day events are stored as local midnight in `start_at` and rendered date-only; the
  couple shares one timezone in practice.
- Realtime: one channel per mount, `removeChannel`/unsubscribe on unmount (RULES.md
  §Lifetime).
- The server-side privacy guarantee needs the owner to paste
  `supabase/apply-events-privacy.sql` (KI-VITTORIOGIORDANOYBQ-001); the client filters
  regardless.
- New dependencies: none planned (hand-rolled grid and editor).

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-14 — status Proposed → In Progress
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — implemented the core: `useEvents` (load,
  create/update/delete, Realtime on `events` filtered by couple, unsubscribe on unmount),
  `CalendarPage` (Monday-first month grid, day agenda, month navigation, "Oggi", creator
  colours, private lock), `EventEditor` (title, all-day, date/times, place, notes,
  couple/private, delete), Home "Prossimi eventi" wired to `useUpcomingEvents(3)`. Shared
  helpers: `monthCells`/`toDateKey`/`toTimeInput`/formatters in `core/dates.ts`, `TextArea` in
  `ui/components.tsx`, `PlusIcon`/`LockIcon`/`TrashIcon`/chevrons/`CloseIcon` in `ui/icons.tsx`.
  Verified: `npm run build` + `npm run lint` green; live REST probe with the anon key on the
  exact column set answers 200 and `[]` (RLS holds). Pending: owner's two-account browser
  verification and the `apply-events-privacy.sql` paste for the server-side guarantee.
- 2026-10-15 — VITTORIOGIORDANOYBQ — Owner verification passed on the live app (two-account pass, 2026-10-15); closed in the phase close-out.

## Resolution

Implemented: month grid, day agenda, event editor (all-day, visibility, recurrences, occasion tag), couple/private visibility enforced by RLS (KI-VITTORIOGIORDANOYBQ-001 fixed in this milestone), Realtime. `apply-events-privacy.sql` pasted on the live project; owner two-account pass on 2026-10-15 (create/edit/delete, a private event invisible to the partner, live sync).
