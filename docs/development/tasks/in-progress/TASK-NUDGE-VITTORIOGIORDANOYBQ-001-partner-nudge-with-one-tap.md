---
id: TASK-NUDGE-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: nudges
severity: Low
opened: 2026-10-14
done: null
next: Implemented (one-tap card with preset messages and the recent list on the hub, bell on list items, Realtime, push through the nudges webhook); pending the device delivery check once push is configured.
related: [PLAN-VITTORIOGIORDANOYBQ-001, TASK-PUSH-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Partner nudge with one tap

## Task Description

M2 / Fase 2.7. A one-tap, playful reminder to the partner ("Ti ricordo io 💛") attached to a
task or free-standing. `nudges` exists since M0; the plan routes delivery through the
`send-push` Edge Function (Fase 1.4), which is not built yet.

Impact: it is the feature that makes push worth having — and it is useless without it.

## Desired Outcome

- A nudge button on a task (`ListView`) and a free-standing one in the "Noi" hub, with a
  short preset message.
- The nudge is delivered as a push notification when push exists; until then it shows in an
  in-app "promemoria recenti" list on the hub (fallback), so the record is not dead weight.
- `npm run build` + `npm run lint` green; delivery verified with the partner's device.

## Proposed Implementation

- `app/src/features/nudges/useNudges.ts` (NEW) — insert nudge (from_user = me, to_user =
  partner), recent list, Realtime.
- Button in `app/src/features/lists/ListView.tsx` and a card on the hub.
- Push wiring lands with TASK-PUSH-VITTORIOGIORDANOYBQ-001 (`send-push` webhook on insert).

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `nudges`.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — `nudges_*` policies.
- `supabase/migrations/20261014133040_nido_realtime.sql` — `nudges` is not published yet
  (add it when implementing, if the in-app list needs Realtime).

## Verification Procedure

- Insert a nudge on one side → the partner sees the in-app reminder (and the push once the
  transport exists).
- `npm run build` + `npm run lint`.

## Notes

- Preset messages keep it one-tap; free text is optional.
- The RLS is couple-wide for select and `from_user = auth.uid()` for insert; no update/delete
  policies (nudges are immutable).

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; one-tap nudge riding the push channel.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `useNudges` (immutable inserts, recent list, Realtime — `nudges` published with TASK-PUSH), `NudgeCard` on the hub (preset message picked at random, "Ti ricordo io 💛", recent list with sender and time) and a bell button on open list items that sends `Ricordati: {titolo}` with `task_id`; the hub's feature entry became the inline card. `npm run build` + `npm run lint` green; the push delivery is the `send-push` webhook's job.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; one-tap nudge riding the push channel.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
