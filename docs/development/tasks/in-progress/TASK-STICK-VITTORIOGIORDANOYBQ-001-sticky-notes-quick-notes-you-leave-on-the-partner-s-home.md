---
id: TASK-STICK-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: sticky notes
severity: Low
opened: 2026-10-16
done: null
next: "Implemented; SQL applied on the live project (probed 2026-10-16); the two-account check is the remaining owner step."
related: [PLAN-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Sticky notes: quick notes you leave on the partner's Home

## Task Description

Owner request (2026-10-16): ephemeral sticky notes ("latte", "ti amo") one partner leaves
for the other; they appear on the partner's Home and are dismissed by the recipient (or
retracted by the author). Distinct from `notes` (permanent shared documents) and from the
nudge (a push with no content): this is casual, low-ceremony, and lives on Home.

## Desired Outcome

- Home card "Bigliettini" with a one-line composer; sending places the sticky on the
  partner's Home immediately (Realtime).
- Received stickies render as small accent-tinted notes (slight tilt); the recipient
  dismisses one with ✕ and it disappears for both.
- The author sees their sent stickies in the same card (collapsed "Inviati") and can
  retract one.
- Card hidden when there is no partner; empty state is just the composer.
- `npm run build` + `npm run lint` green; migration + `apply-stickies.sql`; two-account
  pass by the owner.

## Proposed Implementation

- Migration `20261016160000_nido_stickies.sql` (+ `apply-stickies.sql`, `apply-all.sql`):
  `stickies` (id, couple_id, from_user, to_user, body text not null, created_at) with a
  length check; RLS: members read, insert only with `from_user = auth.uid()` and both in
  the same couple, delete by author or recipient; Realtime publication.
- `app/src/features/stickies/useStickies.ts` (state layer): received (to_user = me) and
  sent (from_user = me) lists, `send`, `dismiss`, `retract`; realtime channel.
- `app/src/features/stickies/StickyCard.tsx` (View): composer + note list, small rotation
  by index (CSS only, no assets).
- Home: mount under `enabled.us`.
- No push in v1 (same reason as the mood card): the sticky waits on Home.

## Relevant Files

- `supabase/migrations/20261015210000_nido_push_nudges.sql` — the nudges analogue.
- `app/src/features/nudges/useNudges.ts` — a small realtime card in the same shell.
- `app/src/features/home/HomePage.tsx` — where the card mounts.

## Verification Procedure

- Two-account: send a sticky → it appears on the partner's Home live; dismiss → gone for
  both; retract → same; empty sends are rejected.
- `cd app && npm run build && npm run lint`; `node tools/scaffold.mjs records check`.

## Notes

- Body limited (~200 chars): it is a sticky note, not a document.
- Owner step: paste `apply-stickies.sql`, then the two-account pass.

## Touch History

- 2026-10-16 — VITTORIOGIORDANOYBQ — created
- 2026-10-16 — status Proposed → In Progress

- 2026-10-16 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented: migration `20261016160000_nido_stickies.sql` (`stickies`: 1–200 chars, author/recipient in the same couple, immutable rows, member-read / author-insert / author-or-recipient-delete RLS, Realtime) with `apply-stickies.sql` and `apply-all.sql`; `features/stickies/useStickies.ts` (received/sent, send, dismiss, retract, restore) and `StickyCard` on Home (one-line composer, tilted notes, sent list, undo toast), gated by the Noi section.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
