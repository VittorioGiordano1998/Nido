---
id: TASK-PROF-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: profile and personalization
severity: Medium
opened: 2026-10-14
done: null
next: Implemented and green (tokens + dark theme + 4 accents, PreferencesProvider, profile cards, password change, migration + apply script); the live project needs the owner's paste of apply-profile-preferences.sql, then a visual pass on two devices.
related: []
superseded_by: null
---

# Task: Profile personalization: theme, accent and password change

## Task Description

M-profile. The app is light-only with a fixed palette (views hard-code stone/clay classes in `app/src/index.css` + TSX) and `profiles` carries no appearance preferences; the password can only be chosen at sign-up.

Impact: theme and accent choice is the first thing a couple looks for in a settings screen, dark mode is a comfort requirement on mobile, and changing your own password is a basic account capability. Owner request, outside the agreed plan milestones.

## Desired Outcome

- `profiles.theme` ('light' | 'dark' | 'system', default 'system') and `profiles.accent` (preset id, default 'terra') hold the preferences synced across the account's devices (RLS already restricts profiles updates to the owner).
- A "Personalizzazione" card in Profilo: theme chooser (Sistema / Chiaro / Scuro) and an accent swatch picker; a "Sicurezza" card changes the password (Supabase Auth).
- The whole app honors theme and accent at runtime: semantic tokens driven by `[data-theme]` / `[data-accent]` on `<html>`, no flash on reload (pre-paint cache), native controls follow `color-scheme`.
- `npm run build` + `npm run lint` green; records check green.

## Proposed Implementation

- `supabase/migrations/20261014181000_nido_profile_preferences.sql` (NEW): `alter table public.profiles add column theme/accent` with check constraints and defaults.
- `supabase/apply-profile-preferences.sql` (NEW): idempotent one-shot for the live project; `apply-all.sql` regenerated for fresh projects.
- `app/src/index.css`: semantic neutral tokens (canvas / surface / ink / line) and the accent scale as CSS variables; `[data-theme='dark']` and `[data-accent='...']` overrides; `color-scheme`; a `dark` custom variant for the few fixed scales (sage, red).
- Views: migrate stone/cream/white/clay classes to the semantic tokens (mechanical, reviewed file by file); explicit `dark:` variants only where a fixed scale is used.
- `app/src/core/appearance.ts` (NEW): pure helpers — resolve 'system' via matchMedia, apply attributes, read/write the pre-paint cache; `index.html` gets the tiny pre-paint script.
- `app/src/features/settings/PreferencesProvider.tsx` (NEW): loads theme/accent from `profiles` on session, optimistic updates with rollback, matchMedia listener.
- `app/src/features/profile/useProfile.ts` (NEW): extract the page's profile load/save (Views must not call Supabase, RULES.local §Layers).
- `app/src/features/profile/PersonalizationCard.tsx` + `SecurityCard.tsx` (NEW); `ProfilePage.tsx` becomes composition only.
- `app/src/features/auth/AuthProvider.tsx`: `changePassword` via `supabase.auth.updateUser` + error translation.

## Relevant Files

- `supabase/migrations/20261014133039_nido_initial_schema.sql` — profiles table, trigger.
- `supabase/migrations/20261014133039_nido_rls_policies.sql` — profiles_update policy.
- `app/src/index.css` — palette and tokens.
- `app/src/main.tsx`, `app/src/app/AppShell.tsx` — provider order and shell.
- `app/src/features/profile/ProfilePage.tsx`, `app/src/features/settings/SettingsProvider.tsx`, `app/src/features/auth/AuthProvider.tsx`.
- `app/src/ui/components.tsx`, `app/src/ui/icons.tsx` — shared views and icons.

## Verification Procedure

- `cd app && npm run build && npm run lint` (on this machine via `cmd /c`).
- Manual, two devices/accounts: login → Profilo → Personalizzazione: pick Scuro (whole app dark, persists on reload and after re-login on the second device); pick an accent (buttons/links/chips follow); Sistema follows the OS toggle.
- Cambio password: wrong confirmation shows an inline error; changing then signing out and back in with the new password works.
- Re-paste `apply-profile-preferences.sql` in the SQL Editor: no error (idempotent).
- `sh tools/scaffold.sh records check` green.

## Notes

- Preferences are per user (profiles), not per couple; the "Sezioni attive" toggle stays per-device as-is.
- The accent preset list lives twice (SQL check constraint + TS constants) — keep them in sync when adding a preset.
- Only neutrals and the accent are token-driven; sage and red stay fixed scales with explicit `dark:` variants at their few sites.
- Theme 'system' is resolved client-side (matchMedia) and stored verbatim.
- If the project enables "secure password change" server-side, `updateUser` surfaces the reauth error — shown inline by the card.
- Live project needs the owner's paste of `apply-profile-preferences.sql` before the UI works (same flow as the other apply-* one-shots).

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-14 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — claimed; implementation starting (migration + token refactor + provider + profile UI).
- 2026-10-15 — VITTORIOGIORDANOYBQ — opencode (DeepSeek V4.1 Flash) — implemented the slice: semantic tokens (canvas/surface/ink/line) + dark theme + 4 accent presets in `app/src/index.css`, pre-paint script in `app/index.html`, `core/appearance.ts`, `settings/PreferencesProvider.tsx` (optimistic with rollback), profile split into cards (`ProfileCard`, `PersonalizationCard`, `SecurityCard`, `CoupleCard`, `SectionsCard`) with `useProfile`, `changePassword` in `AuthProvider`, migration `20261015101500_nido_profile_preferences.sql` + `apply-profile-preferences.sql` + regenerated `apply-all.sql`; 18 view files migrated off stone/clay/cream literals; `npm run build` + `npm run lint` green.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
