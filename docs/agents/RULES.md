# Rules for Agentic Tooling

This file is the single source of truth for AI agents (Claude Code, opencode, ...) working
in this repository. Read it before changing code.

## Naming

Two type-naming styles are in play, and which one applies is decided by *where the type
lives*, not by preference:

- **Project-prefixed public types — `<Prefix>PascalCase`** (`XrsTool`, `XrsUIAssets`). Use
  the prefix only where an unprefixed name would collide with a framework or platform type,
  or where the name is meaningless without it. `<Prefix>` is the project's own token.
- **Everything else — plain `PascalCase`** (`ProjectService`, `Entity`, `SelectionSlice`).
  This is the default for application code.

Rest:

- Namespaces: `Company.Project.<Layer>.*` — `Company.Project` is derived from `Company`/`Project`
  with non-identifier characters removed, so a display name with spaces is still a valid
  namespace root; layer names follow the project's architecture
  (`docs/development/architecture/system/`).
- Private fields: `_camelCase`. Fields managed by a serialization framework keep the
  framework's own convention, because renaming a serialized field silently drops its stored
  value from every asset that stores one.

`.editorconfig` encodes what can be machine-checked. It is the enforcement, this is the why.

## Layers

Allowed dependency direction is project-specific. The scaffold ships one recommended shape,
which addons adopt and document:

```
Views → ViewModels → State → Services → Core
```

Never the reverse. Whatever the project's graph is — plain layers, hexagonal, onion —
write it here once it is agreed; this section is the enforcement, the docs in
`docs/development/architecture/system/` are the why.

## Dependency injection

- Every constructor parameter of a registered type must itself be registered. No optional
  dependencies — if a service needs a collaborator, bind it in the composition root.
- A type that is meant to be resolvable with no collaborators needs a real parameterless
  constructor, not `(int seed = 42)`.
- One implementation answering to two interfaces is built eagerly in the composition root
  and registered as an instance under both. Registering the type twice hands out two
  instances, and a second copy of anything that subscribes to events doubles every event.

Container-specific rules — how the DI framework treats default values, how singletons are
disposed, startup tests — live in the addon that owns the framework, in its
`docs/agents/RULES.md.append` fragment.

## State

The store holds values, not framework object references. Slices carry ids, counts and plain
data — never live object handles. A store holding object references cannot be serialized,
inspected, or persisted, records in it compare by reference, and objects the framework has
already destroyed linger in it as stale handles. Services own the id ⇄ object mapping.

## Lifetime

**Whatever subscribes, unsubscribes.** A subscription taken and not released outlives the
subscriber and keeps its whole object graph alive across reloads. Services and view models
that subscribe implement `IDisposable` and are disposed by the application root; views
subscribe on attach and release on detach.

## External configuration

Every environment value — endpoints, hosts, keys, client ids, feature flags — comes from a
single external configuration source, never from a literal in code. A missing entry is a
configuration gap, not a request for mocks: the binder logs an error and falls back, so the
symptom is a production build quietly serving mock data. The configuration source and its
service registry are covered by tests that check both directions — nothing missing, nothing
misspelled.

## External dependencies

Every external dependency is an interface with a mock, switchable via configuration. No
hard-coded endpoints, hosts, keys, or client IDs anywhere in application code.

## Commits

Conventional Commits format:

```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`.

Scope: project-specific. The scaffold seeds a starter list (`docs`, `ci`, `repo` in
`commitlint.config.js`, warning-only on purpose: scopes evolve with the codebase). Keep the
`scope-enum` rule in sync with the project's real areas; addons ship example scope
lists.

## Task-first workflow

An agent that is asked to do non-trivial work creates the tracking records itself, in this
order, using the templates in `docs/development/`. Every record lives in
`docs/development/<family>/<status>/` — one subfolder per status value — and moves
subfolders on every status change; a folder root holds only its `<X>_INDEX.md` and
`<X>_TEMPLATE.md`.

A record is a YAML frontmatter block (`id`, `owner`, `status`, ISO dates, `related`) followed
by the body's H2 sections. The metadata is data, not prose, so one parser serves the editor,
the CLI, CI and agents. **A status change is one command, never four edits:**

```sh
sh tools/scaffold.sh records move <ID> "<Status>"     # tools\scaffold.ps1 on Windows
```

It sets `status`, stamps or clears the status date, `git mv`s the file to the matching folder,
appends the Touch History entry and regenerates that family's index — together, so none of the
four can be forgotten. **Creating one is one command too:**

```sh
sh tools/scaffold.sh records new <kind> "<Title>" --token Area=<area> --token AreaToken=<AREA>
```

`<kind>` is `task`, `known_issue`, `delivery_gap`, `plan` or `adr`. It mints the id under the
*current* git identity, names the file after it, fills the family's template and rewrites that
family's index. `records list` prints what the folder holds; `records check` is what CI runs;
`records sync` repairs the indexes; `records migrate` is the one-shot conversion of a project
that still carries the old `- **ID:**` header — it converts each record, files it into the
folder its status names and regenerates the indexes, so `records check` is green right after.

A project that still runs a hand-installed v1 scaffold (`extensions/<id>/install.*`, appended
blocks, no `.scaffold/`) enters the engine with `sh tools/scaffold.sh adopt --token Company=...
--token Project=...`: it adopts the files already present, migrates the records, removes the
legacy paths with a backup and prints what is left to do by hand. `/scaffold adopt` drives the
same run from a session.

1. **Find before create.** Search the folder indexes (`TASK_INDEX.md`, `KNOWN_ISSUE_INDEX.md`,
   `DELIVERY_GAP_INDEX.md`, `PLAN_INDEX.md`, `ADR_INDEX.md`) for an existing record that
   already covers the work — any owner. If one exists, claim it (step 3) instead of creating
   a sibling. Two humans/agents doing the same task is the failure mode to prevent; it is
   stopped here, at assignment time, never policed after the fact.
2. **Create the task first** when nothing covers the work: `records new task "<Name>"` (or
   `/new-task <Name>`), which writes
   `docs/development/tasks/proposed/TASK-<AREA>-<OWNER>-<NNN>-<slug>.md` from
   `TASK_TEMPLATE.md` and rewrites the index. Fill `Task Description` and `Desired Outcome`
   (plus `Proposed Implementation` when known) before executing.
3. **Claim = ownership.** Working on a record means setting `owner`, then
   `records move <ID> "In Progress"` in the same commit as the first change — the command
   moves the file and updates `next`. One active owner per record; a record with no `owner`
   set is unclaimed and free to claim.
4. **Execute the work.**
5. **When done, close the task**: write the `Resolution` section — what changed and how it was
   verified — then `records move <ID> Done`, which sets the status, stamps `done` and moves the
   file to `tasks/done/` (a Cancelled task moves to `tasks/cancelled/`; the `done/` folder
   stays covered by `TASK_INDEX.md` only).
6. **Hand off explicitly.** Taking over an In-Progress record owned by someone else requires a
   Touch History entry (new owner, date, what is done, next step) before changing `owner` /
   `next`. No silent takeover.
7. **Supersede, don't orphan.** Obsoleting a record means `records move <ID> Cancelled` (or
   `Won't Fix` for an issue, `Superseded` for a plan) and setting `superseded_by` to the
   replacement's id. A replaced record is never left dangling without a pointer.
8. **File a Known Issue for anything left broken.** If the work leaves an unresolved problem
   behind (reproduced or confirmed by inspection), `records new known_issue "<Title>"` (or
   `/new-issue <Title>`), which writes
   `docs/development/known_issues/open/KI-<OWNER>-<NNN>-<slug>.md` from
   `KNOWN_ISSUE_TEMPLATE.md`. Link related delivery gaps in `related`. When an issue is fixed,
   `records move <ID> Fixed`; a declined one is `records move <ID> "Won't Fix"`. All subfolders
   stay covered by `KNOWN_ISSUE_INDEX.md`.
9. **Delivery gaps** (missing milestone work, missing CI, config gaps — not defects in a
   completed feature) are `records new delivery_gap "<Title>"` (or `/new-dg <Title>`), landing
   in `docs/development/delivery_gaps/planned/DG-<OWNER>-<NNN>-<slug>.md`; pass
   `--token Status=Open` for one that is already open. When a gap is closed,
   `records move <ID> Closed`.
10. **Plans and ADRs move too**, through the same command. Plans are created in
    `plans/proposed/` and move to `plans/agreed/`, `plans/implemented/`, `plans/superseded/`.
    An Accepted ADR moves to `architecture/adr/accepted/`; an implemented one to
    `architecture/adr/implemented/`; Deprecated and Superseded ADRs move to
    `architecture/adr/deprecated/` and `architecture/adr/superseded/`. See the ADR section
    below for the full lifecycle.
11. **Never hand-edit an index.** `TASK_INDEX.md`, `KNOWN_ISSUE_INDEX.md`,
    `DELIVERY_GAP_INDEX.md`, `PLAN_INDEX.md` and `ADR_INDEX.md` are **generated** from the
    records on disk: `records new` and `records move` rewrite the one they affect, `records
    sync` rewrites them all, and an edit by hand is lost on the next sync. A record written by
    hand rather than by `records new` needs a `records sync` of its own — nothing has moved the
    file yet, so no index has been regenerated for it. The CI
    `records` job regenerates and fails on any difference, so an index can no longer drift
    away from the folder it describes.
    The indexes this tool does not generate — `FEATURE_INDEX.md`, `SNIPPETS_INDEX.md`, the
    architecture ones — stay hand-maintained and stay **canonical by shape**: an empty state
    is an empty table (header + delimiter row), never prose (`None.`) and never placeholder
    rows (`| — | — |`).

### Record IDs

Every record ID is `<KIND>-<AREA>-<OWNER>-<NNN>` (tasks, ADRs) or `<KIND>-<OWNER>-<NNN>`
(KIs, DGs, plans), where `OWNER` is the token from `tools/git-identity.*` (git `user.name`
normalized, OS-user fallback; see `docs/development/IDENTITIES.md`). The owner-qualified ID
makes every record globally unique per creator — two people can never mint the same ID. `NNN`
is a per-(area, owner) sequence, kept stable once minted so prose references to a record
stay accurate. The filename and the `id` field must match; the CI `records` job enforces
the scheme.

**A record is always created under the git identity of the user who mints it** — run
`tools/git-identity.ps1` (or `.sh`) and use its output as `OWNER`; never copy the owner
token of a record you are cloning, and never reuse the previous record's creator when you
are the one minting the new record. Two humans sharing one machine must check `git config
user.name` before minting: the token is the git username of the *current* user, not of the
person who wrote the template, the follow-up, or the referenced record.

Records are cheap to create and cheap to close; a problem that is not recorded is a problem that
will be rediscovered. Trivial changes (typos, one-line fixes inside an existing tracked effort)
do not need a task.

## ADR records

Architecture decisions live in `docs/development/architecture/adr/`. They follow the same
discipline as tasks — find before create, one owner, index in sync, never orphaned — with a
lifecycle marked by folder placement:

1. **Find before create.** Search `ADR_INDEX.md` (which covers all subfolders) for an existing
   decision — any state, any author. If one covers the work, extend or supersede it instead of
   minting a sibling.
2. **Create as Proposed.** `records new adr "<Title>" --token Area=<area> --token AreaToken=<AREA>`
   writes `adr/proposed/ADR-<AREA>-<OWNER>-<NNN>-<slug>.md` from `ADR_TEMPLATE.md`, mints the
   id (the same owner-qualified scheme as tasks, `NNN` a per-(area, owner) sequence) and adds
   the `ADR_INDEX.md` row. Fill `Context`, `Decision`, `Consequences`, `Alternatives
   considered`, `Touch History`; leave `## Implementation` empty.
3. **Accept.** Approval is `records move <ID> Accepted`: the status, the `accepted` date and
   the move to `adr/accepted/` in one step. Implementation is then tracked by a task (the
   ADR's implementing task links it in `related`).
4. **Implement → move to `implemented/`.** When the implementing task closes, fill
   `## Implementation` (what landed, task/commit, verification) and run
   `records move <ID> Implemented`, which moves the file and rewrites the index.
   `implemented/` means the decision is accepted **and** implemented; it has no index of its
   own — `ADR_INDEX.md` alone covers all subfolders (mirror of `known_issues/fixed/`).
5. **Supersede, don't orphan.** An obsolete decision is marked `Deprecated` /
   `Superseded by ADR-<M>` with a pointer to the replacement (keep or move the file; the index
   link stays accurate). Never leave a replaced ADR dangling.
6. **Never hand-edit `ADR_INDEX.md`** — it is generated, like every other record index (step
   11 above). The CI `records` job enforces id uniqueness, filename/`id` agreement, status /
   folder agreement and index coverage for all subfolders.

## Code style

- LF endings. Indentation and the rest of the machine-checkable formatting come from
  `.editorconfig`, not from this file.
- Document public APIs in the language's own doc-comment format. Comment *why*, not *what*;
  no commented-out code in committed files; a `TODO:` comment (with a brief note) for known
  gaps.
- Explicit access modifiers always — never rely on a language default.
- One class layout across the codebase: constants and static fields, instance fields,
  properties, constructors and lifecycle methods, public methods, protected methods, private
  methods, nested types. Imports are grouped standard library, then framework, then
  third-party, then project.
- Use the project's logging wrapper instead of raw framework logging in application code;
  low-level or frozen layers that cannot reference the wrapper log directly.
- Language- and framework-specific rules (brace style, nullability directives,
  diagnostics-as-errors, framework file types) live in the addons'
  `.editorconfig.append` and `RULES.md.append` fragments.

## Project-specific rules

This file is company-wide: it is owned by the `core` addon and **replaced** by every
scaffold update, so an edit made here is lost (backed up, but lost). Anything true only of
this project — the layer graph, the type prefix, framework conventions, commit scopes —
goes in `docs/agents/RULES.local.md`, which the scaffold creates once and never touches
again. `RULES.local.md` has the same authority as this file; read both.

Rules that belong to a framework rather than to one project belong in an addon's
`RULES.md.append` fragment, not in either file.

## Addons

Framework- or domain-specific behaviour comes from addons. They live in the scaffold
template, not in this repository: each one is a declarative `addon.json` manifest plus a
`files/` tree, applied by the shared engine. This project drives them through
`tools/scaffold.*` (`init` / `add` / `remove` / `update` / `status` / `list`), which resolves
an integrity-verified engine package from the machine's registry — a template checkout runs
its own engine — so the tooling is never a stale local copy. The base scaffold itself is the
`core` addon: one mechanism for everything the project receives.

- Every addon declares `id`, `version`, `requires[]`, `conflicts[]`, `tokens{}` and an
  ordered `ops[]` list in `addon.json`. Dependencies are resolved topologically by the
  engine, so install order is never a human convention, and an addon something else
  requires cannot be removed without `--cascade`.
- Addon content lives in the addon's `files/`, mirroring this repository's tree: a
  file `files/.claude/agents/foo.md` adds `.claude/agents/foo.md` to the project.
- **Upstream wins.** A file an addon owns is restored to the upstream content on every
  install and update; the local version is copied to `.scaffold/backup/<timestamp>/` first
  and listed at the end of the run. Project-owned seeds (`CODEOWNERS`, `RULES.local.md`,
  the record indexes, `.gitlab-ci.yml`, ...) are declared `once` in the manifest: written
  when missing, never rewritten. Put project content in a `once` file or in an addon —
  never in a managed one.
- A file ending in `.append` extends the same-named base file:
  `files/docs/agents/RULES.md.append` appends to `docs/agents/RULES.md`. The engine wraps
  appended content in markers (`<!-- BEGIN EXTENSION: <name> -->` … `<!-- END EXTENSION: <name> -->`
  in Markdown, `# BEGIN/END EXTENSION: <name>` elsewhere), so re-running an installer is
  idempotent; an update replaces only the block between the addon's own markers, and a
  fragment dropped upstream takes its block with it.
- JSON and YAML merges are declared as `jsonMerge` and `gitlabCiPatch` ops — data, not
  installer code. Each merge records an undo journal, so removing an addon takes its
  keys, CI stages and links back out without disturbing the ones another addon added.
  The template's `addons/README.md` lists the ops.
- The engine records every installed file, appended block, merge and link in
  `.scaffold/addons.json` (committed). It is what makes `status` (drift, available
  upgrades, stamped source commit), `update` and `uninstall` possible. A project still
  carrying the pre-rename `.scaffold/extensions.json` is migrated on its first engine run,
  with the legacy file backed up and kept readable for one release.
- Runs are reversible by design: `--dry-run` prints the plan and writes nothing, and the
  engine refuses to start on a tree with uncommitted changes (`--allow-dirty` to override),
  so `git checkout` is always a valid rollback.
- Rules added by an addon carry the same weight as rules in this file: once an
  addon is installed, its `RULES.md.append` fragment is part of this file.
