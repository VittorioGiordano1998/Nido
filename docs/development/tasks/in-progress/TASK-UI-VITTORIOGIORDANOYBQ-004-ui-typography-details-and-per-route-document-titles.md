---
id: TASK-UI-VITTORIOGIORDANOYBQ-004
owner: VITTORIOGIORDANOYBQ
type: Style
status: In Progress
area: ui polish
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; verified via build, lint and records check."
related: []
superseded_by: null
---

# Task: UI: typography details and per-route document titles

## Task Description

Owner request (2026-10-16): small typographic details — counters and dates should not
shift width while animating (tabular numbers), headings should wrap balanced — and the
browser tab should say where you are, not always "Nido".

## Desired Outcome

- `tabular-nums` (Tailwind `tabular-nums`) on counters and aligned numerals: the days
  counter on Home, savings amounts, calendar day numbers, list/date columns where digits
  align.
- `text-balance` on page headings (`h1`) and the Home greeting so they wrap nicely.
- Per-route document titles: "Calendario · Nido", "Ricordi · Nido", …, "Nido" on Home;
  dynamic routes fall back to the section title ("Lista · Nido").
- `npm run build` + `npm run lint` green.

## Proposed Implementation

- `app/src/app/titles.ts` (new): pathname → title map covering every route in
  `app/src/app/router.tsx`, incl. dynamic prefixes.
- `app/src/app/AppShell.tsx`: a small effect (or `app/useDocumentTitle.ts` hook) sets
  `document.title` on location change; pages keep their own `h1`s.
- Sweep the listed spots for `tabular-nums` / `text-balance` (HomePage, CalendarPage,
  SavingsPage, LoyaltyPage, ProfilePage headings trimmed only where the h1 exists).

## Relevant Files

- `app/src/app/router.tsx` — route list to mirror.
- `app/src/features/home/HomePage.tsx`, `app/src/features/savings/SavingsPage.tsx` —
  counters.
- `app/src/features/calendar/CalendarPage.tsx` — calendar grid numerals.

## Verification Procedure

- Navigate every route → tab title matches; the days counter animates without width jitter.
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- Title format: "`<Page>` · Nido"; Home is plain "Nido".

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `app/src/app/titles.ts` (longest-prefix route map over the router) plus a `useEffect` in `AppShell` that sets `document.title` on every route change ("Calendario · Nido", …; Home stays "Nido"); `tabular-nums` on the days counter, the calendar day numbers, the compact dates and the savings amounts; `text-balance` on every page `h1` (12 files) and on the Home greeting.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
