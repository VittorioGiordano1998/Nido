---
id: TASK-RECAP-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: yearly recap
severity: Low
opened: 2026-10-15
done: null
next: Proposed; ready to claim (Fase 4.3); cycle data stays out unless explicitly opted in.
related: [PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002, TASK-CYC-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Yearly recap

## Task Description

M4 / Fase 4.3. A year-in-review: counts and moments drawn from the couple's own data (events, answers, capsules, lists, notes).

## Desired Outcome

- Slides computed client-side from existing tables, couple-scoped (e.g. events together, questions answered, capsules opened, lists cleared).
- Shareable as an image or text; a friendly empty state for a young couple.
- `npm run build` + `npm run lint` green.

## Proposed Implementation

- `app/src/features/recap/**` reading through the existing hooks; a slides view; no new tables.

## Relevant Files

- The feature tables in `supabase/migrations/20261014133039_nido_initial_schema.sql`.
- `app/src/features/home/` — the summary patterns.

## Verification Procedure

- A seeded scratch couple sees correct counts for the chosen year; a fresh couple sees the empty state.

## Notes

- Cycle data stays out unless the owner opts in explicitly (TASK-CYC-VITTORIOGIORDANOYBQ-001 consent).

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
