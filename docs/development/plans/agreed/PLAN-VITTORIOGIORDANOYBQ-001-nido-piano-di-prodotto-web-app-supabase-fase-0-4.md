---
id: PLAN-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
type: Major
status: Agreed
date: 2026-10-14
supersedes: null
superseded_by: null
---

# Nido - product plan (web app + Supabase, Fase 0-4) (plan)

## Goal

Nido is the private space of a couple: a shared calendar, lists, notes and small rituals
to do as two. This plan delivers a **static web app** (Vite + React + TypeScript + Tailwind,
deployed on Vercel) with **Supabase** as the backend (Postgres + RLS, Auth, Realtime,
Storage, Edge Functions) and tracks the roadmap through Fase 4.

It replaces the former root document `Piano-App-Coppie.md`, converted into this record on
2026-10-14 and removed from the tree (git history keeps it). Distribution goal: private use
by the two partners first; app-store distribution later, possibly through a Capacitor
packaging step (ADR-WEB-VITTORIOGIORDANOYBQ-001).

Clean-room constraints (original section 0, still binding): only public sources define the
feature set; original code, design, texts and brand; the consulted sources are logged in
`docs/legal/LEGAL-NOTES.md`.

## Phases

| Phase | Delivers | Gate |
| ----- | -------- | ---- |
| M0 - Foundations | Auth (email + Google), profile, couple create/join by invite code (max 2 members), home shell with 5 tabs, per-section switches; full Supabase schema + RLS for Fase 0-4; pairing RPCs; free-tier keep-alive | `npm run build` clean; two-account pairing verified live; RLS probes (no cross-couple rows, no anonymous rows); deploy on Vercel with refresh on a deep route |
| **M1 - MVP** | **Shared calendar (events, all-day, couple/private visibility, realtime), lists (multiple, check items, assignment, realtime), notes (title + body, realtime), base push notifications, home summary (next events, open tasks, days together)** | **Manual two-account flows per feature; a private event is invisible to the partner through the API; `npm run build` + `npm run lint` green** |
| M2 - Engagement | Question of the day (100-question bank, hidden answers, streak), blind decisions with reveal, wishlist + gift radar, partner facts, time capsules, weekly plan, nudges | Manual two-account flows per feature; hidden data invisible until its reveal condition |
| M3 - Privacy and monetization | E2E document vault, cycle tracker, premium (paywall, IAP, per-couple entitlement), savings projects, loyalty cards | Vault: server never sees plaintext; cycle data owner-only verified; premium entitlement tested on a sandbox purchase |
| M4 - Polish | Realtime canvas, home widget, yearly recap, localization (IT/ES/EN/DE) | Manual pass on the packaged app; i18n coverage check |

M0 is delivered except the owner's Vercel deploy and Supabase URL configuration; M1
implementation started 2026-10-14.

## Decisions

1. **Stack (2026-10-14, ADR-WEB-VITTORIOGIORDANOYBQ-001):** static web app — Vite + React +
   TypeScript + Tailwind + supabase-js, deployed on Vercel — with Supabase as backend. The
   earlier Flutter/Riverpod/go_router decision (old section 3) is dropped; Capacitor is the
   later path to app stores.
2. **Brand:** Nido, original; no third-party trademark, text, asset or design reuse.
3. **Schema is code:** every schema change lands in `supabase/migrations/*.sql` (source of
   truth); dashboard-only edits are not allowed.
4. **RLS everywhere:** access through couple membership, with per-user privacy exceptions —
   `daily_answers` (both answered), `decision_votes` (revealed decisions), `time_capsules`
   (`opens_at`), `cycle_logs` (owner only) and `events` (`visibility = 'private'` readable by
   the creator only; enforced in RLS since 2026-10-14, KI-VITTORIOGIORDANOYBQ-001). Max 2
   members per couple enforced by trigger.
5. **Auth:** email + password and Google; Apple deferred to the packaged app. Email
   confirmation on.
6. **Language:** UI Italian; code, comments, docs and records English. No hard-coded
   endpoints or keys: the Supabase URL/anon key come from `app/.env.local` through
   `app/src/core/env.ts`; a missing value shows the in-app setup screen.
7. **Keep-alive (free tier):** pg_cron heartbeat inside Supabase (primary) plus a Windows
   scheduled task calling the same RPC (backup). Real transactions, not plain reads.
8. **Realtime:** Postgres changes for shared tables; the live canvas (M4) uses Broadcast and
   is not persisted server-side.
9. **Push (M1):** mechanism still to decide — Web Push (VAPID, PWA) versus FCM — tracked in
   the dedicated M1 push task.
10. **Offline:** online-first for the MVP; a persistent local cache is evaluated in M2 based
    on real usage.

## Files

| File | Change |
| ---- | ------ |
| `supabase/migrations/*.sql` | canonical schema, RLS, realtime publication, keep-alive |
| `supabase/apply-all.sql`, `supabase/apply-*.sql` | one-shot scripts for the SQL Editor (fresh project / targeted fix) |
| `app/src/**` | web client: `core/` (env, Supabase client, dates), `features/<feature>/` (state and views), `ui/` (shared components), `app/` (router, guards, shell) |
| `supabase/functions/**` | Edge Functions (from M1 on) |
| `docs/legal/LEGAL-NOTES.md` | clean-room source log |
| `docs/development/**` | records: tasks per milestone, KIs, this plan, ADRs |
| `README.md` | run, database and deploy instructions |
| `tools/nido-keepalive.ps1` | PC-side keep-alive backup |

## Tests

- `cd app && npm run build` — TypeScript + Vite production build.
- `cd app && npm run lint` — oxlint.
- `node tools/scaffold.mjs records check` — record registry green.
- Two-account manual flows (two browser profiles): auth, pairing, every M1 feature.
- RLS probes with the anon key and with a second account: no cross-couple reads; events with
  `visibility = 'private'` invisible to the partner; `cycle_logs` owner-only.
- Post-deploy: open the deployed URL and refresh on a deep route (e.g. `/calendar`) — the SPA
  rewrite must serve the app, not a 404.
- Keep-alive: `keepalive_ping` returns 200 with the anon key.

## Validation

- **M0 (2026-10-14):** migrations applied to project `fvhqirvfyehyyucvwjjz` (26/26 tables
  reachable via the REST API); `keepalive_ping` 200; anon probe clean; pairing verified in the
  browser by the owner; the events privacy gap found during that review is
  KI-VITTORIOGIORDANOYBQ-001, fixed in the same milestone.
- **M1 (in progress):** validated per feature as it lands; see the task records under
  `docs/development/tasks/`.
- **Not validated:** recurrence (RRULE) and local reminders (deferred within M1), push
  delivery (mechanism undecided), vault E2E (M3), app-store packaging (M4+).

## Backlog detail

Original feature inventory (Fase 0-4), kept as the roadmap reference.

### Fase 0 - Foundations (M0)

| # | Feature | Notes |
| - | ------- | ----- |
| 0.1 | Auth (email, Google) | Supabase Auth; Apple deferred to the packaged app |
| 0.2 | Onboarding + profile (name, avatar, birthday) | Onboarding slides deferred; profile page live |
| 0.3 | Couple creation + invite (code/QR) | Max 2 members; invite code live, QR deferred |
| 0.4 | Home shell with tab navigation | Home, Calendario, Liste, Noi, Profilo |
| 0.5 | Per-section on/off switches | Local per-device preference for now |

### Fase 1 - Usable MVP (M1)

| # | Feature | Notes |
| - | ------- | ----- |
| 1.1 | Shared calendar | Events, all-day, recurrences (RRULE), local reminders, couple/private visibility |
| 1.2 | Lists and shared tasks | Multiple lists (groceries, films, trips...), check items, realtime sync, assignment |
| 1.3 | Shared notes | Title + body, realtime editing |
| 1.4 | Base push notifications | Relevant partner changes |
| 1.5 | Home summary | Next events, open tasks, days together |

### Fase 2 - Engagement (M2)

| # | Feature | Notes |
| - | ------- | ----- |
| 2.1 | Question of the day | 100-question bank, answers hidden until both answered, streak |
| 2.2 | Blind decisions | What to eat/watch: hidden vote, two-way reveal |
| 2.3 | Wishlist + gift radar | Price/link, tied to birthdays and anniversaries from the calendar |
| 2.4 | Weekly plan ("doing together") | One proposal per week, accept/decline/alternative |
| 2.5 | Things to know | Facts about the partner (sizes, tastes, allergies) as cards |
| 2.6 | Time capsules | Notes that open on a chosen day |
| 2.7 | Partner nudge | Reminder with a playful message, one tap |

### Fase 3 - Privacy and monetization (M3)

| # | Feature | Notes |
| - | ------- | ----- |
| 3.1 | E2E document vault | Client-side encryption, blind server (design below) |
| 3.2 | Cycle tracker | Owner-only private log + optional shared summary |
| 3.3 | Premium | Paywall, IAP, per-couple entitlement, one subscription = premium for two |
| 3.4 | Savings projects | Goal, amount, deadline, progress bar |
| 3.5 | Loyalty cards | Barcode/QR codes stored |

### Fase 4 - Polish (M4)

| # | Feature | Notes |
| - | ------- | ----- |
| 4.1 | Realtime canvas | Two-way live drawing, PNG export, background/widget |
| 4.2 | Home widget | Days together + shared note |
| 4.3 | Yearly recap | Year-in-review statistics |
| 4.4 | Localization | IT (default), ES, EN, DE |

## Screens (web)

- **Fase 0:** Setup (missing env) -> Login -> Pair (create / join by code) -> app shell ->
  Profile.
- **Fase 1:** Home summary; Calendar (month, day agenda, event editor); Lists (index, detail);
  Notes (index, editor); Profile/settings.
- **Fase 2:** Question of the day (home card + section with streak and archive), Decisions
  (index, create, vote, reveal), Wishlist (index, detail, radar), Weekly plan, Things to know
  (card grid), Capsules (index, editor, opening).
- **Fase 3:** Vault (category index, upload, viewer, key setup), Cycle (personal calendar,
  log editor, share summary), Paywall, Savings, Cards.
- **Fase 4:** Canvas (board, palette, save), Widget config, Recap (slides).

## Data model

Postgres, schema `public`, `couple_id` on every "couple" table, RLS on everywhere; the
canonical DDL is `supabase/migrations/*.sql`:

- **Core:** `profiles`, `couples`, `couple_members`, `device_keys`, `push_tokens`.
- **Fase 1:** `events` (timestamptz range, `all_day`, `rrule`, `visibility`), `task_lists`,
  `tasks`, `notes`.
- **Fase 2:** `question_bank`, `daily_answers`, `decisions`, `decision_votes`,
  `wishlist_items`, `partner_facts`, `time_capsules`, `week_plans`, `nudges`.
- **Fase 3:** `vault_items`, `vault_keys`, `cycle_logs`, `cycle_shares`, `savings_projects`,
  `loyalty_cards`.
- **Fase 4:** `canvases` (final PNG on Storage; live strokes go over Realtime Broadcast).

Pairing and profile creation go through `create_couple` / `join_couple` RPCs and the
`handle_new_user` trigger.

## Security

RLS helper (SECURITY DEFINER, so policy subqueries never recurse):

| Table | SELECT | INSERT/UPDATE/DELETE |
| ----- | ------ | -------------------- |
| `events` | `is_couple_member(couple_id)` and (`visibility = 'couple'` or `created_by = auth.uid()`) | same rule for update/delete; insert requires `created_by = auth.uid()` |
| `task_lists`, `tasks`, `notes`, `wishlist_items`, `partner_facts`, `savings_projects`, `loyalty_cards`, `week_plans`, `decisions` (base) | `is_couple_member(couple_id)` | as select + `created_by = auth.uid()` at insert |
| `daily_answers` | own row, or both partners answered the same question/day | own row only |
| `decision_votes` | own vote, or the decision is revealed | own vote only |
| `time_capsules` | creator always; partner only once `opens_at <= current_date` | creator only |
| `cycle_logs` | owner only (`user_id = auth.uid()`) | owner only |
| `cycle_shares` | couple | owner only |
| `vault_items` / `vault_keys` | couple (payload is encrypted, the server is blind) | couple |

**E2E vault (M3 design):** every device generates an X25519 key pair; at pairing a device
creates the couple key and wraps it for both; new devices are approved by an existing one.
Files are AES-256-GCM with a random nonce, stored in private Storage buckets; the server
never holds the key. Web adaptation of the original `flutter_secure_storage` plan
(non-extractable WebCrypto keys in IndexedDB, optional recovery phrase) is a decision for M3.
Losing every device means losing vault data by design.

**GDPR/store:** account deletion Edge Function (account + couple data); the cycle section is
health data (explicit consent, minimization, never auto-synced to the partner); Google Play
Data safety and Apple App Privacy forms before store publication.

## Realtime, push and Edge Functions

- **Realtime (Postgres changes):** `events`, `task_lists`, `tasks`, `notes`, `wishlist_items`,
  `decisions`, `decision_votes`, `daily_answers`, `partner_facts`, `savings_projects`,
  `loyalty_cards`, `week_plans`, `couple_members`.
- **Broadcast (ephemeral):** channel `couple:{id}:canvas` for live drawing strokes (M4).
- **Edge Functions (planned):** `send-push` (webhook on `nudges` insert), `gift-radar` (daily
  cron), `revenuecat-webhook`, `delete-account`.
- The question of the day needs no cron: deterministic client-side selection (hash of date +
  couple over the question bank index).

## Risks and open decisions

| Risk / decision | Note |
| --------------- | ---- |
| E2E multi-device flow | New-device approval is the most delicate part; prototype early (M3) |
| Offline | Online-first for MVP; partial read-only cache acceptable? |
| Costs | Supabase free tier is enough to start; FCM free; RevenueCat free until ~2.5k$ MRR |
| RevenueCat vs native IAP | Decide when the packaged app and premium land (M3) |
| Push mechanism | Web Push (VAPID) versus FCM — decide in M1 |
| Question bank content | 100 original questions in it/es/en/de to write |
| Store packaging | Capacitor step after private use; store review and payments then |
