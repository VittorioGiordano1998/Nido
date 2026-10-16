---
id: TASK-ROB-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: robustness
severity: Medium
opened: 2026-10-16
done: null
next: "Implemented; verified via build and lint."
related: []
superseded_by: null
---

# Task: Robustness: error boundary with a friendly fallback

## Task Description

A render error anywhere in the app currently shows a white screen: there is no error boundary. Owner request (2026-10-16): a friendly fallback with a reload, at the app root and around the routed page so a broken section does not take the shell down.

## Desired Outcome

- A crash shows an Italian message ("Qualcosa è andato storto"), an explanation that data is safe, a «Ricarica» button (full reload) and a hint to report it.
- Two levels: a root boundary around the router, and one around the shell outlet that resets on route change (the bottom nav keeps working and navigating away recovers).
- The fallback respects the theme tokens and works in both themes.

## Proposed Implementation

- `app/src/app/ErrorBoundary.tsx`: a class component (`getDerivedStateFromError`/`componentDidCatch`) with a `resetKey` prop; fallback UI with the reload button.
- `app/src/main.tsx`: root boundary around `AppRouter`.
- `app/src/app/AppShell.tsx`: shell boundary around `<Outlet />`, `resetKey={location.pathname}`.

## Relevant Files

- `app/src/main.tsx`, `app/src/app/AppShell.tsx` — the mounting points.
- `app/src/ui/components.tsx` — buttons used by the fallback.

## Verification Procedure

- Temporarily throw in a page component: the fallback appears, navigating away/back recovers; the root boundary catches shell-level errors.
- `npm run build` + `npm run lint` green.

## Notes

- `componentDidCatch` logs the error (no logging wrapper exists in this project).

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `app/src/app/ErrorBoundary.tsx` (class boundary, Italian fallback with «Ricarica», `resetKey` for route recovery, `fullPage` variant) mounted around the router in `main.tsx` and around the `<Outlet />` in `AppShell` — a broken page keeps the shell alive andrecovers on navigation.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
