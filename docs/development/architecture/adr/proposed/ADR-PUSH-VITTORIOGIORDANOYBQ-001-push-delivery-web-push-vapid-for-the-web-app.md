---
id: ADR-PUSH-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
status: Proposed
date: 2026-10-15
accepted: null
deciders: [Vittorio Giordano]
superseded_by: null
---

# ADR: Push delivery: Web Push (VAPID) for the web app

## Context

The M1 push task (TASK-PUSH-VITTORIOGIORDANOYBQ-001) cannot be claimed until the transport is chosen (PLAN-VITTORIOGIORDANOYBQ-001 §Decisions 9). The app is a static PWA on Vercel with Supabase as backend; `push_tokens` exists since M0 and nothing subscribes or sends. Two candidates: Web Push with VAPID (no Firebase project; Chromium today, installed PWAs on iOS 16.4+) and FCM (Firebase account and SDK; the choice of the original Flutter plan and native-ready for the packaged app).

## Decision

Web Push (VAPID). The client subscribes through a service worker (`app/public/sw.js`), the endpoint is stored in `push_tokens` with `platform = 'web'`, and an Edge Function (`send-push`) fans out to the partner's endpoints. VAPID keys live in Supabase secrets, never in the app. FCM stays the recorded fallback for the Capacitor app if the packaged shell proves Web Push unreliable.

## Consequences (positive / negative / neutral)

- Positive: no Firebase dependency or Google project; one mechanism for browser and installed PWA; no cost; sending stays inside Supabase Edge Functions.
- Negative: iOS requires the installed PWA (Add to Home Screen) and permission prompts are stricter; Web Push has no delivery receipts; a later move to FCM changes the client subscribe path (the `push_tokens` shape already tolerates it).
- Neutral: the service worker stays tiny and cache-free until TASK-OFF-VITTORIOGIORDANOYBQ-001 decides offline caching.

## Alternatives considered

- **FCM**: rejected for the web milestone — a Firebase project, SDK weight and Google services for a two-person app; kept as the fallback for the packaged app (TASK-PACK-VITTORIOGIORDANOYBQ-001).
- **No push**: rejected — the Fase 2.7 nudges feature depends on a delivery channel; without it the app only speaks while it is open.

## Implementation

[When the ADR moves to `implemented/`: what landed (code/docs/contracts), the implementing task
and commit, and how it was verified. Leave empty while the ADR is Proposed or Accepted.]

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created
