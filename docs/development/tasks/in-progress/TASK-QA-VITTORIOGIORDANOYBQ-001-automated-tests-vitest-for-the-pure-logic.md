---
id: TASK-QA-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Test
status: In Progress
area: automated tests
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented; runs locally and in the pipeline on the next push."
related: [TASK-CI-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Automated tests: vitest for the pure logic

## Task Description

The project has zero automated tests: the CI only lints, and every regression in the pure logic (recurrences, dates, streaks, the daily-question pick, framing) can only be caught by hand. Owner request (2026-10-16): cover the pure logic with Vitest.

## Desired Outcome

- Vitest configured in `app/` with `npm run test` green; tests cover: `expandOccurrences`/`parseRecurrence`/`serializeRecurrence` (daily/weekly/monthly clamping, UNTIL/COUNT, windows, ordering), `core/dates` (date keys, `daysSince`, `monthCells`), the streak helper shared by question and mood, the daily-question pick (hash determinism + range), `clampFraming`, `reminderAtMs` (default, custom lead, none).
- No network, no Supabase calls: tests import only pure modules.

## Proposed Implementation

- `app/package.json`: devDependency `vitest` + script `"test": "vitest run"`.
- New pure modules to make the logic testable without React/Supabase imports: `core/streaks.ts` (used by `useDailyQuestion` and `useMoods`), `features/question/pick.ts` (`hashString` + question index, used by `useDailyQuestion`).
- `app/tests/*.test.ts`: recurrence, dates, streaks, question pick, framing, calendar reminders; tests build their own fixtures (no fixtures from prod data).

## Relevant Files

- `app/src/features/calendar/recurrence.ts`, `app/src/features/calendar/reminders.ts`, `app/src/core/dates.ts` — the logic under test.
- `app/src/features/lists/photos.ts` — `clampFraming`.
- `app/src/features/question/useDailyQuestion.ts`, `app/src/features/mood/useMoods.ts` — the streak/pick extraction points.

## Verification Procedure

- `cd app && npm run test` green, also from a clean checkout (no `.env.local` needed).
- A deliberately broken expectation fails the run (spot check once).

## Notes

- Pure logic only: no component tests, no jsdom, no snapshots.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: vitest 5 + `npm run test`; new pure modules `core/streaks.ts` (shared by the question and mood streaks) and `features/question/pick.ts` (FNV pick), both used by the hooks; `app/tests/` covers date keys/month grid (DST-safe), recurrence (monthly clamp, UNTIL/COUNT, windows, ordering), streaks, question pick, framing and reminders (default/custom/none) — 27 tests green; tests stay outside `tsconfig.app` so the build is untouched.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
