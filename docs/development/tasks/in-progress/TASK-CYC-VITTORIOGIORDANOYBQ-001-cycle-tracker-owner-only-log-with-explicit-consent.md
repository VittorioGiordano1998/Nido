---
id: TASK-CYC-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: cycle tracker
severity: Medium
opened: 2026-10-15
done: null
next: "Implemented (consent gate on profiles.cycle_consent_at, personal month calendar with the day editor, symptom chips, shareable period summaries); owner step: paste apply-cycle-consent.sql, then the two-account check."
related: [PLAN-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002, TASK-GDPR-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Cycle tracker: owner-only log with explicit consent

## Task Description

M3 / Fase 3.2. Health data: `cycle_logs` is owner-only in RLS since M0; `cycle_shares` carries an optional couple-visible summary. PLAN-VITTORIOGIORDANOYBQ-001 §GDPR/store: health data needs explicit consent, minimization, and never auto-syncs to the partner.

## Desired Outcome

- A consent screen before the section can be enabled (explicit, revocable, stored per user); the section stays hidden until consent.
- Personal calendar plus a log editor, verified owner-only with the partner's account.
- Optional share toggle publishing only the summary the owner chooses.
- `npm run build` + `npm run lint` green.

## Proposed Implementation

- `app/src/features/cycle/**` with its own provider; reuse the calendar's visual patterns, never the `events` table.
- Consent state: prefer a `profiles.cycle_consent_at` column (migration + apply script) over local storage so it follows the account.
- Summary publishing writes `cycle_shares` only.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `cycle_logs`, `cycle_shares`.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — the owner-only policies.
- `app/src/features/calendar/` — the UI patterns to reuse visually.

## Verification Procedure

- RLS probe: the partner account cannot read `cycle_logs` even by id; no cycle row appears in any shared query.
- Share on: only the chosen summary becomes couple-visible; revoking consent hides the section and stops syncing.
- `cd app && npm run build && npm run lint`.

## Notes

- Never surface cycle data in notifications or TASK-RECAP-VITTORIOGIORDANOYBQ-001 output without an explicit opt-in.
- Data minimization: store only what the feature displays.

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; consent gate + owner-only diary + shareable summaries implemented in this session.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261015210000_nido_cycle_consent.sql` (profiles.cycle_consent_at) with `apply-cycle-consent.sql` and `apply-all.sql`; `useCycle` (consent read/write, owner-only logs with upsert by day, shares CRUD); `CyclePage` (consent gate with the privacy explanation and revoke, month grid with dots, day summary, editor with flow/mood/symptoms/notes, "Riepiloghi condivisi" with the summary/dates-only level) + `CycleLogEditor`; `/cycle` route with the entry card in Profilo. `npm run build` + `npm run lint` green; the two-account check is the owner step.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; consent gate + owner-only diary + shareable summaries implemented in this session.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
