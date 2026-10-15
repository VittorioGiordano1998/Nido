---
id: TASK-VAULT-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: vault
severity: High
opened: 2026-10-15
done: null
next: Proposed; key-management ADR and a multi-device prototype first (PLAN-VITTORIOGIORDANOYBQ-001 §Risks).
related: [PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: E2E document vault

## Task Description

M3 / Fase 3.1. Documents (IDs, contracts, papers) encrypted client-side; the server stays blind (PLAN-VITTORIOGIORDANOYBQ-001 §Security: X25519 device keys, AES-256-GCM payloads, private Storage buckets, new-device approval; web adaptation: non-extractable WebCrypto keys in IndexedDB plus an optional recovery phrase). Losing every device means losing the data — by design, stated in the UI.

## Desired Outcome

- Category index, upload, viewer and deletion; key setup on first use; a second device gets access only through an approval flow; server never receives plaintext (verified by inspecting tables and Storage).
- The key-management decision lands as an ADR first (plan decision 4), with a multi-device prototype before the UI (PLAN-001 §Risks: prototype early).
- `npm run build` + `npm run lint` green; two-account, two-device pass.

## Proposed Implementation

- `app/src/features/vault/**` — key service, upload flow, viewer; WebCrypto stays in the state/core layers, never in Views (RULES.local §Layers).
- Private Storage bucket policies; `vault_items` / `vault_keys` already exist.
- Recovery phrase design in the ADR; no server-side key escrow, ever.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `vault_items`, `vault_keys`.
- PLAN-001 §Security — the E2E design paragraph.
- `app/src/core/env.ts` — client configuration patterns.

## Verification Procedure

- Profile A uploads; profile B sees ciphertext only until approved by A; revoked device loses access on next load.
- Database and bucket inspection: only ciphertext and wrapped keys; no plaintext anywhere.
- Wrong or missing key shows a clean error, never partial content.

## Notes

- Most delicate part is new-device approval; prototype before building the UI.
- Key-loss UX must be explicit: without the recovery phrase, data is gone.

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
