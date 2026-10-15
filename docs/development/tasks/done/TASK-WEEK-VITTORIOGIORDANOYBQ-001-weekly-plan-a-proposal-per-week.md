---
id: TASK-WEEK-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: weekly plan
severity: Low
opened: 2026-10-14
done: 2026-10-15
next: null
related: [PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Weekly plan: a proposal per week

## Task Description

M2 / Fase 2.4. Once a week one partner proposes something to do together; the other accepts,
declines or replaces it with an alternative. `week_plans` exists since M0 (week_start,
proposal, status: pending | accepted | declined | replaced).

Impact: a light weekly ritual that gives the week a shared plan without a calendar editor
workflow.

## Desired Outcome

- `/us/plan`: the current week's card (proposal, status, who proposed) with accept / decline
  / alternative actions; a short history of past weeks.
- Creating a proposal when none is pending; replacing one marks the old as `replaced`.
- Realtime updates between the partners.
- `npm run build` + `npm run lint` green; two-profile check.

## Proposed Implementation

- `app/src/features/weekplan/useWeekPlan.ts` (NEW) — current + past weeks, propose,
  accept/decline, replace (update old status + insert new), Realtime.
- `app/src/features/weekplan/PlanPage.tsx` (NEW) — current week card + history list.
- `app/src/app/router.tsx` — route `/us/plan`; link from the "Noi" hub.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `week_plans`.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — `week_plans_*` policies.

## Verification Procedure

- Two profiles: propose → the partner accepts or replaces; the old proposal shows
  `replaced`; history keeps the trail.
- `npm run build` + `npm run lint`.

## Notes

- Week = Monday (local); `week_start` is the Monday date.
- "One pending per week" is enforced client-side (no DB constraint) — accepted for the MVP.

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; current-week card with accept/decline/alternative plus a short history.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented `useWeekPlan` (Monday-based `currentWeekStart`, propose, accept/decline, replace marking the old as `replaced`, Realtime) and `PlanPage` (current-week card, alternative form, replaced trail, past weeks with status chips); route `/us/plan` and the Noi hub card switched to ready. `npm run build` + `npm run lint` green.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; current-week card with accept/decline/alternative plus a short history.
- 2026-10-15 — VITTORIOGIORDANOYBQ — Owner verification passed on the live app (two-account pass, 2026-10-15); closed in the phase close-out.

## Resolution

Implemented: current-week card (proposal, status, who proposed) with accept / decline / alternative; replacing marks the old as `replaced` (shown struck-through); past weeks with status chips; Realtime. Owner two-account check on 2026-10-15.
