---
id: TASK-HOME-VITTORIOGIORDANOYBQ-003
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: home
severity: Medium
opened: 2026-11-11
done: 2026-11-11
next: null
related: []
superseded_by: null
---

# Task: Home: countdown, week strip and on this day

## Task Description

Owner request (2026-11-11): the Home is a plain stack of lists. Make it a useful glance at the day of the couple.

## Desired Outcome

- A time-aware greeting.
- A "next moment" card with a days countdown to the next event, preferring birthdays and anniversaries.
- A seven-day strip with event dots; tapping a day opens the calendar on it.
- An "on this day" card fed by the memories journal.
- From `lg` the Home is a two-column dashboard.

## Proposed Implementation

- `app/src/core/dates.ts`: pure `daysUntil` helper, with tests.
- `app/src/features/memories/onThisDay.ts`: the computation extracted from `MemoriesPage.tsx`, with tests, reused by both pages.
- `app/src/features/home/`: `NextMomentCard.tsx`, `WeekStrip.tsx`, `OnThisDayCard.tsx`, updated `HomePage.tsx`.
- `app/src/features/calendar/CalendarPage.tsx`: honor a day passed through the router state.

## Relevant Files

- `app/src/features/home/HomePage.tsx`.
- `app/src/features/calendar/useEvents.ts`, `recurrence.ts`.
- `app/src/features/memories/MemoriesPage.tsx`.

## Verification Procedure

- `cd app && npm run build && npm run lint && npm test` (new tests for `daysUntil` and `onThisDay`).
- Browser: countdown text, week strip navigation, on-this-day card with and without matching memories.

## Notes

- Views read data only through the existing hooks.

## Touch History

- 2026-11-11 — VITTORIOGIORDANOYBQ — created
- 2026-11-11 — status Proposed → In Progress
- 2026-11-11 — status In Progress → Done

## Resolution

- `app/src/core/dates.ts`: `daysUntil`, `relativeDayLabel`, `weekDays`, `greetingFor` (pure, tested).
- `app/src/features/home/`: `NextMomentCard` + `nextMoment.ts` (an occasion within 30 days wins over the next plain event), `WeekStrip` (seven days, a dot per event, a tap opens the calendar on that day), `OnThisDayCard`; `HomePage` is a two-column dashboard from `lg`, with a time-aware greeting.
- `app/src/features/memories/onThisDay.ts`: the computation extracted from `MemoriesPage.tsx` and shared with Home.
- `CalendarPage` and `NotesPage` honor a day / a note passed through the router state.

Verified on 2026-11-11 with `npm run build`, `npm run lint` (warnings only, none new) and `npm test` (10 files, 60 tests), plus a Playwright pass at 390x844 and 1440x900 in light and dark. The browser pass ran against a simulated backend (requests intercepted in the browser, invented data) because `app/.env.local` was not available on the machine.

Remaining limitation: not yet checked against the real Supabase project (Realtime delivery, real photos, real account). Checked in the browser: countdown card, week strip navigation to the chosen day, on-this-day card.
