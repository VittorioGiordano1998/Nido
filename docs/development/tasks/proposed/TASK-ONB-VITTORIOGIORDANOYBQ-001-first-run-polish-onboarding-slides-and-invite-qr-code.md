---
id: TASK-ONB-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Proposed
area: onboarding
severity: Low
opened: 2026-10-15
done: null
next: Proposed; ready to claim (M1 first-run polish); decide the seen-flag storage at claim.
related: [TASK-WEB-VITTORIOGIORDANOYBQ-001, PLAN-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: First-run polish: onboarding slides and invite QR code

## Task Description

M0 items 0.2 and 0.3, deferred at M0 close: onboarding slides (what Nido is, pairing, the tabs) and the invite QR for pairing. Today a new partner types the invite code by hand and no first-run explanation exists. Neither is a defect - both were explicitly deferred (PLAN-VITTORIOGIORDANOYBQ-001 §Backlog detail).

## Desired Outcome

- A short, skippable onboarding (welcome, pairing, tabs) on first sign-in, remembered per account and never shown again; reachable again from Profilo.
- The Pair page renders the invite code as a QR (image plus copy/share) and opening a link carrying the code prefills the join form.
- `npm run build` + `npm run lint` green; two-account pass for both the QR path and the typed-code path.

## Proposed Implementation

- `app/src/features/auth/OnboardingSlides.tsx` (NEW) — 3 slides over the existing shell pattern; the seen flag belongs to the account (a couple-wide flag would re-show it for the partner too).
- `app/src/features/coupling/` — QR block for the invite code; accept the code as a query param on the join side and prefill.
- A QR renderer is a small dependency: add it and log its license in `docs/legal/LEGAL-NOTES.md` (clean-room rule).

## Relevant Files

- `app/src/features/coupling/` — pairing UI and RPC usage.
- `app/src/features/auth/` — sign-in flow and providers.
- `supabase/migrations/20261014133039_nido_initial_schema.sql` — `profiles` (the seen flag lands here or in local storage; decide at claim).
- `docs/legal/LEGAL-NOTES.md` — dependency license log.

## Verification Procedure

- `cd app && npm run build && npm run lint`.
- Two browser profiles: a fresh account sees the slides once, a reload does not re-show them; the partner who joins later also sees them once.
- Pair page shows the QR; opening the deep link prefills the code; joining by typed code still works.

## Notes

- Keep the slides text and art original (clean-room constraints); IT copy lives with the UI strings.
- Small enough to pair with any M1 remainder session; independent of push and recurrences.

## Touch History

- 2026-10-15 — VITTORIOGIORDANOYBQ — created

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
