---
id: TASK-LOY-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: loyalty cards
severity: Low
opened: 2026-10-15
done: null
next: Implemented and green (cards grid, editor with the format/tone choices, full-screen scannable view with jsbarcode/QR, Realtime, hub entry); pending the owner's scan test at the counter.
related: [PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: Loyalty cards

## Task Description

M3 / Fase 3.5. `loyalty_cards` exists since M0; couples store supermarket and shop cards as barcode/QR values and show them at the counter.

## Desired Outcome

- Cards index plus editor (name, number, format, color) and a full-screen card view that renders the barcode or QR locally, usable offline.
- Couple-shared with Realtime; `npm run build` + `npm run lint` green.

## Proposed Implementation

- `app/src/features/loyalty/**`; a small barcode renderer dependency (license logged in `docs/legal/LEGAL-NOTES.md`), or a hand-rolled renderer if the format set is small.
- Card values are personal data: RLS stays couple-scoped; the view makes no network call.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `loyalty_cards`.
- `docs/legal/LEGAL-NOTES.md` — dependency licenses.

## Verification Procedure

- Add a card on one account: the partner sees it; render check against a real scanner on a phone; airplane mode keeps the card view working.
- `cd app && npm run build && npm run lint`.

## Notes

- Keep formats to the common ones first (EAN-13, Code 128, QR).

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; loyalty cards with a scannable full-screen view (barcode/QR).
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented `useLoyalty` (couple-wide CRUD with Realtime), `LoyaltyBarcode` (jsbarcode Code 128 / EAN-13 / Code 39 + react-qr-code for QR, black on white for scanner reliability; MIT logged in LEGAL-NOTES), the cards grid with tone chips, the editor (store, code, format, tone) and the full-screen viewer; route `/us/loyalty` and the hub entry. `npm run build` + `npm run lint` green; the scan test at the counter is the owner step.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; loyalty cards with a scannable full-screen view (barcode/QR).

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
