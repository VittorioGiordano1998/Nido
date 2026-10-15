---
id: TASK-QOT-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: question of the day
severity: Low
opened: 2026-10-15
done: null
next: Implemented and green (Home card reusing useDailyQuestion; bank-missing empty state); pending the owner's bank paste and the two-account check.
related: [TASK-QOT-VITTORIOGIORDANOYBQ-001, TASK-HOME-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: Question of the day: card on Home

## Task Description

Deferred in TASK-QOT-VITTORIOGIORDANOYBQ-001 (Notes): Home does not surface today's question; the only entry point is the Noi hub. The hook already exists and the state is already realtime.

## Desired Outcome

- Home shows a compact daily-question card: "Rispondi" when unanswered, "In attesa del partner" when the partner has not answered yet, both answers once complete, with the streak count and a link to `/us/question`.
- State stays consistent with the hub (Realtime, no duplicate queries).
- `npm run build` + `npm run lint` green.

## Proposed Implementation

- Reuse `useDailyQuestion` (`app/src/features/question/`) inside a card component; the Home page composes it next to the existing sections.
- No new tables or queries beyond the hook; the empty state mirrors the hub's (bank not applied).

## Relevant Files

- `app/src/features/question/useDailyQuestion.ts` — the hook to reuse.
- `app/src/features/home/` — Home page and cards.
- `docs/development/tasks/in-progress/TASK-QOT-VITTORIOGIORDANOYBQ-001-*.md` — the deferral note.

## Verification Procedure

- Two profiles: answer on one side, the card flips to "in attesa"; answer on the other, both appear without a manual refresh.
- `cd app && npm run build && npm run lint`.
- Without the bank applied, the card shows the hub's empty state.

## Notes

- Depends on the bank being applied for real content; keep the card self-contained so it can ship independently.

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; implementing the Home card reusing useDailyQuestion.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented `features/question/DailyQuestionCard.tsx` (spinner, bank-missing empty state, "rispondi" state, waiting state, revealed answers, streak pill) composed into HomePage under the Noi section toggle; `npm run build` + `npm run lint` green.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
