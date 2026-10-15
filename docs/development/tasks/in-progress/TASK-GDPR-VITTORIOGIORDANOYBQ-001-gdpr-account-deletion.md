---
id: TASK-GDPR-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: gdpr
severity: Medium
opened: 2026-10-15
done: null
next: Proposed; required before store publication (TASK-PACK-VITTORIOGIORDANOYBQ-001 depends on it).
related: [PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002, TASK-PACK-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: GDPR: account deletion

## Task Description

PLAN-VITTORIOGIORDANOYBQ-001 §GDPR/store: an account-deletion Edge Function (account + couple data) is a store-publication requirement and good practice before private use accumulates more. Nothing exists today — signing up has no way back out.

## Desired Outcome

- `delete-account` Edge Function (service role): purges the caller's data per the schema's cascades, deletes the auth user, and handles the partner-left case without orphaning shared rows.
- In Profile: an explicit double-confirmation flow stating exactly what is deleted and what the partner keeps; README note on the function and its secret.
- Deletion verified end-to-end on a scratch account.

## Proposed Implementation

- `supabase/functions/delete-account/index.ts` (NEW); the UI card follows the profile state-layer pattern (view + provider call, RULES.local §Layers).
- No client-visible schema change if the FK cascades already cover every couple table — verify each one before coding.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — FK cascades per table.
- `app/src/features/profile/ProfilePage.tsx` — where the flow lands.
- PLAN-001 §GDPR/store.

## Verification Procedure

- Scratch couple: delete one account — their rows are gone, the partner's intact, the auth user cannot sign in again; the couple, if emptied, is cleaned.
- `cd app && npm run build && npm run lint`.

## Notes

- Scope is account deletion (not only data wipe); the store forms in TASK-PACK-VITTORIOGIORDANOYBQ-001 refer to this flow.

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
