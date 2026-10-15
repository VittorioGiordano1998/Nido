---
id: TASK-ONB-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: onboarding
severity: Low
opened: 2026-10-15
done: 2026-10-15
next: null
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
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; onboarding slides (per-account flag) + invite QR with a prefilled deep link.
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `OnboardingSlides` (+ `useOnboarding` on `profiles.onboarded_at` with a localStorage fallback), first-run overlay in `AppShell`, reopen from Profilo; invite QR (`react-qr-code`, MIT logged in LEGAL-NOTES) on the pairing page, `/pair?code=` prefills the join form and `RequireAuth`/`LoginPage` return there after sign-in; migration `20261015113000_nido_onboarding.sql` + `apply-onboarding.sql` + `apply-all.sql`; `npm run build` + `npm run lint` green.
- 2026-10-15 — VITTORIOGIORDANOYBQ — Owner verification passed on the live app (two-account pass, 2026-10-15); closed in the phase close-out.

## Resolution

Implemented: first-run onboarding slides (per-account flag on `profiles.onboarded_at` with a device fallback), invite QR with `react-qr-code` (MIT, logged in LEGAL-NOTES), `/pair?code=` deep link with the login return path (`RequireAuth` state → `LoginPage`). `apply-onboarding.sql` pasted; owner first-run check on 2026-10-15.
