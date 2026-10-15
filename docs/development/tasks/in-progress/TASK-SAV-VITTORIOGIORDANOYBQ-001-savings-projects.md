---
id: TASK-SAV-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: savings
severity: Medium
opened: 2026-10-15
done: null
next: Proposed; ready to claim (Fase 3.4).
related: [PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: Savings projects

## Task Description

M3 / Fase 3.4. `savings_projects` exists since M0 (goal, amount, deadline) with no UI: a couple's shared saving goals with a progress bar.

## Desired Outcome

- Projects list plus editor (name, target amount with a currency label, deadline) and a progress bar fed by a simple current amount (keep it simple first; contributions can follow).
- Realtime between partners; `npm run build` + `npm run lint` green.

## Proposed Implementation

- `app/src/features/savings/useSavings.ts` plus pages, following the lists/notes patterns; link from the Noi hub.
- Migration only if a contributions table is wanted later; no currency conversion (same as wishlist).

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `savings_projects`.
- `app/src/features/lists/` — the CRUD pattern to follow.

## Verification Procedure

- Two profiles: create, update the amount, progress reflects; Realtime sync visible; RLS probe couple-scoped.
- `cd app && npm run build && npm run lint`.

## Notes

- Amounts are plain numbers with a currency label; no conversion operations.

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
