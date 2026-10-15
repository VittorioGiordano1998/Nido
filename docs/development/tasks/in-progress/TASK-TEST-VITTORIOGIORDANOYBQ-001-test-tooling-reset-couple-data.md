---
id: TASK-TEST-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: test tooling
severity: Low
opened: 2026-10-15
done: null
next: Implemented (reset_couple_data RPC + the "Zona test" card with the typed RESET confirmation); owner step remains: paste apply-reset-couple.sql, then try it with the two accounts.
related: [TASK-GDPR-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002, TASK-WEB-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Test tooling: reset couple data

## Task Description

Owner request for the private-test workflow: re-running pairing and the feature flows needs a clean slate, and today a couple's data can only be cleared row by row. The tool targets the owner's own test project (two accounts), so it lives behind an explicit typed confirmation.

Not a product feature: if Nido ever ships to others, this is the first thing to review (or remove).

## Desired Outcome

- An RPC `reset_couple_data(target_couple uuid)` (SECURITY DEFINER, member check) that deletes the couple's feature data — events, lists + tasks, notes, wishlist, facts, capsules, decisions + votes, daily answers, week plans, nudges, savings, loyalty cards, canvases, cycle logs + shares — keeping the couple, the members and the profiles.
- A "Zona test" card in Profilo: explains exactly what is cleared (cycle data included), requires typing `RESET`, calls the RPC and reloads.
- `apply-reset-couple.sql` one-shot + `apply-all.sql` regenerated; `npm run build` + `npm run lint` green.

## Proposed Implementation

- `supabase/migrations/<ts>_nido_reset_couple.sql` (NEW) — the function above; deleting `task_lists` cascades `tasks`, deleting `decisions` cascades the votes.
- `supabase/apply-reset-couple.sql` (NEW) + `apply-all.sql`.
- `app/src/features/profile/TestToolsCard.tsx` (NEW) — typed confirmation, `supabase.rpc('reset_couple_data', { target_couple })`, reload on success.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — the tables it clears and their cascades.
- `app/src/features/profile/ProfilePage.tsx` — where the card lands.
- `app/src/features/coupling/CoupleProvider.tsx` — the couple id the card passes.

## Verification Procedure

- With two accounts: add a row of each kind, reset from one, both accounts come back empty (couple and profiles intact, bank untouched).
- Calling the RPC with a couple you are not a member of raises.
- `cd app && npm run build && npm run lint`.

## Notes

- Cycle logs are owner-only in RLS; the reset still clears them (it is the owner's own test project) — the confirmation text says so.
- `push_tokens` and `profiles` are deliberately untouched: the device subscriptions and the account stay.

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; reset_couple_data RPC + the Zona test card.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261015200000_nido_reset_couple.sql` (SECURITY DEFINER RPC, member check, clears every couple-scoped feature table including cycle data, keeps couple/members/profiles/question bank) with `apply-reset-couple.sql` and `apply-all.sql`, and `TestToolsCard` in Profilo (typed `RESET` confirmation, friendly error when the RPC is missing, reload on success). `npm run build` + `npm run lint` green; the two-account trial is the owner step.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
