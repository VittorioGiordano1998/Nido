---
id: TASK-PUSH-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: push
severity: Medium
opened: 2026-10-14
done: null
next: Proposed; needs the owner's decision on the mechanism (Web Push VAPID vs FCM) before it can be claimed.
related: [PLAN-VITTORIOGIORDANOYBQ-001, TASK-CAL-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: Push notifications: partner changes

## Task Description

M1 / Fase 1.4. Base push notifications for relevant partner changes ("Giulia ha aggiunto
'Latte' alla spesa", the `nudges` feature in Fase 2.7). `push_tokens` exists in the schema;
nothing subscribes, nothing sends. The mechanism itself is an open decision (PLAN-… §Decisions
9): **Web Push (VAPID)** — no Firebase account, works in Chromium and in installed PWAs on
iOS 16.4+ — versus **FCM** (needs a Firebase project; the original Flutter plan).

Impact: without push, the app only speaks while it is open; Fase 2's nudges feature depends
on this transport.

## Desired Outcome

- Profile offers a notification switch; subscribing stores the endpoint/token in
  `push_tokens` (upsert, `platform = 'web'` for Web Push).
- An Edge Function (`send-push`) delivers a notification to the partner's subscriptions on
  relevant inserts — at least `nudges`; events/tasks are candidates once the payloads are
  shaped.
- Tapping the notification opens the app on the right page.
- `npm run build` + `npm run lint` green; delivery verified on the owner's phone/browser.
- Owner actions listed explicitly: VAPID key generation (or Firebase project), Edge Function
  deploy (`supabase functions deploy`), database webhook.

## Proposed Implementation

- `app/public/sw.js` (NEW) — service worker: `push` and `notificationclick` handlers only.
- `app/src/features/settings/push.ts` (NEW) — permission, `PushManager.subscribe`,
  `push_tokens` upsert/delete; called from the profile switch.
- `supabase/functions/send-push/index.ts` (NEW) — Deno: read the row's couple/partner,
  fan out to `push_tokens`, send with Web Push (VAPID).
- `docs/legal/LEGAL-NOTES.md` — record the web-push library choice.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `push_tokens`,
  `nudges` (Fase 2.7) as the first trigger.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — `push_tokens_*` policies.
- `app/vite.config.ts`, `app/vercel.json` — service worker path and headers if needed.
- `README.md` — the new deploy steps (function + secrets).

## Verification Procedure

- Subscribe on a real browser (`chrome://serviceworker-internals` sanity check) → a row in
  `push_tokens`.
- Insert a `nudges` row for the partner → notification arrives; tap → the app opens.
- `cd app && npm run build && npm run lint`; `supabase functions serve send-push` locally for
  a dry payload.

## Notes

- iOS Safari requires the PWA to be installed (Add to Home Screen); acceptable for private
  use, to state in the README.
- VAPID private key and subject live in Supabase secrets, never in the app.
- Decide the mechanism first; only then claim this task. If FCM wins, the client part uses
  Firebase Messaging and `platform = 'web'` still fits the table.

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
