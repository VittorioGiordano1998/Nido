---
id: TASK-APP-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: Done
area: app
severity: Low
opened: 2026-11-12
done: 2026-11-12
next: null
related: []
superseded_by: null
---

# Task: Redesign the Nido app icon (favicon + in-app brand mark)

## Task Description

The current mark (a ring around a dot) is generic and reads as a record/target button. Design a proper Nido mark — a sheltering arch (the home, and the lowercase "n" of Nido) around an egg — and ship it consistently: the SVG favicon, PNG/ICO fallbacks, the iOS touch icon, and the in-app BrandMark shown next to the wordmark.

## Desired Outcome

One drawing used everywhere: app/public/favicon.svg (terracotta tile, cream glyph), favicon.ico, apple-touch-icon.png, and BrandMark in app/src/ui/Brand.tsx (currentColor, no tile). Legible at 16 px, original artwork, no new dependencies.

## Proposed Implementation

Draw the glyph in SVG on a 64 grid, render previews at 16/32/180 px to check legibility, export PNGs with headless Edge, wrap 16/32/48 px PNGs into an ICO, link them from index.html.

## Relevant Files

- `app/public/favicon.svg`
- `app/src/ui/Brand.tsx`
- `app/index.html`

## Verification Procedure

- `npm run build` passes.
- Mark rendered at 16/32/64/180 px on light and dark backgrounds; legible at 16 px.
- Login screen in the running app shows the new `BrandMark` next to the wordmark; `/favicon.svg`, `/favicon.ico` and `/apple-touch-icon.png` are served.

## Notes

Two-eggs-over-a-bowl concepts were tried and dropped: they read as a smiley face. The PNG/ICO files are rendered from the SVG geometry (headless Chrome); `favicon.svg` stays the source of truth and `BrandMark` must follow it.

## Touch History

- 2026-11-12 — VITTORIOGIORDANOYBQ — created
- 2026-11-12 — VITTORIOGIORDANOYBQ — New mark (sheltering arch around an egg) shipped as favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180) and the in-app BrandMark. Checked at 16/32/180 px, on light and dark headers, and on the running login screen. Build passes; no web manifest or 192/512 PWA icons added.

## Resolution

New mark shipped: terracotta tile with a cream arch and egg (`favicon.svg`), `favicon.ico` (16/32/48), `apple-touch-icon.png` (180, full-bleed), and `BrandMark` (same drawing, `currentColor`, no tile). Verified as listed above. Not done: no web manifest and no 192/512 PWA icons; the app is not installable as a PWA yet.
