---
id: TASK-DEC-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: decisions
severity: Medium
opened: 2026-10-14
done: null
next: Implemented and green (list, editor, hidden votes, voluntary reveal with warning, derived agreement, delete, Realtime); pending the owner's two-account check (vote stays hidden, reveal shows both).
related: [PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Blind decisions with two-way reveal

## Task Description

M2 / Fase 2.2. "Cosa mangiamo? Cosa guardiamo?": a question with options, both partners vote
without seeing the other's choice, then the decision is revealed. `decisions` and
`decision_votes` exist since M0; the RLS already hides votes (own vote, or all once the
decision has `revealed_at`).

Impact: it removes the small daily negotiation loop — and it is the second ritual of the
"Noi" tab.

## Desired Outcome

- `/us/decisions`: list (open and revealed), create (question + 2-4 options), vote, reveal.
- Votes stay hidden until the reveal; after it, both votes are visible and agreement is
  highlighted ("siete d'accordo su X").
- Delete a decision (with its votes, cascade). Realtime updates.
- `npm run build` + `npm run lint` green; two-profile check (vote hidden, reveal shows).

## Proposed Implementation

- `app/src/features/decisions/useDecisions.ts` (NEW) — decisions + own votes, CRUD, reveal
  (`revealed_at = now()`), Realtime on `decisions` and `decision_votes`.
- `app/src/features/decisions/DecisionsPage.tsx` + `DecisionEditor.tsx` (NEW) — list, vote
  chips, option editor.
- `app/src/app/router.tsx` — route `/us/decisions`; link from the "Noi" hub.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `decisions`, `decision_votes`.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — `decision_votes_*` policies.
- `app/src/features/question/useDailyQuestion.ts` — the hidden-until-both pattern.

## Verification Procedure

- Two profiles: both vote → neither sees the other's choice; one reveals → both see; the
  same option on both sides is highlighted.
- `cd app && npm run build && npm run lint`.

## Notes

- The reveal is a voluntary action (the couple reveals when both have voted; the UI reminds
  if the own vote is missing). `result` jsonb can hold the computed outcome.
- `options` is a jsonb array of strings for the MVP.

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; implementing the list/editor/vote/reveal with a derived agreement.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented `useDecisions` (decisions + own votes under RLS, upsert vote, reveal, delete, Realtime on `decisions` and `decision_votes`), `DecisionsPage` (vote chips while hidden, waiting state, reveal with an explicit warning, revealed votes with the agreement highlighted, delete) and `DecisionEditor` (2-4 distinct options, validation); route `/us/decisions` and the Noi hub card switched to ready. `npm run build` + `npm run lint` green.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; implementing the list/editor/vote/reveal with a derived agreement.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
