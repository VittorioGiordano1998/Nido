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
| **0 - Close-out** | owner actions: SQL pastes (question bank, events privacy), Supabase Auth URL configuration, two-account pass; then every In-Progress task that only awaited verification closes | live app verified; those tasks moved to Done with a Resolution |
| 1 - M1 remainder | push notifications (mechanism ADR + delivery), calendar recurrences and reminders, first-run polish (onboarding slides, invite QR), question card in Home, offline evaluation, profile personalization finished (TASK-PROF-VITTORIOGIORDANOYBQ-001) | two-account flows per feature; build + lint green |
| 2 - M2 completion | question bank to 100, blind decisions, wishlist, gift radar, weekly plan, nudges | hidden data invisible until its reveal condition; two-account flows |
| 3 - M3 privacy and monetization | E2E document vault, cycle tracker with explicit consent, premium and per-couple entitlement, savings projects, loyalty cards, account deletion | vault: server never sees plaintext; cycle owner-only verified; sandbox purchase; deletion removes account and couple data |
| 4 - M4 polish and distribution | realtime canvas, home widget, yearly recap, localization IT/ES/EN/DE, Capacitor packaging and store forms | manual pass on the packaged app; i18n coverage check; store listings ready |

## Decisions

1. **Push mechanism:** Web Push (VAPID) is the recommendation — no Firebase project, works in Chromium and in installed PWAs on iOS 16.4+; recorded as ADR-PUSH-VITTORIOGIORDANOYBQ-001 (Proposed). The owner accepts or replaces it before TASK-PUSH-VITTORIOGIORDANOYBQ-001 is claimed; FCM stays a fallback for the packaged app (phase 4).
2. **Payments path:** RevenueCat versus native IAP decided via ADR when premium is claimed (phase 3); the same answer covers web billing and the packaged app.
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
- Owner actions still pending: `supabase/apply-question-bank.sql` and `supabase/apply-events-privacy.sql` pastes, Supabase Authentication URL configuration, the two-account pass on the live app.
- Not validated: everything the phase table lists as remaining (push delivery, recurrences, the M2 remainder, all of M3 and M4).
