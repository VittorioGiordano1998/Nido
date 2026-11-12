---
id: TASK-APP-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: app
severity: Low
opened: 2026-11-12
done: 2026-11-12
next: null
related: [TASK-APP-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Make the favicon and touch icon follow the chosen accent

## Task Description

The new brand icon ships in the default terracotta only, while the user picks one of four accents (terra, oliva, mare, prugna) in the profile. The in-app mark already follows the accent; the browser favicon and the iOS touch icon do not.

## Desired Outcome

The tab favicon and the apple-touch-icon take the colour of the accent in use, on first load from the cache and whenever the accent changes. Default (terra) files stay the static fallbacks.

## Proposed Implementation

applyAppearance() in core/appearance.ts rewrites the SVG icon link as a data URL built from the accent swatch, and points the touch-icon link at a prebuilt PNG per accent. The inline script in index.html is left alone (its hash is pinned in the CSP).

## Relevant Files

- `app/src/core/appearance.ts` (`applyBrandIcons`, `applyAppearance`)
- `app/src/main.tsx`
- `app/index.html`
- `app/vercel.json` (CSP: inline script hash, `img-src data:`)

## Verification Procedure

- `npm run build` passes.
- Accent `mare` seeded in the appearance cache: the SVG icon link becomes a blue data URL, the touch icon points at `apple-touch-icon-mare.png`, and the login screen mark and theme are blue too.

## Notes

The inline pre-paint script in `index.html` is untouched: its sha256 is pinned in the CSP, so editing it would break it on Vercel. The `.ico` fallback and the default `apple-touch-icon.png` stay terracotta. The icon drawing now exists in three places (`favicon.svg`, `BrandMark`, `brandIconSvg`); each carries a comment pointing at the others.

## Touch History

- 2026-11-12 — VITTORIOGIORDANOYBQ — created
- 2026-11-12 — VITTORIOGIORDANOYBQ — Tab favicon (data-URL SVG) and iOS touch icon (prebuilt PNG per accent) now follow the accent, applied at startup from the cache and on every accent change. Checked in the browser with the mare accent; build passes.

## Resolution

`applyBrandIcons(accent)` tints the tab icon (data-URL SVG from the accent swatch) and swaps the iOS touch icon for a prebuilt per-accent PNG (`apple-touch-icon-oliva|mare|prugna.png`). It runs from `applyAppearance` and once at startup from the cached accent. Limitation: browsers that ignore the SVG icon and use `favicon.ico` still show terracotta, and a tab already open on iOS keeps the icon it had until reload.
