---
id: TASK-CAPS-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: capsules
severity: Medium
opened: 2026-10-14
done: null
next: Implemented and green (own capsules, opened partner capsules read-only, Realtime); pending the owner's two-account check after the next push.
related: [PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Time capsules that open on a chosen day

## Task Description

M2 / Fase 2.6. A note written today that the partner cannot read until a chosen date. The
`time_capsules` table and its RLS already encode the rule (creator always; partner only once
`opens_at <= current_date`; update/delete creator only): the feature is the UI on top.

Impact: a small, emotional feature that only exists thanks to the privacy model — a good
showcase of what the couple-only database can do.

## Desired Outcome

- `/us/capsules`: my capsules with state ("si apre il 24 dicembre", "aperta il …") and the
  partner's capsules only once opened, read-only.
- Create/edit/delete own capsules (title, body, opening date); validation (title or body,
  date required).
- Partner's opened capsules appear live (Realtime on `time_capsules`).
- `npm run build` + `npm run lint` green; the partner must NOT see an unopened capsule
  through the API (RLS check with the second account).

## Proposed Implementation

- `app/src/features/capsules/useCapsules.ts` (NEW) — state layer: load, create, update,
  delete, Realtime filtered by couple.
- `app/src/features/capsules/CapsulesPage.tsx` + `CapsuleEditor.tsx` (NEW) — list with
  countdown/open state and the editor overlay.
- `app/src/app/router.tsx` — route `/us/capsules`; link from the "Noi" hub.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `time_capsules`.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — `time_capsules_*` policies.
- `app/src/features/calendar/EventEditor.tsx` — the editor overlay pattern.

## Verification Procedure

- Two profiles: create a capsule opening tomorrow → the partner does not see it; change the
  date to today → it appears (creator keeps full control).
- RLS probe: the partner's `GET /rest/v1/time_capsules` does not return the unopened row.
- `cd app && npm run build && npm run lint`.

## Notes

- `opens_at` is a date: the capsule opens at local midnight of that day.
- No notification on opening (push is TASK-PUSH-VITTORIOGIORDANOYBQ-001).

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-14 — status Proposed → In Progress
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — implemented `useCapsules` (CRUD, Realtime;
  the partner sees only opened capsules through RLS), `CapsulesPage` + `CapsuleEditor` (seal
  with an opening date, countdown, the creator keeps reading the text), route `/us/capsules`.
  Verified: `npm run build` + `npm run lint` green.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
