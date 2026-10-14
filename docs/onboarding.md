# Onboarding

Welcome to <Project>! This guide gets you from zero to first contribution.

## Prerequisites

1. A configured git identity — `git config --global user.name` and `user.email`. Record IDs
   embed your `user.name` (normalized by `tools/git-identity.*`), so use the same name on
   every machine you work from. See `docs/development/IDENTITIES.md`.
2. Your agentic tool of choice: Claude Code or opencode.

## Setup

1. Clone the repository.
2. Configure git identity (above).
3. Refresh the scaffold. From an agent session that is the `/scaffold update` command; from a
   shell it is `sh tools/scaffold.sh update` (Windows:
   `powershell -ExecutionPolicy Bypass -File tools/scaffold.ps1 update`). It resolves the
   current version of the rules, commands and addons from the machine's npm registry (a
   template checkout runs its own engine), recreates the
   `.opencode` links, and prints what changed. `/scaffold` on its own (or
   `sh tools/scaffold.sh status`) tells you what is installed without changing anything.
4. Verify the project builds — project-specific steps are appended here by the installed
   addons.

## First task

1. Read `docs/agents/RULES.md` and `docs/agents/RULES.local.md`.
2. Run `/new-task <Name>` to create a task record before starting any non-trivial work.
3. Execute the work, keeping the task `In Progress` with `Owner` and `Next step` set.
4. Close the task (`Status: Done`, `Resolution`) when done.
5. File a Known Issue (`/new-issue`) for anything left broken.
6. Open a PR following the MR template.

## Next steps

- Read `docs/development/architecture/README.md` for the architecture doc map.
- Read `docs/agents/RULES.md` §Task-first workflow: find before create, claim a record (set
  `Owner` + `In Progress` + `Next step`) before starting, hand off explicitly, never orphan a
  superseded record.

## Questions?

Open an issue with the label `question` or ping the team.
