---
id: TASK-QOT-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: question of the day
severity: Medium
opened: 2026-10-14
done: 2026-10-15
next: null
related: [PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Question of the day: hidden answers and streak

## Task Description

M2 / Fase 2.1. Once a day the couple answers the same question; neither reads the other's
answer until both have answered, and a streak rewards the habit. `question_bank` and
`daily_answers` exist since M0 and the RLS already hides answers
(`daily_answers_select`: own row, or all rows once `both_answered(couple_id, day)`).

Impact: it is the flagship of the "Noi" tab and the first daily ritual of the app; the
"archive of past answers" is what makes the couple's history tangible.

## Desired Outcome

- `question_bank` is seeded (Italian; original content) via an idempotent migration; the
  selection for a given day is deterministic per couple (hash of couple + date over the
  ordered bank), so both partners see the same question without a server job.
- `/us/question`: today's card with a text area to answer, "in attesa del partner" until
  both answered, then both answers revealed and live (Realtime on `daily_answers`).
- Streak counter of consecutive days in which both answered; archive of the last days with
  both answers (question + the two answers).
- A friendly empty state when the bank has not been applied yet.
- The "Noi" page becomes the Fase 2 hub, with the card linking here.
- `npm run build` + `npm run lint` green; two-account flow verified.

## Proposed Implementation

- `supabase/migrations/20261014172345_nido_question_bank_seed.sql` (NEW) — unique index on
  `(lang, text)` + 60 original Italian questions (categories: ricordi, noi, desideri,
  futuro, gioco) via `insert ... on conflict do nothing`; plus `supabase/apply-question-bank.sql`
  (idempotent one-shot for the live project) and a regenerated `apply-all.sql`.
- `app/src/features/question/useDailyQuestion.ts` (NEW) — state layer: deterministic index,
  today's question, today's answers (RLS-hidden), `answerToday`, visible history for the
  archive, streak, Realtime on `daily_answers` filtered by couple.
- `app/src/features/question/QuestionPage.tsx` (NEW) — today's card + archive + streak.
- `app/src/features/us/UsPage.tsx` (rewrite) — the Fase 2 hub (this card + the sibling
  features, with "presto" badges for the ones still to come).
- `app/src/app/router.tsx` — route `/us/question`.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `question_bank`, `daily_answers`.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — `daily_answers_*` policies.
- `app/src/features/calendar/useEvents.ts` — the state-layer pattern to follow.

## Verification Procedure

- Two browser profiles: answer on one side → the other sees "in attesa"; answer on the
  second → both answers appear (also without a manual refresh after the first reload).
- Streak: with the seeded bank, both answered today → streak 1.
- `cd app && npm run build && npm run lint`.
- Without the bank (fresh project, seed not applied) the page shows the empty state.

## Notes

- Bank target is 100 questions; this seed ships 60, expandable by appending inserts with the
  same idempotent pattern. Adding questions can shift future deterministic picks (accepted;
  past days keep their `question_id` in the answers).
- The home card ("domanda del giorno" on Home) is deferred; the hub is the entry point.
- No notifications: the streak relies on the couple's habit (push arrives with TASK-PUSH).

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-14 — status Proposed → In Progress
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — implemented the Fase 2 slice: seed migration
  `20261014172345_nido_question_bank_seed.sql` (60 original Italian questions, unique index
  + on conflict do nothing; one-shot `apply-question-bank.sql`; `apply-all.sql` regenerated),
  `useDailyQuestion` (FNV-1a deterministic pick, today's answers under RLS, 30-day archive,
  streak, Realtime), `QuestionPage`, and the "Noi" hub (`UsPage`) with routes
  `/us/question`, `/us/facts`, `/us/capsules`. Verified: `npm run build` + `npm run lint` green.
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — fixed double-encoded UTF-8 (mojibake) in the
  two hand-assembled apply files: `apply-question-bank.sql` and `apply-all.sql` carried
  `Qual Ã¨`/`piÃ¹`/`perchÃ©` instead of `Qual è`/`più`/`perché`; all 60 question lines now
  match the seed migration byte-for-byte and no non-ASCII mojibake remains.
- 2026-10-15 — VITTORIOGIORDANOYBQ — Owner verification passed on the live app (two-account pass, 2026-10-15); closed in the phase close-out.

## Resolution

Implemented: the "Noi" hub, the deterministic daily pick, answers hidden by RLS until both answer, streak and 30-day archive, Realtime. The bank is applied on the live project (100 questions after TASK-QOT-VITTORIOGIORDANOYBQ-003); owner two-account check on 2026-10-15.
