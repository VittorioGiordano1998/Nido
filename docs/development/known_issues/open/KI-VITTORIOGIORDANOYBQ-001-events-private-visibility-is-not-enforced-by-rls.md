---
id: KI-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
status: Open
area: supabase
severity: Medium
opened: 2026-10-14
fixed: null
related: [TASK-WEB-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Known Issue: Events: 'private' visibility is not enforced by RLS

## Symptom

An event stored with `visibility = 'private'` is readable through the API by the partner. Reproduction: with two paired accounts, user A inserts an event with `visibility='private'`; user B runs `GET /rest/v1/events` and receives A's private event. Nothing in the database hides it: the column is stored but never consulted by any policy.

Impact now: none in production (no calendar UI yet, zero users). Impact at Fase 1: the calendar feature (plan §1.1) promises "visibilità coppia/privato"; a surprise or private appointment would silently leak to the partner through the API view of the client.

## Root cause

`supabase/migrations/20261014133039_nido_rls_policies.sql:163` (`events_select`, and the `update`/`delete` policies below it) only check `public.is_couple_member(couple_id)`; `events.visibility` (schema at `supabase/migrations/20261014133039_nido_initial_schema.sql:69`) is ignored. Plan §5 lists `events` with the generic couple policy, so the implementation matches the plan table — but the plan table and plan §1.1 contradict each other, so the intent must be clarified and one of the two fixed.

## Attempted fixes

[Optional: fixes tried that did not resolve the issue, and why.]

## Fix direction

Decide before the Fase 1 calendar ships. Option A (recommended, keeps the privacy promise): enforce in RLS — `select/update/delete using (public.is_couple_member(couple_id) and (visibility = 'couple' or created_by = auth.uid()))`; keep the insert check unchanged. Option B: accept soft privacy (client-side filtering only), then rename the UI concept so it does not promise privacy, and keep genuinely sensitive items in owner-only tables. Either way: a new migration altering the policies, plus a line in plan §5.

## Fix

[For fixed issues: what was changed and how it was verified.]

## Notes

Sibling tables with per-user semantics already encode their rule in RLS (`daily_answers` via `both_answered`, `decision_votes` on revealed decisions, `time_capsules` on `opens_at`, `cycle_logs` owner-only); `events` is the outlier. Discovered during the M0 live verification (14 Oct 2026), while reviewing the events policies before the two-account pairing test.
