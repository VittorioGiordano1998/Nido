---
id: ADR-WEB-VITTORIOGIORDANOYBQ-001
owner: VITTORIOGIORDANOYBQ
status: Accepted
date: 2026-10-14
accepted: 2026-10-14
deciders: [Vittorio Giordano]
superseded_by: null
---

# ADR: Nido client stack - static web app (Vite + React + TS) on Vercel

## Context

The project plan (`Piano-App-Coppie.md`, 2026-10-14) described a Flutter + Supabase app for two phones. The owner asked to evaluate a browser-delivered web app before committing to Flutter, with these facts on the table:

- the machine has Node 24 and Android Studio, but **no Flutter SDK** (a ~1 GB install);
- the product is a private, login-gated app for two people: no SEO, no marketing pages, no public content;
- distribution goal today is "the two of us, stores maybe later";
- store-specific features in the plan (home-screen widget, IAP, native keychain) are all Fase 3–4 items, far from now;
- the backend (Supabase: Postgres + RLS + Realtime + Storage + Edge Functions) is unchanged by the client choice, so plan §4/§5 survive either way.

The dominant cost drivers are iteration speed (the owner tests on two real phones) and time-to-first-usable-MVP.

## Decision

Build Nido as a **static single-page web app**:

- **Vite + React 19 + TypeScript + Tailwind CSS v4**, routing with React Router, Supabase access through `@supabase/supabase-js` directly from the client (RLS is the authorization boundary).
- **No SSR framework** (no Next.js): the app is fully behind auth, SEO is irrelevant, and a static bundle keeps every future packaging option open.
- **Deploy on Vercel** (free tier) from the start: HTTPS URL is required for camera (QR pairing) and push testing on real phones.
- **PWA capabilities** (installable, service worker) added incrementally, not in M0.
- **App stores, if ever**: the same codebase gets packaged with **Capacitor** (native push, IAP via RevenueCat's Capacitor SDK, native secure storage); no rewrite is required. The home-screen widget (plan §4.2) is the one feature a web app cannot deliver and would need a native companion.
- This decision **supersedes the Flutter stack** of `Piano-App-Coppie.md` §3; the plan document will be converted to a `PLAN` record with this stack.

## Consequences (positive / negative / neutral)

Positive:

- No SDK install; instant dev loop; the owner previews changes on both phones by opening a URL.
- No store review, no store fees, instant updates; testing with two accounts is trivial.
- Supabase schema, RLS, Realtime and Edge Functions from plan §4-§5 apply unchanged.
- Capacitor keeps the store path open without a rewrite.

Negative:

- **Home-screen widget** (plan §4.2) is not deliverable in a PWA; dropped until a native companion exists.
- iOS push notifications require the PWA to be installed to the Home Screen (iOS 16.4+); Android works without installation.
- **E2E vault** (plan §3.1) must be redesigned: WebCrypto with non-extractable keys instead of OS keychain (`flutter_secure_storage` equivalent does not exist on the web).
- Web Safari/PWA quirks (keyboard, storage eviction) may need attention; the feel is not 100% native.

Neutral:

- Premium/IAP would become web payments (e.g. Stripe) if sold before stores; RevenueCat returns to the table only with Capacitor.
- Offline behavior is web-standard (service worker + IndexedDB) rather than drift/sqlite.

## Alternatives considered

- **Flutter (web + mobile)** — one Dart codebase for web and native; rejected for the ~1 GB SDK + slower iteration on this machine, and because web output of Flutter is the weakest target of the three for a mobile-Safari audience.
- **Flutter mobile-only (original plan)** — rejected by the owner in favour of browser delivery now; revisit only if the store path becomes primary.
- **Next.js** — rejected: SSR adds no value behind auth and complicates static hosting and the Capacitor path.
- **React Native / Expo** — rejected: store distribution from day one, which is explicitly not the goal now.

## Implementation

[When the ADR moves to `implemented/`: what landed (code/docs/contracts), the implementing task
and commit, and how it was verified. Leave empty while the ADR is Proposed or Accepted.]

## Touch History

- 2026-10-14 — VITTORIOGIORDANOYBQ — created
- 2026-10-14 — opencode (DeepSeek V4.1 Flash) — filled record; owner approved the web stack during the decision session (React + Vercel); moved to Accepted.
- 2026-10-14 — status Proposed → Accepted
