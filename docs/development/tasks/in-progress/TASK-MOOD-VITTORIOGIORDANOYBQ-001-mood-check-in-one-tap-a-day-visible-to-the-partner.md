---
id: TASK-MOOD-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: mood check-in
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; SQL applied on the live project (probed 2026-10-16); the two-account check is the remaining owner step."
related: [PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Mood check-in: one tap a day visible to the partner

## Task Description

Owner request (2026-10-16): a daily one-tap mood check-in — five levels, optional note —
that the partner can see on Home. It is a lightweight daily signal beside the question of
the day, not a mental-health tracker: five fixed faces, one row per user per day, editable
the same day. Impact: one new couple-scoped table + Realtime; Home gains a card.

## Desired Outcome

- Home card "Come stai oggi?" with five mood choices (face + label); one tap records or
  changes today's mood, same-day edit allowed.
- After recording, the card shows the partner's mood for today as soon as they record it
  (Realtime), plus a compact last-7-days strip for both people.
- A personal day streak of consecutive check-ins next to the card (same pattern as the
  question streak).
- Card gated by the "Noi" section toggle like the other rituals; hidden when there is no
  partner.
- `npm run build` + `npm run lint` green; migration + `apply-moods.sql`; two-account pass
  by the owner.

## Proposed Implementation

- Migration `20261016150000_nido_moods.sql` (+ `apply-moods.sql`, `apply-all.sql`):
  `moods` (id, couple_id, user_id, mood_date, mood smallint 1..5, note text, created_at,
  updated_at; unique (user_id, mood_date); couple/date index); RLS: both members read,
  own row insert/update/delete; `set_updated_at` trigger; Realtime publication.
- `app/src/features/mood/useMoods.ts` (state layer): today's rows for both members, last 7
  days, upsert own mood, own streak; realtime channel via `uniqueChannelTopic('moods-…')`.
- `app/src/features/mood/MoodCard.tsx` (View): five choices as local constants (emoji, no
  assets), partner's state, 7-day strip, inline optional note.
- Home: mount below the hero, above the question card, under `enabled.us`.
- No push in v1: a partner notification would need another DB webhook (owner setup);
  noted as a follow-up, not part of the outcome.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — table conventions.
- `supabase/migrations/20261014133040_nido_realtime.sql` — publication pattern.
- `app/src/features/question/useDailyQuestion.ts` — streak pattern.
- `app/src/features/home/HomePage.tsx` — where the card mounts.

## Verification Procedure

- Two-account: record a mood on one side → the other sees it live; edit the same day →
  updated; streak counts consecutive days.
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- Five fixed levels keep the UI and the schema simple; `mood` is a smallint 1..5.
- The note text stays optional and short (one line).
- Owner step: paste `apply-moods.sql`, then the two-account pass.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261016150000_nido_moods.sql` (`moods`: one row per member per day, mood 1–5, optional note, unique (user_id, mood_date), couple-read/own-write RLS, `set_updated_at` trigger, Realtime) with `apply-moods.sql` and `apply-all.sql`; `features/mood/useMoods.ts` (today, 7-day window for both members, own streak, upsert, realtime) and `MoodCard` on Home (five faces, same-day edit, optional note, partner mood, 7-day strip), gated by the Noi section.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
