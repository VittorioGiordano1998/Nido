# Project rules — Nido

Companion to `RULES.md`, with the same authority. `RULES.md` is company-wide and replaced by
every scaffold update; **this file is yours** — the scaffold creates it once and never
writes to it again. Everything true only of this project goes here.

## Naming

- Plain `PascalCase` for types and React components; `camelCase` for functions and variables.
  No project type prefix: the code base is TypeScript only, nothing collides with framework
  names.
- No namespaces: imports are path-based under `app/src/`.

## Layers

The client is a static web app (`app/`); the backend is Supabase (`supabase/`).
Allowed dependency direction in `app/src/`:

```
Views -> Features (providers/state) -> Core
```

- `ui/` (shared components) and the page/component files under `features/<feature>/` are
  **Views**. No direct Supabase calls, no data fetching: data comes through providers/hooks.
- `features/<feature>/` providers and hooks are the **state** layer. They own
  fetching/mutations and are the only layer allowed to talk to Supabase.
- `core/` is the **foundation**: env access, the single Supabase client, pure utilities.
  It imports nothing from `features/` or `ui/`.
- `app/` (router, guards, shell) wires Views to state; it holds no data logic.

Never the reverse. The database schema has a single source of truth:
`supabase/migrations/*.sql` — every schema change lands there, never only in the dashboard.

## Commit scopes

| Scope | Covers |
| --- | --- |
| `app` | the React web app (`app/`) |
| `supabase` | migrations and Edge Functions (`supabase/`) |
| `docs` | documentation and records |
| `ci` | pipeline configuration |
| `repo` | repository-wide chores |

## Project conventions

- **No git remote, no push.** This project is private and local: never add a remote and never
  push anywhere. Record moves and index regeneration work without a git repository.
- UI language is Italian; code, comments, docs and records are English.
- No hard-coded endpoints or keys: the Supabase URL and anon key live in `app/.env.local`,
  read through `app/src/core/env.ts`. A missing value shows the in-app setup screen instead
  of crashing.
- Clean-room constraints (plan §0): original code, design, texts and brand; only public
  sources; keep `docs/legal/LEGAL-NOTES.md` updated when a public source is consulted.
- Vendored third-party UI components live in `app/src/ui/reactbits/` (source + license
  header per file, registered in `docs/legal/LEGAL-NOTES.md`). They stay Views: no app logic
  inside, theme colors mapped to the clay/sage tokens.
- On this machine npm must be run through `cmd /c` (the PowerShell execution policy blocks
  the `.ps1` shims).
- Product plan lives in `Piano-App-Coppie.md` (repo root); the stack decision is recorded in
  `ADR-WEB-VITTORIOGIORDANOYBQ-001`.

## Addons installed

| Addon | Why this project needs it |
| --- | --- |
| `core` | base scaffold: rules, records, agent wiring |
