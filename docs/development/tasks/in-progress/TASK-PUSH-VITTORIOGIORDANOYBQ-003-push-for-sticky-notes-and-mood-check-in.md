---
id: TASK-PUSH-VITTORIOGIORDANOYBQ-003
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: push
severity: Low
opened: 2026-10-16
done: null
next: "Implemented and wired live 2026-10-16 (SQL-only bridge; secret rotated, functions redeployed); the device delivery check remains."
related: [TASK-STICK-VITTORIOGIORDANOYBQ-001, TASK-MOOD-VITTORIOGIORDANOYBQ-001, TASK-PUSH-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: Push for sticky notes and mood check-in

## Task Description

Stickies and the mood check-in wait on Home with no notification (the gap noted in their tasks). The infrastructure exists (send-push + the guarded-trigger pattern of `apply-push-events.sql`). Owner request (2026-10-16): notify the partner.

## Desired Outcome

- A new sticky notifies the recipient ("{Nome} ti ha lasciato un bigliettino" + the text, opens Home).
- The partner's first check-in of the day notifies the other ("{Nome} ha fatto il check-in" + the mood label/emoji, opens Home); same-day edits do not notify again.
- Both respect the per-type preferences (TASK-NOTIF-…-002) and skip when there is no partner.

## Proposed Implementation

- Migration `20261016210000_nido_push_moments.sql` (+ `apply-push-moments.sql`, `apply-all.sql`): triggers `send_push_on_sticky` (after insert) and `send_push_on_mood` (insert only), reusing the `supabase_functions.http_request` pattern with `<project-ref>`/`<SEND_PUSH_SECRET>` placeholders.
- `supabase/functions/send-push/index.ts`: `pushSticky` and `pushMood` handlers (mood label/emoji mapping, note in the body, `/` url), plus the notification-preference check.

## Relevant Files

- `supabase/apply-push-events.sql` — the trigger pattern copied.
- `supabase/functions/send-push/index.ts` — the function extended.
- `supabase/apply-push-moments.sql` (new).

## Verification Procedure

- With the secret filled and the function deployed: a sticky on one account → push on the other; first check-in of the day → push; editing the mood → no second push; preference off → no push.
- `npm run build` + `records check` green (SQL validated against Postgres like the other push migrations).

## Notes

- Owner steps: paste `apply-push-moments.sql` (after substituting the placeholders) and redeploy `send-push`.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261016210000_nido_push_moments.sql` (+ `apply-push-moments.sql`, `apply-all.sql`) with the `send_push_on_sticky` and `send_push_on_mood` triggers (guarded placeholders, supabase_functions pattern); `send-push` gained `pushSticky` (text capped at 140) and `pushMood` (label+emoji, note, `/`), insert-only so same-day mood edits do not re-notify; both respect the per-type preferences.

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — wired live (2026-10-16): `send_push_on_sticky` and `send_push_on_mood` created via `apply-push-wiring.sql` (the `supabase_functions` route never existed); `apply-push-moments.sql` kept but marked superseded; probes green.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
