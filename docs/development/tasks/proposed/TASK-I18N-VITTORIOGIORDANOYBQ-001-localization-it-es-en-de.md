---
id: TASK-I18N-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: localization
severity: Medium
opened: 2026-10-15
done: null
next: Proposed; decide the i18n approach first, then extract strings feature by feature.
related: [PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002, TASK-QOT-VITTORIOGIORDANOYBQ-003]
superseded_by: null
---

# Task: Localization: IT, ES, EN, DE

## Task Description

M4 / Fase 4.4. The UI is Italian with strings hard-coded across the features; the plan targets IT (default), ES, EN and DE, and the question bank needs the same languages (PLAN-VITTORIOGIORDANOYBQ-001 §Risks).

## Desired Outcome

- A key-based i18n layer with a per-account locale (profile), dates and plurals via `Intl`, every UI string extracted, and a coverage check that fails on missing keys.
- Question-bank translations inserted with the same idempotent pattern as the seed.
- `npm run build` + `npm run lint` green.

## Proposed Implementation

- Decide the approach at claim (a small homegrown dictionary over a library — keep the bundle small); `app/src/core/i18n` plus a `profiles.locale` column (migration + apply script).
- Extract feature by feature, starting where strings are densest; add the coverage check to the build or CI.

## Relevant Files

- Every feature's strings; `app/src/features/us/` and the shell for the switcher.
- `supabase/migrations/20261014172345_nido_question_bank_seed.sql` — the bank pattern.

## Verification Procedure

- Switch locale on one account: UI, dates and plurals follow; the partner's account keeps its own locale.
- Coverage check passes with zero missing keys; question bank serves all four languages.

## Notes

- Decide the library before touching a hundred files; translations are original content (clean-room).

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
