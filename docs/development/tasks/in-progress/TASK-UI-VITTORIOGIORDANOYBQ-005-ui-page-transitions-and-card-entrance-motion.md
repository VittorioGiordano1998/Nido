---
id: TASK-UI-VITTORIOGIORDANOYBQ-005
owner: VITTORIOGIORDANOYBQ
type: Style
status: In Progress
area: ui polish
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; a browser pass (Chrome/Safari/Firefox) is the remaining step."
related: [TASK-UI-VITTORIOGIORDANOYBQ-002]
superseded_by: null
---

# Task: UI: page transitions and card entrance motion

## Task Description

Owner request (2026-10-16): route changes are abrupt and card lists appear all at once.
Add soft page transitions (View Transitions API) plus a subtle entrance for page content,
always reduced-motion safe and cheap on low-end phones.

## Desired Outcome

- Bottom-nav and primary in-page navigations run inside a View Transition where the
  browser supports it (React Router `viewTransition` on the links), with a short
  fade/slide between old and new root; unsupported browsers keep today's instant swap.
- Page content gets a soft entrance (fade + few px rise) on route change, driven by CSS,
  keyed on the pathname.
- `prefers-reduced-motion: reduce` disables both (media query gate); no animation on the
  sticky header/bottom nav (they keep their place).
- `npm run build` + `npm run lint` green; visual check on Chrome and Safari.

## Proposed Implementation

- `app/src/index.css`: `@keyframes` for the page entrance; `::view-transition-old(root)` /
  `::view-transition-new(root)` durations; a reduced-motion block that zeroes both.
- `app/src/app/AppShell.tsx`: wrap `<Outlet />` in a `key={location.pathname}` container
  with the entrance class; add `viewTransition` to the `NavLink`s.
- `app/src/features/home/HomePage.tsx`, `app/src/features/us/UsPage.tsx`: `viewTransition`
  on the section/hub links (the primary navigations).

## Relevant Files

- `app/src/app/AppShell.tsx` — the shell that owns the transition boundary.
- `app/src/index.css` — where the keyframes and media queries live.
- `react-router-dom` v7 `Link`/`NavLink` docs for the `viewTransition` prop.

## Verification Procedure

- Chrome: navigating bottom nav and hub links shows the cross-fade; Safari: same or
  graceful fallback; Firefox: instant swap, entrance still soft.
- With reduced motion on (OS setting), no transitions play.
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- Keep durations short (≤ 250 ms) and animate only opacity/transform.
- This task and TASK-UI-…-002 touch the same pages; land 002 first to avoid churn.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `page-enter` keyframes plus a wrapper keyed on `location.pathname` inside `AppShell` (fade + 6 px rise, 220 ms, opacity/transform only); `viewTransition` on the bottom nav, the hub tiles, the Home links and the new pages' back links; `::view-transition-old/new(root)` cross-fade (180 ms) in `index.css`; everything disabled under `prefers-reduced-motion`.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
