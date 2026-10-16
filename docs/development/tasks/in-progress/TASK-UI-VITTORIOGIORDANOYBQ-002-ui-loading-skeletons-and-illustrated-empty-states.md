---
id: TASK-UI-VITTORIOGIORDANOYBQ-002
owner: VITTORIOGIORDANOYBQ
type: Style
status: In Progress
area: ui polish
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; a visual pass on the live app is the remaining step."
related: []
superseded_by: null
---

# Task: UI: loading skeletons and illustrated empty states

## Task Description

Owner request (2026-10-16): loading moments are centered spinners and empty states are
plain text boxes. Replace the main surfaces with shape-matched skeletons (perceived speed)
and give empty states a small on-brand illustration plus a call to action.

## Desired Outcome

- `ui/Skeleton.tsx` and page-shaped skeletons for Home (hero + the three sections),
  Calendar (grid + day list), and the list/grid surfaces of the Noi pages; skeleton shapes
  match the loaded content so there is no layout jump.
- `ui/illustrations.tsx`: a few original line illustrations (nest, heart, camera, calendar)
  in theme colors; `EmptyState` gains `illustration` and `action` props (icon stays
  supported).
- Main empty states get illustration + CTA: Home sections (links to the section), lists,
  notes, capsules, wishlist, savings, loyalty, memories, bucket. CTA opens the editor when
  the page has one, or links to the right section.
- `npm run build` + `npm run lint` green; visual check in both themes.

## Proposed Implementation

- `app/src/ui/Skeleton.tsx` (new): `Skeleton` block (pulse) + a couple of composed
  placeholders (`CardListSkeleton`, `GridSkeleton`) reused by pages.
- `app/src/ui/illustrations.tsx` (new): 3-4 small SVGs, `aria-hidden`, currentColor +
  accent tokens; registered nowhere else (local Views).
- `app/src/ui/components.tsx`: `EmptyState` gains `illustration?: ReactNode` and
  `action?: ReactNode`.
- Pages: swap spinner blocks for skeletons (Home, `CalendarPage`, `ListsPage`,
  `NotesPage`, `CapsulesPage`, `WishlistPage`, `SavingsPage`, `LoyaltyPage`,
  `MemoriesPage`, `BucketPage`); wire CTAs on the empty branches.

## Relevant Files

- `app/src/ui/components.tsx` — `EmptyState`, `Spinner`.
- `app/src/features/home/HomePage.tsx`, `app/src/features/calendar/CalendarPage.tsx` — the
  two heaviest loaders.
- `app/src/features/lists/ListView.tsx` — card-list shapes to mirror.

## Verification Procedure

- Throttled reload: skeletons appear before content and match its shape; no spinner in the
  touched surfaces; empty states show illustration + working CTA.
- Both themes: illustrations and skeleton contrast readable.
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- Skeletons are CSS-only (Tailwind pulse) — no new dependency.
- Illustrations are original line art (clean-room): no third-party art.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: `ui/Skeleton.tsx` (`Skeleton`, `CardListSkeleton`, `GridSkeleton`, `PageHeaderSkeleton`, pulse disabled under reduced motion) and `ui/illustrations.tsx` (original nest, heart, camera, calendar, sparkle and checklist line art); `EmptyState` gained `illustration` and `action`; the centered-spinner blocks were replaced with shape-matched skeletons in Home, Calendario, Liste, ListView, Note, Capsule, Wishlist, Decisioni, Tessere, Piano, Domanda (page and Home card), Risparmi and Fatti; illustrated empty states with CTAs on Home sections, Note, Capsule, Ricordi, Bucket, Risparmi and Scegli per noi.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
