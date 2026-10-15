---
id: PLAN-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Major
status: Agreed
date: 2026-10-15
supersedes: null
superseded_by: null
---

# Nido - remaining roadmap execution (M1 close-out to M4) (plan)

## Goal

Deliver what remains of PLAN-VITTORIOGIORDANOYBQ-001 — M1 close-out, M2 completion, M3 privacy and monetization, M4 polish and distribution — as dependency-ordered work where every item has a task record before it starts. PLAN-001 stays the product reference (features, data model, security); this plan sequences the remainder, names the decisions that block it and maps each phase to its tasks. Starting state (2026-10-15): M0 delivered and deployed; the M1 features (calendar, lists, notes, home, profile) and the first M2 slice (daily question, facts, capsules) implemented, pending the owner's two-account verification and the pending SQL pastes.

## Phases

| Phase | Delivers | Gate |
| ----- | -------- | ---- |
| 0 - Close-out | **done 2026-10-15**: owner actions taken (SQL pastes, Auth URL configuration, two-account pass), 17 In-Progress tasks closed with a Resolution | live app verified |
| 1 - M1 remainder | **done except the push setup**: recurrences + reminders, first-run polish, question card in Home, profile personalization; push and nudge implemented, waiting for the owner's VAPID deploy + delivery check; offline evaluation deferred (private test) | two-account flows; delivery check on the device for push/nudge |
| 2 - M2 completion | **done 2026-10-15**: question bank to 100, blind decisions, wishlist, gift radar, weekly plan, nudges | hidden data invisible until its reveal condition; verified |
| **3 - M3, private-test first** | account deletion (GDPR), couple-data reset (test tool), cycle tracker with explicit consent, savings projects, loyalty cards; E2E vault with its key ADR after those; premium deferred while the app stays a private test | deletion removes the account (and an emptied couple); the reset clears the couple data; cycle owner-only verified; vault: server never sees plaintext |
| 4 - M4, parked until distribution | realtime canvas, yearly recap; widget and store packaging only if the owner distributes; localization deferred (Italian only in private use) | a manual pass whenever phase 4 resumes |

## Decisions

1. **Push mechanism:** Web Push (VAPID) is the recommendation — no Firebase project, works in Chromium and in installed PWAs on iOS 16.4+; recorded as ADR-PUSH-VITTORIOGIORDANOYBQ-001 (Proposed). The owner accepts or replaces it before TASK-PUSH-VITTORIOGIORDANOYBQ-001 is claimed; FCM stays a fallback for the packaged app (phase 4).
2. **Payments path:** RevenueCat versus native IAP decided via ADR when premium is claimed; the same answer covers web billing and the packaged app. **Deferred**: the owner keeps Nido as a private test app for now, so the decision comes back with distribution.
3. **Offline:** evaluated in phase 2 on real usage (TASK-OFF-VITTORIOGIORDANOYBQ-001); no persistent cache before evidence, and the outcome is recorded (ADR if architectural).
4. **Vault keys:** WebCrypto non-extractable keys in IndexedDB, optional recovery phrase, new-device approval — ADR plus a multi-device prototype before the vault task starts (PLAN-001 §Risks).
5. **Distribution:** one codebase — the web app ships first; Capacitor packaging wraps the same app after private use, and no feature is built store-first (ADR-WEB-VITTORIOGIORDANOYBQ-001).

## Files

| File | Change |
| ---- | ------ |
| `docs/development/tasks/**` | NEW — one task per remaining feature (each phase row names its tasks) |
| `docs/development/architecture/adr/**` | NEW ADRs as decisions 1-4 are taken |
| `app/src/features/<feature>/**` | NEW features following the existing state-layer pattern |
| `supabase/functions/**` | NEW `send-push`, `gift-radar`, `delete-account`, `revenuecat-webhook` as their tasks land |
| `supabase/migrations/*.sql` | schema delta only where a feature needs it; matching `apply-*.sql` one-shot for the live project |
| `README.md` | run and deploy steps as they change |

## Tests

- `cd app && npm run build` and `npm run lint` — green on every feature.
- Two-account manual flows (two browser profiles) per feature; hidden data invisible until its reveal condition.
- RLS probes: no cross-couple rows, private events invisible to the partner, `cycle_logs` owner-only.
- `node tools/scaffold.mjs records check` — green after every record change.
- M3: sandbox purchase and account deletion end-to-end. M4: i18n coverage check and a manual pass on the packaged app.

## Validation

- State at 2026-10-15: M0 delivered and deployed (Vercel `nido_app`); M1 implemented and pending owner verification; the first M2 slice implemented and pending the question-bank paste and two-account check; TASK-PROF-VITTORIOGIORDANOYBQ-001 claimed but its implementation is not in the repository yet. Nothing else of this plan is delivered.
- Update (2026-10-15, later): the owner keeps Nido as a private test app for now; M1 and M2 are closed and verified, the last two tasks (push, nudge) wait for the VAPID deploy and a delivery check. Work order agreed: account deletion + couple-data reset first, then cycle, savings and loyalty cards, then the vault with its key ADR; premium, store packaging and localization are parked. KI-VITTORIOGIORDANOYBQ-002 (Realtime channel reuse) was found on the live app and fixed the same day.
- Owner actions still pending: `supabase/apply-question-bank.sql` and `supabase/apply-events-privacy.sql` pastes, Supabase Authentication URL configuration, the two-account pass on the live app.
- Not validated: everything the phase table lists as remaining (push delivery, recurrences, the M2 remainder, all of M3 and M4).
