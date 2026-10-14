# Agentic Tools

This project supports both **Claude Code** and **opencode**.

## Shared rules

Canonical rules live in [`docs/agents/RULES.md`](../agents/RULES.md). Both tools read from
this file so there is one source of truth.

## Agents, commands, and skills — defined once

Agent and command definitions live **only** in `.claude/`. They are written so both tools
accept the same file: Claude Code reads `name`/`description`, opencode reads
`description`/`mode`, and each ignores the keys it does not know. Never copy a definition
into `.opencode/` — a second copy is a second thing to keep correct.

- `.claude/agents/` — subagents (e.g. `docs-keeper`).
- `.claude/commands/` — slash commands (`/new-task`, `/new-issue`, `/new-dg`, `/commit`).
- `.claude/skills/` — skills added by addons.

opencode already scans `.claude/skills/` on its own, so skills need no help. It does *not*
scan `.claude/agents/` or `.claude/commands/`, so `.opencode/agents` and `.opencode/commands`
are links pointing back at the `.claude/` originals. They are gitignored — recreate them once
per clone:

```
powershell -ExecutionPolicy Bypass -File tools/link-agent-config.ps1   # Windows (junction, no admin)
sh tools/link-agent-config.sh                                          # macOS, Linux (symlink)
```

## Addons

Framework-specific agents, commands, skills and rule fragments come from addons, which
live in the scaffold template rather than in this repository. In an agent session, manage them
with the `/scaffold` command (`/scaffold list`, `/scaffold add <name>`, `/scaffold update`,
`/scaffold remove <name>`); it wraps the bootstrap below and previews every change with
`--dry-run` first. From a shell:

```sh
sh tools/scaffold.sh status          # what is installed, what drifted, what can be upgraded
sh tools/scaffold.sh list            # what the template offers
sh tools/scaffold.sh add <name>      # install one (its dependencies come with it)
sh tools/scaffold.sh remove <name>   # take it back out
sh tools/scaffold.sh update          # pull the current upstream version of everything
```

Add `--dry-run` to any of them to see the plan without writing. On Windows use
`tools/scaffold.ps1` with the same arguments.

## Claude Code

Config lives in `.claude/`:

- `.claude/settings.json` — hooks, permissions. Machine-specific permissions go in the
  gitignored `.claude/settings.local.json`.
- `.claude/CLAUDE.md` — repo-level index pointing to RULES.md.

## opencode

Config lives in `.opencode/`:

- `.opencode/opencode.json` — instructions reference; addons register their MCP servers
  here and in `.mcp.json` (Claude Code), through the engine's merge ops.
- `AGENTS.md` (repo root) — same content as `.claude/CLAUDE.md`.
- `.opencode/skills/` — skills opencode needs that Claude Code gets from plugins instead.

## Onboarding

1. Pick your tool (Claude Code or opencode).
2. opencode only: run the link script above.
3. Read `docs/agents/RULES.md`.
4. Run `/new-task MyFeature` — or, when an installed addon documents a
   first-contribution shortcut of its own, that one — to scaffold your first contribution.

## Task-first workflow

An agent asked to do non-trivial work creates the tracking records itself, in this order
(see `docs/agents/RULES.md` §Task-first workflow). Record IDs are owner-qualified —
`TASK-<AREA>-<OWNER>-<NNN>`, `KI-<OWNER>-<NNN>`, `DG-<OWNER>-<NNN>` — where `OWNER` is
resolved by `tools/git-identity.*`, so two agents can never mint the same record:

1. **Find before create** — search the folder indexes (`TASK_INDEX.md`,
   `KNOWN_ISSUE_INDEX.md`, `DELIVERY_GAP_INDEX.md`, `PLAN_INDEX.md`, `ADR_INDEX.md`) for an
   existing record covering the work; if one exists, claim it (set `owner`, then
   `records move <ID> "In Progress"`) instead of creating a sibling.
2. `/new-task <Name>` — create the task record in `docs/development/tasks/proposed/` before
   executing.
3. Execute the work, keeping the task `In Progress` (file in `tasks/in-progress/`) with
   `owner` and `next` set.
4. Write the `Resolution`, then `sh tools/scaffold.sh records move <ID> Done` — one command
   for the status, the date, the move to `tasks/done/`, the Touch History entry and the index
   (RULES.md §Task-first workflow step 5).
5. `/new-issue <Title>` — file a `KI-<OWNER>-<NNN>` known issue for any unresolved problem the
   work leaves behind.
6. `/new-dg <Title>` — file a `DG-<OWNER>-<NNN>` delivery gap for missing milestone work or
   config gaps that are not defects.
7. `sh tools/scaffold.sh records sync` after creating a record — the record indexes are
   generated, never hand-edited (RULES.md §Task-first workflow step 11).

See `docs/onboarding.md` for the full first-time walkthrough.
