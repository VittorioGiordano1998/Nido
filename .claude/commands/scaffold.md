---
description: Inspect and change the installed scaffolding — status, add, remove, update, adopt
argument-hint: [status | list | add <addon...> | remove <addon...> | update [<addon>...] | adopt [<addon>...]]
---

# /scaffold

Drive the scaffolding from chat through the MCP tools. Every write goes through
`scaffold_plan` first (the dry run) and `scaffold_apply` second, so what would change is shown
before anything is written.

Never edit a file the scaffold manages to get a result; change the addon upstream, or put
the content where the project owns it (`docs/agents/RULES.local.md`, a `once` file). See
`docs/agents/RULES.md` §Addons.

## What to call

`$ARGUMENTS` selects one. With no arguments, run **status**.

### status (default)

Call `scaffold_status`. Report back, in this order: installed addons and versions;
anything `drifted` or `missing`; the token set; available upgrades. If
something drifted, name the files and say what the fix is — move the change into
`RULES.local.md`, a `once` file, or an addon, then `update` — rather than suggesting the
file be edited back by hand.

### list

Call `scaffold_list`. When the user is choosing, read the candidate addon's `README.md`
from the source and summarise what it installs before they commit to it.

### add `<addon...>`

1. Check the worktree is clean (`git status --porcelain`); if not, stop and ask the user to
   commit or stash — the engine refuses a dirty tree, and that refusal is what keeps
   `git checkout` a valid rollback.
2. Preview: `scaffold_plan` with `op: "add"`, `addons: [...]`.
3. Show the user what would change and get approval.
4. Apply: `scaffold_apply` with `op: "add"`, `addons: [...]`.
5. Read the new addon's `README.md` and report its manual steps (tokens to set, MCP paths,
   commitlint scopes) instead of leaving them for the user to find.
6. Record it in the `## Addons installed` table in `docs/agents/RULES.local.md`.

Required addons come along automatically; tokens given at install time are remembered, so
pass `tokens` only to set or change one.

### remove `<addon...>`

Same clean-tree check and `scaffold_plan` preview. The engine refuses to remove an addon
another one requires; if that happens, report which ones depend on it and ask before retrying
with `cascade: true`. After removing, drop its row from the `RULES.local.md` table.

### update `[<addon>...]`

1. Clean-tree check.
2. `scaffold_plan` with `op: "update"` — this is the one to always show the user first,
   because **upstream wins**: files the scaffold manages are restored to the template version.
3. `scaffold_apply` with `op: "update"`.
4. If the run reports backups, list what was backed up and where (`.scaffold/backup/<timestamp>/`),
   and check whether anything in there was a deliberate project change that now needs a proper
   home (`RULES.local.md`, a `once` file, or an addon).

### adopt `[<addon>...]`

Convert a repo that carries an older, hand-installed scaffold into the current one. The old
shape is `extensions/<id>/install.*` plus `BEGIN/END EXTENSION` blocks, no `.scaffold/` state
and no `tools/scaffold.*`; the engine detects it by that shape and by nothing else. Unlike
`init`, adopt also removes what the legacy install left behind and files the records.

1. Clean-tree check. The target must not already carry `.scaffold/addons.json` — that
   project wants `status` / `update`, not adopt.
2. Preview: `scaffold_plan` with `op: "adopt"` and the tokens (`Company`, `Project`,
   `Prefix`, ...). Show the user the detected evidence, the scored addon set and every
   planned removal before approving.
3. Apply: `scaffold_apply` with `op: "adopt"`. A declared token that still resolves to its
   `<Placeholder>` default is refused unless `allowPlaceholders: true` is passed on purpose —
   adopt must never rewrite an already-substituted file with a placeholder.
4. Name the set explicitly (`addons: ["unity", "unity-app-ui"]`) when the score suggests
   nothing, or suggests more than the project had.
5. Report the manual checklist the run prints (CI image, `RULES.local.md`, CODEOWNERS,
   commitlint scopes, IDENTITIES), the backup directory, and then run `status` and
   `records check` to confirm.

The terminal has the same under `sh tools/scaffold.sh adopt --token Company=Acme --token
Project=Widget` (or `tools\scaffold.ps1 adopt ...`).

## Conventions

- Always preview with `scaffold_plan` before a write, and show the user the plan.
- Never pass `allowDirty: true` to work around a dirty tree; ask the user to commit first.
- Never pass `--keep-local` to preserve an edit to a managed file. It hides a fork instead of
  fixing it; move the change to where the project owns it.
- `offline: true` exists for when the template repository is unreachable; say so rather than
  reporting a stale state as current.