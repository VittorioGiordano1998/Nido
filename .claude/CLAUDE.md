# <Project>

This repository follows the AI-support scaffolding. See the docs for architecture,
contributing, and feature details.

## Quick links

- `docs/agents/RULES.md` — canonical rules for all agentic tools (company-wide, upstream-owned).
- `docs/agents/RULES.local.md` — this project's own rules. Same authority as RULES.md.
- `docs/development/architecture/README.md` — architecture doc map.
- `docs/onboarding.md` — first-time contributor guide.
- `CONTRIBUTING.md` — commits, PRs, code style.
- `tools/scaffold.*` — scaffold bootstrap: `init` / `add` / `remove` / `update` / `status`.
  It runs the engine from the upstream template, never a local copy.

## Before your first change

Read, in this order:

1. `docs/agents/RULES.md` and `docs/agents/RULES.local.md` — the rules that govern every change.
2. `docs/development/architecture/README.md` — the architecture doc map.
3. `docs/onboarding.md` — how this project sets up and makes its first contribution.
4. `CONTRIBUTING.md` — commits, PRs, code style.
5. The README of every installed addon — `sh tools/scaffold.sh status` lists them; each
   one adds rules and shortcuts of its own.

## Agent shortcuts

- `/new-task <Name>` — create a task record from `TASK_TEMPLATE.md`.
- `/new-issue <Title>` — create a `KI-<OWNER>-<NNN>` known-issue record from `KNOWN_ISSUE_TEMPLATE.md`.
- `/new-dg <Title>` — create a `DG-<OWNER>-<NNN>` delivery-gap record from `DELIVERY_GAP_TEMPLATE.md`.
- `/commit` — commit changes, split into one Conventional Commit per area, after user approval.
- `/scaffold [status | list | add <addon> | remove <addon> | update | adopt [<addon>...]]` — inspect
  and change the installed scaffolding. Every scaffold operation goes through this command,
  never a hand edit of a managed file.

Installed addons add shortcuts of their own. `sh tools/scaffold.sh status`
lists what is installed; each addon's README documents the shortcuts it adds.

## Workflow

**Task-first:** before executing non-trivial work, create the task record in
`docs/development/tasks/` (from `TASK_TEMPLATE.md` or `/new-task`); when done, close it with
`Status: Done` and a `Resolution`. File any unresolved problem as a Known Issue
(`docs/development/known_issues/`, `/new-issue`). See `docs/agents/RULES.md` §Task-first workflow.

## Rules

**`docs/agents/RULES.md` + `docs/agents/RULES.local.md` are the single source of truth — read both before changing code.**
Do not restate their rules here; a second copy is a second thing to keep correct, and the
copy is what goes stale. Orientation only:

- Layers run one way. The project-specific graph is in `docs/agents/RULES.local.md` §Layers.
- No hard-coded strings, colors, or endpoints (project-specific rules in RULES.local.md).
- Keep the record indexes in sync — the CI `records` job enforces them
  (`docs/contributing/ci-cd.md`).
- Never edit a file the scaffold manages: upstream wins on the next update. Project content
  goes in `RULES.local.md`, in a `once` file, or in an addon.
