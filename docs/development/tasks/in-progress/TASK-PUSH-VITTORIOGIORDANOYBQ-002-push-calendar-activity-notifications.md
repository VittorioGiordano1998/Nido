---
id: TASK-PUSH-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: push
severity: Low
opened: 2026-10-15
done: null
next: "Implemented; owner steps remain: redeploy send-push, paste apply-push-events.sql (project ref + SEND_PUSH_SECRET), two-account check (partner event arrives, private silent)."
related: [TASK-PUSH-VITTORIOGIORDANOYBQ-001, TASK-CAL-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: Push: calendar activity notifications

## Task Description

Owner request (2026-10-15): today the push channel only fires for partner nudges; a calendar change by the partner is silent and you discover it only by opening the app. PLAN/PUSH already names events as the next candidate once the payloads are shaped.

Two calendar push behaviours exist, deliberately split: **activity** (this task: "Giulia ha aggiunto un evento") and **scheduled reminders** (TASK-CAL-VITTORIOGIORDANOYBQ-003: "tra 30 minuti hai il dentista", even with the app closed).

## Desired Outcome

- When one partner **creates a couple event** (insert on events with visibility = 'couple'), the other gets a push: {Nome} ha aggiunto «Titolo», with date and time in the body; tapping opens /calendar.
- **Private events never notify** (server-side check on the row, not only client-side).
- The author's own action never notifies themselves; an event without a partner produces nothing.
- Updates are **out of scope for the MVP** (too noisy: every save would ping); if wanted later they go through the same function with a quieter shape.
- send-push grows a **source discriminator** (payload from nudges or events) instead of a second function, so auth, fan-out and the 404/410 pruning stay in one place.
- npm run build + npm run lint green; two-account check (partner event arrives, private event silent).

## Proposed Implementation

- supabase/functions/send-push/index.ts — accept the webhook payload from both tables: read payload.table (or a source header set by each webhook) and shape title/body/url accordingly; keep the secret-header auth.
- SQL (paste-ready, like the nudge webhook): a second trigger on events (after insert) calling the same function URL with the same x-webhook-secret.
- No client change: the receiving side is the existing service worker.

## Relevant Files

- supabase/functions/send-push/index.ts — the function to extend.
- supabase/migrations/20261015180000_nido_push_nudges.sql — the nudge pattern to mirror.
- app/src/features/calendar/useEvents.ts — where events are written (no change expected).
- app/public/sw.js — unchanged.

## Verification Procedure

- Two accounts with push on: the partner creates a couple event -> notification within seconds; creates a private one -> nothing.
- The author creates an event -> no notification to themselves.
- cd app / npm run build / npm run lint — green (no app change expected).

## Notes

- The webhook is another paste for the owner (SQL Editor), same shape as send_push_on_nudge; the function needs a redeploy after the change.
- Delivery rides the same subscription store: devices must have push enabled (ADR-PUSH-VITTORIOGIORDANOYBQ-001).

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; implementing the send-push source discriminator, the events webhook trigger and the README steps.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: send-push accepts both webhook sources (`payload.table`), events shape a couple event as "{Nome} ha aggiunto «Titolo»" with Italian date/time, private events skipped server-side, no partner = nothing; new migration 20261015220000_nido_push_events.sql + apply-push-events.sql create the `send_push_on_event` trigger (guarded placeholders) and apply-all.sql carries them. `npm run build` + `npm run lint` green. Owner steps remain: redeploy send-push, run apply-push-events.sql with the project ref and SEND_PUSH_SECRET, then the two-account check.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
