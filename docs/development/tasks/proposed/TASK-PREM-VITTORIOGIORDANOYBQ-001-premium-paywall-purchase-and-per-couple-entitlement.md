---
id: TASK-PREM-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: premium
severity: High
opened: 2026-10-15
done: null
next: Blocked on the payments decision (RevenueCat vs native IAP, PLAN-VITTORIOGIORDANOYBQ-002 decision 2); decide via ADR, then claim.
related: [PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002, TASK-PACK-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Premium: paywall, purchase and per-couple entitlement

## Task Description

M3 / Fase 3.3. One subscription = premium for the two partners. The mechanism is an open decision (plan decision 2; PLAN-VITTORIOGIORDANOYBQ-001 §Risks: RevenueCat vs native IAP, decided when the packaged app and premium land): the web app cannot sell native IAP, so the decision must cover web billing now and the stores later.

## Desired Outcome

- An ADR first (payments path), then: a paywall on the premium sections, purchase and restore flows (sandbox verified), entitlement stored per couple and read on load by the app; one partner buying unlocks both.
- `supabase/functions/revenuecat-webhook` (only if RevenueCat wins) keeps the entitlement in sync; secrets documented in the README.
- `npm run build` + `npm run lint` green.

## Proposed Implementation

- ADR (payments) before any provider code; then `couples.premium_*` columns (migration + apply script), `app/src/features/premium/useEntitlement.ts`, and a paywall component.
- Entitlement is re-checked server-side on load; no client-only enforcement.
- Keys and webhook secrets via environment/Supabase secrets, never literals (RULES §External configuration).

## Relevant Files

- PLAN-001 §Edge Functions, §Risks.
- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `couples`.
- `README.md` — deploy and secrets.

## Verification Procedure

- Sandbox purchase on one account unlocks both; restore works after reinstall; webhook replayed twice stays idempotent.
- Expired/cancelled entitlement degrades to free sections cleanly.
- `cd app && npm run build && npm run lint`.

## Notes

- Decision first; do not hard-code a provider before the ADR.
- The same answer feeds TASK-PACK-VITTORIOGIORDANOYBQ-001 (store payments).

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
