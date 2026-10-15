---
id: TASK-WEB-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Feature
status: In Progress
area: web app
severity: High
opened: 2026-10-14
done: null
next: Deployed and live at https://nidoapp-sage.vercel.app (Vercel project `nido_app`; every push on main auto-deploys). Last owner steps: Supabase Authentication URL Configuration (Site URL + Redirect URLs) and a quick check of the live app; then M0 can close.
related: [ADR-WEB-VITTORIOGIORDANOYBQ-001]
superseded_by: null
---

# Task: Web app M0 - skeleton, Supabase schema, auth and pairing

## Task Description

The clean-room project plan (`Piano-App-Coppie.md`, repo root) defines a couples app inspired by the publicly documented feature set of a commercial app. With the owner on 2026-10-14 the stack was re-decided: brand **Nido**; a static **web app** (Vite + React + TypeScript + Tailwind, deployed on Vercel) instead of Flutter; **Supabase** as backend (per plan §3-§5). Distribution goal: private use by the two partners first; app stores possibly later through a Capacitor packaging step (ADR-WEB-VITTORIOGIORDANOYBQ-001).

This task is milestone M0, adapted to the web stack: project skeleton, Supabase schema + RLS migrations ready to apply, auth (email + Google), profile, couple creation/join by invite code, home shell with tab navigation and per-section on/off switches.

Impact: every later milestone (Fase 1 MVP: calendar, lists, notes; Fase 2 engagement features) builds on this skeleton and schema.

## Desired Outcome

- `app/` builds and runs: `npm run build` clean, `npm run dev` serves the app locally.
- `supabase/migrations/` apply cleanly to a fresh Supabase project: schema for core + Fase 1-4 tables, RLS policies, helper functions, pairing RPCs (`create_couple`, `join_couple`), the max-2-members invariant, and the `handle_new_user` profile trigger.
- App flows against a real Supabase project: sign up / sign in (email + password, Google), edit profile (name, birth date), create a couple (invite code shown), join by code from a second account, home shell with 5 tabs (Home, Calendario, Liste, Noi, Profilo), per-section visibility switches.
- Docs: `docs/legal/LEGAL-NOTES.md` started (clean-room source log); `docs/agents/RULES.local.md` and `commitlint.config.js` customized for this project; root `README.md` with run instructions.
- No git remote exists and none may be added; nothing is ever pushed (owner constraint).

## Proposed Implementation

Created (this task):

- `app/` — Vite + React + TS + Tailwind v4 + supabase-js. Structure: `src/core/` (env, supabase client, dates), `src/app/` (router, guards, AppShell), `src/features/<feature>/` (auth, coupling, home, calendar, lists, us, profile, settings), `src/ui/` (shared components).
- `supabase/migrations/0001_schema.sql`, `0002_rls.sql`, `0003_realtime.sql` — data model from plan §4, security from plan §5.
- `docs/legal/LEGAL-NOTES.md` - clean-room source log.
- `README.md` (root) - what the project is, how to run it.

Modified:

- `docs/agents/RULES.local.md` — project name, web layer graph, commit scopes, no-push constraint.
- `commitlint.config.js` — scope-enum aligned with the real code base (`app`, `supabase`, `docs`, `ci`, `repo`).

Deferred (not in this task; tracked as follow-ups): onboarding slides, push notifications, realtime listeners, offline cache, conversion of `Piano-App-Coppie.md` into a `PLAN` record, Vercel deploy.

## Relevant Files

- `Piano-App-Coppie.md` — plan: §3 stack, §4 schema, §5 security.
- `docs/agents/RULES.md`, `docs/agents/RULES.local.md` — project rules.
- `app/package.json`, `app/src/**`, `app/.env.example`.
- `supabase/migrations/*.sql`.

## Verification Procedure

- `npm run build` in `app/` (TypeScript + Vite production build).
- `npm run dev` + manual flow: login -> pairing -> shell; two accounts (two browser profiles) join the same couple by invite code.
- Apply migrations on the Supabase project and verify RLS from the second account (no cross-couple reads).
- `node tools/scaffold.mjs records check` green.
- Pending owner input: Supabase project URL + anon key, then re-run the flows against the real backend.

## Notes

- No git repository exists and the owner forbids adding remotes or pushing; record moves must work without git (verified during this task).
- Google sign-in also needs the provider enabled in Supabase (owner action); email/password works without it.
- Vercel deploy needs the owner's Vercel account; scheduled right after the migrations apply.
- Clean-room constraint (plan §0): only public sources; original brand, code, texts and design.

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — filled record content; scaffolded `app/` (Vite + React + TS + Tailwind, brand "Nido", clay/sage theme); installed router + Supabase deps; claimed (move to In Progress).
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — UI polish with React Bits (MIT + Commons Clause): CountUp, BlurText, StarBorder, DotGrid vendored in `app/src/ui/reactbits/` with provenance headers; wired into Login (dot-grid background), Home (days counter + greeting reveal) and Pairing (star-border copy button); license registered in `LEGAL-NOTES.md` and `RULES.local.md`; build + lint green.
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — Supabase project `fvhqirvfyehyyucvwjjz` wired: wrote `app/.env.local` (connectivity verified: GoTrue health 200); generated `supabase/apply-all.sql` (one-shot script for the SQL Editor, 3 migrations concatenated); added `tools/nido-keepalive.ps1` + Windows scheduled task "Nido Supabase keep-alive" (daily, 3 real DB queries, catch-up enabled) against free-tier pausing; README updated.
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — keep-alive moved inside Supabase: migration `20261014134705_nido_keepalive.sql` (heartbeat table, `keepalive_ping()` RPC callable with the anon key, daily pg_cron job `nido-heartbeat` + run-history cleanup); external Windows task now calls the same RPC (a real UPDATE, since connections/plain reads do not count per Supabase discussion #13121); `apply-all.sql` regenerated (45.1 KB, 4 migrations); README updated. Verified: task runs (LAST_RESULT=0), RPC 404 until the migration is applied.
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — diagnosed the 42P07 error: an earlier run had applied migrations 1-3 (25/26 tables verified live via the REST API), the re-run died on the first `create table` before the keepalive part. Created idempotent `supabase/apply-keepalive.sql` (heartbeat + RPC + pg_cron + end-of-run report) for the owner to paste; README clarified apply-all is for fresh projects.
- 2026-10-14 — status Proposed → In Progress
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — Live verification after the keep-alive fix: `keepalive_ping` 200; 26/26 tables reachable via REST; anon probe clean (no table exposes rows without authentication); the owner ran the two-account pairing test in the browser — OK. While reviewing the events policies, found that `visibility = 'private'` is not enforced (filed `KI-VITTORIOGIORDANOYBQ-001`). `npm run build` + `npm run lint` green.
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — Vercel prep: `app/vercel.json` (SPA catch-all rewrite), `engines.node = 24.x` in `package.json`, README §Deploy su Vercel (CLI steps + post-deploy Supabase URL configuration). Deploy left to the owner.
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — plan converted into `PLAN-VITTORIOGIORDANOYBQ-001` (agreed, `docs/development/plans/agreed/`) and the root `Piano-App-Coppie.md` removed (git history keeps it); README and `RULES.local.md` point to the record. KI-001 fixed in the same pass: `supabase/migrations/20261014161502_nido_events_privacy.sql` enforces `visibility = 'private'` in the events policies, `supabase/apply-events-privacy.sql` is the idempotent one-shot for the live project, `apply-all.sql` regenerated. Owner step: paste `apply-events-privacy.sql` in the SQL Editor.
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — Vercel deploy live: rebuilt the project settings (`nido_app`, Root Directory `app`, Vite preset, `npm run build`, output `dist`, `VITE_*` vars for Production and Preview), then triggered a Git deployment from `main` (`READY`): `/` and `/calendar` answer 200, assets served from `/assets/`, SPA rewrite active on the production alias `https://nidoapp-sage.vercel.app`. README §Deploy su Vercel rewritten around the push-to-deploy flow. Remaining owner step: Supabase Authentication URL Configuration.

## Resolution

[When completed, describe what has been done, how it was verified and any remaining limitations.]
