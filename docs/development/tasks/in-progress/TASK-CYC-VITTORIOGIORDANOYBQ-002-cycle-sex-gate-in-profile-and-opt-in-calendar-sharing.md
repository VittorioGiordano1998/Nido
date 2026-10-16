---
id: TASK-CYC-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: cycle tracker
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented (sex gate, opt-in calendar switch with auto shares, calendar markers); owner steps: paste apply-profile-sex.sql + apply-cycle-calendar.sql, then the two-account check."
related: [TASK-CYC-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Cycle: sex gate in profile and opt-in calendar sharing

## Task Description

Owner request (2026-10-16): a male/female choice in the profile; the cycle section appears
for the female profile only; the cycle then shows in the shared calendar so both partners
see it. Today the cycle entry card sits in everyone's Profilo, and shared summaries only
land in a list inside `/cycle` — the calendar shows nothing.

Health-data rules stay binding (`PLAN-VITTORIOGIORDANOYBQ-001` §GDPR/store: explicit,
revocable, never auto-synced): the owner chose an **opt-in switch inside the diary**, not
automatic sharing. Only period dates ever become couple-visible — flow, mood, symptoms and
notes never leave `cycle_logs`.

## Desired Outcome

- `profiles.sex` (`male` | `female` | null) editable in Profilo; the "Ciclo" card shows
  unless sex is `male`. `null` keeps showing it, so rolling out never hides an existing
  diary before the profile is set.
- `/cycle` redirects a `male` profile back to Profilo; unset and female keep today's gate
  (`cycle_consent_at`).
- Opt-in switch "Mostra nel calendario" in the diary: while on, the periods computed from
  the owner's logs are published as `cycle_shares` (`source = 'auto'`, dates only) and the
  shared calendar shows them for both partners; switching off removes the auto shares.
  Manual summaries ("Riepiloghi condivisi") are untouched.
- Calendar month view marks cycle days (rose dot) and the day agenda lists "Il tuo ciclo" /
  "Ciclo di {nome}" with the period range.
- `npm run build` + `npm run lint` green.

## Proposed Implementation

- Migrations (idempotent, matching apply scripts; README list updated):
  `20261016090000_nido_profile_sex.sql` (`profiles.sex` + check),
  `20261016110000_nido_cycle_calendar_shares.sql` (`profiles.cycle_calendar_share`,
  `cycle_shares.source` default `manual`, `cycle_shares` + replica identity on the
  realtime publication).
- `app/src/features/profile/useProfile.ts` — load/save `sex`; `ProfilePage` owns the hook
  and hands the state to `ProfileCard` (select Maschio/Femmina/Non indicato) and the gate
  to `CycleCard`.
- `app/src/features/cycle/useCycle.ts` — read `sex`, read/write `cycle_calendar_share`,
  reconcile `source = 'auto'` shares (consecutive flow days, one missing day merged) when
  toggling on and after every save/delete while on.
- `app/src/features/cycle/useCycleCalendar.ts` (new) — couple-visible shares for the
  calendar + Realtime subscription (`cycle_shares` published).
- `app/src/features/calendar/CalendarPage.tsx` — rose marker per cycle day, day cards.
- `app/src/features/cycle/CyclePage.tsx` — male redirect, switch card, manual-only list.
- `app/src/core/dates.ts` — `formatDayMonthIt` helper for the range label.

## Relevant Files

- `docs/development/tasks/in-progress/TASK-CYC-VITTORIOGIORDANOYBQ-001-cycle-tracker-owner-only-log-with-explicit-consent.md` — the diary this extends.
- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `cycle_logs`, `cycle_shares` DDL.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — owner/couple policies.
- `app/src/features/cycle/**`, `app/src/features/calendar/CalendarPage.tsx`, `app/src/features/profile/**`.

## Verification Procedure

- Two-account check: set sex on both profiles → the card disappears for the male one;
  activate the diary as female, toggle "Mostra nel calendario" on, log a period → both
  calendars show the days; toggle off → the days disappear; the partner's query on
  `cycle_logs` stays empty.
- RLS probe: the partner cannot read `cycle_logs` by id; `cycle_shares` rows are visible to
  both and only the owner can write them.
- `cd app && npm run build && npm run lint`.

## Notes

- Owner steps: paste `apply-profile-sex.sql` and `apply-cycle-calendar.sql` (plus
  `apply-cycle-consent.sql` if not applied yet), then run the two-account check.
- `source = 'auto'` keeps the reconcile from clobbering manual summaries; auto shares
  render as period ranges only, never with symptoms.
- Companion record: `TASK-CYC-VITTORIOGIORDANOYBQ-001` (the diary itself).

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; implementing the profile sex gate and the opt-in calendar switch in this session.
- 2026-10-16 - status Proposed → In Progress
- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migrations `20261016090000_nido_profile_sex.sql` (`profiles.sex` + check) and `20261016110000_nido_cycle_calendar_shares.sql` (`profiles.cycle_calendar_share`, `cycle_shares.source`, Realtime + replica identity) with apply scripts and `apply-all.sql`; Profilo select Maschio/Femmina/Non indicato (`useProfile` owned by ProfilePage) gating `CycleCard` and redirecting `/cycle` for `male`; `useCycle` reconciles `source = 'auto'` shares (consecutive flow days, one missing day merged) on the switch and after every save/delete; new `useCycleCalendar` + rose markers/day cards in `CalendarPage`; switch "Mostra nel calendario" with a manual-only "Riepiloghi condivisi" list. `npm run build` + `npm run lint` green; the live project probe confirms the two apply scripts are still to paste.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
