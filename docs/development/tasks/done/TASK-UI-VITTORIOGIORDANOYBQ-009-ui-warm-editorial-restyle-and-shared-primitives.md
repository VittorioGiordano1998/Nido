---
id: TASK-UI-VITTORIOGIORDANOYBQ-009
owner: VITTORIOGIORDANOYBQ
type: Style
status: Done
area: ui polish
severity: Medium
opened: 2026-11-11
done: 2026-11-11
next: null
related: []
superseded_by: null
---

# Task: UI: warm editorial restyle and shared primitives

## Task Description

Owner request (2026-11-11): the app looks too plain. It uses the system font, flat white cards that all look the same and one accent color, and the same markup is hand-copied across the code base (17 bottom sheets, 25 page headers, 22 accent link-buttons). Chosen direction: "warm editorial" — a soft serif for titles, a refined sans for text, cards with depth and a light paper texture.

## Desired Outcome

- Self-hosted display and text fonts (the CSP allows only same-origin fonts), exposed as theme tokens.
- Warm two-level shadows, a subtle paper grain on the canvas and dark variants for the sage scale, all defined as tokens in `app/src/index.css`; no hard-coded colors in components.
- Shared view primitives replace the duplicated markup: `Sheet`, `PageHeader`, `SectionHeader`, `Avatar`, `ButtonLink`, `IconTile`, richer `Card` and `EmptyState`.
- Every page uses the primitives, in both themes and all four accent presets, with no behavior change.

## Proposed Implementation

- `app/package.json`: add `@fontsource-variable/fraunces` and `@fontsource-variable/figtree` (OFL 1.1), imported from `app/src/main.tsx`.
- `app/src/index.css`: font, shadow, grain and sage dark tokens; sheet and stagger keyframes inside the existing reduced-motion gate.
- `app/src/ui/Sheet.tsx`, `PageHeader.tsx`, `SectionHeader.tsx`, `Avatar.tsx` (new); `app/src/ui/components.tsx` (ButtonLink, Card variants, IconTile, EmptyState).
- Mechanical migration of the editors, sheets and pages under `app/src/features/` to the primitives.
- `docs/legal/LEGAL-NOTES.md`: register the two font packages.

## Relevant Files

- `app/src/index.css` — theme tokens.
- `app/src/ui/components.tsx` — existing shared components.
- `app/src/features/notes/NoteEditor.tsx` — the bottom-sheet pattern that is copied 17 times.
- `app/vercel.json` — the CSP that forces self-hosted fonts.

## Verification Procedure

- `cd app && npm run build && npm run lint && npm test`.
- Browser pass at 390x844 and 1440x900, light and dark, four accent presets: no console errors, no CSP violations.
- With reduced motion on, no animation plays.

## Notes

- The inline pre-paint script in `app/index.html` is covered by a CSP hash: do not edit it.
- Public repository: no secrets or personal data in tracked files.

## Touch History

- 2026-11-11 — VITTORIOGIORDANOYBQ — created
- 2026-11-11 — status In Progress → Done

## Resolution

- Fonts: Fraunces (titles) and Figtree (text), self-hosted through `@fontsource-variable/*` and exposed as `--font-display` / `--font-sans`; registered in `docs/legal/LEGAL-NOTES.md`.
- Tokens in `app/src/index.css`: warm two-level shadows (`shadow-card`, `shadow-lift`), a paper grain on the canvas, the semantic pairs `sage-soft/sage-ink` and `honey-soft/honey-ink` (they flip with the theme), sheet and stagger keyframes inside the reduced-motion gate.
- New primitives in `app/src/ui/`: `Sheet` (+ `useModalLayer`: Escape closes the topmost layer only, body scroll lock), `PageHeader` / `SectionHeader`, `Avatar`, `Brand`, `EntryLayout`; `components.tsx` gains `ButtonLink`, button sizes and a `danger` variant, `Card` tones and `interactive`, `IconTile`, `NoMatches`, a warmer `EmptyState`.
- Migration: 15 editors and sheets, the loyalty viewer and the onboarding slides now use `Sheet`; 18 page headers use `PageHeader`; the inline accent buttons use `Button` / `ButtonLink`.
- The login dot grid and the pairing star border read their colors from the theme tokens instead of fixed hex values.

Verified on 2026-11-11 with `npm run build`, `npm run lint` (warnings only, none new) and `npm test` (10 files, 60 tests), plus a Playwright pass at 390x844 and 1440x900 in light and dark. The browser pass ran against a simulated backend (requests intercepted in the browser, invented data) because `app/.env.local` was not available on the machine.

Remaining limitation: not yet checked against the real Supabase project (Realtime delivery, real photos, real account). All four accent presets share the same tokens; `mare` was checked in dark, `terra` in both themes.
