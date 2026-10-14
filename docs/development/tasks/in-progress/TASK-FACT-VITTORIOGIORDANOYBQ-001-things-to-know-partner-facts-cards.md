---
id: TASK-FACT-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: facts
severity: Medium
opened: 2026-10-14
done: null
next: Implemented and green (tabs partner/me, grouped cards, Realtime); pending the owner's two-account check after the next push.
related: [PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Things to know: partner facts cards

## Task Description

M2 / Fase 2.5. A small card deck of things worth remembering about each other: sizes,
tastes, allergies, favourite things. `partner_facts` (subject, category, label, value,
updated_by) exists since M0 with couple-wide RLS; the page is missing.

Impact: it is the practical "know your partner" feature — the kind of data that otherwise
lives in scattered notes — and a natural consumer of the notes-free browsing flow.

## Desired Outcome

- `/us/facts`: two tabs — facts about the partner ("Su {name}") and facts about me ("Su di
  me") — with cards grouped by category.
- Add, edit, delete a fact (label + value + category with suggested values: Taglie, Gusti,
  Allergie, Altro).
- Partner changes arrive live (Realtime on `partner_facts`).
- `npm run build` + `npm run lint` green; two-profile check.

## Proposed Implementation

- `app/src/features/facts/useFacts.ts` (NEW) — state layer: load, create, update, delete,
  Realtime filtered by couple.
- `app/src/features/facts/FactsPage.tsx` (NEW) — tabs, grouped cards, inline editor overlay.
- `app/src/app/router.tsx` — route `/us/facts`; link from the "Noi" hub.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `partner_facts`.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — `partner_facts_*` policies
  (insert/update require `updated_by = auth.uid()`).
- `app/src/features/lists/useLists.ts` — the CRUD + Realtime pattern.

## Verification Procedure

- Two profiles: add a fact on one side → visible on the other without refresh; edit/delete
  the same way.
- `cd app && npm run build && npm run lint`.

## Notes

- Categories are plain text with suggestions; no schema change needed.
- Photos/attachments are out of scope (Storage uploads would be a sibling task).

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-14 — status Proposed → In Progress
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — implemented `useFacts` (CRUD with
  `updated_by = auth.uid()` on writes, Realtime), `FactsPage` (tabs "Su {partner}" / "Su di
  me", category groups with suggestions, editor overlay), route `/us/facts` from the hub.
  Verified: `npm run build` + `npm run lint` green.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
