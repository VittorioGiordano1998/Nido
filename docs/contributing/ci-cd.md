# CI/CD

CI runs on **GitLab** (`.gitlab-ci.yml` at repo root). Lint jobs run unconditionally;
addons append their own test/build jobs (gated behind CI/CD variables where a license
or a runner is required — see the installed addons' docs).

## Pipeline

| Stage | Job | What | Gate |
|---|---|---|---|
| lint | `commitlint` | Conventional Commits over the MR range | always on |
| lint | `markdownlint` | docs + root md | always on |
| lint | `records` | owner-qualified ids unique; filename == the frontmatter `id`; every record in its generated index | always on |
| lint | `scaffold` | scaffold updates and policy against the registry | opt-in (needs registry access) |
| lint | `conventions` | project-specific convention checks (commented template in `.gitlab-ci.yml`) | always on |
| test | `app-test` | `npm ci && npm run test` in `app/` (vitest, pure logic) | always on |
| build | `app-build` | `npm ci && npm run build` in `app/` (tsc + vite) | always on |

## App jobs

`app-test` and `app-build` fail the pipeline before an error reaches `main` (the Vercel
build publishes automatically on push, so the type check must happen here). Both run on
`node:24` — the version `app/package.json` pins and Vercel builds with — and cache
`app/node_modules` keyed by the lockfile. Locally the same checks are `cd app && npm run
test` and `npm run build`.

Pipelines run for merge requests, for pushes to `main`, and for release tags
(`<id>/v<semver>` and `vscode/v<semver>`, which run the publish jobs below) — see the
`workflow:` block.

## The `records` job

`tools/check-records.sh` (also runnable locally: `sh tools/check-records.sh`) verifies the
record registry stays consistent (RULES.md §Task-first workflow). The script is a shim: the
checks live in `@scaffold/records` and run as `scaffold records check`, which is why the job
needs a node image. It verifies:

- every task / KI / DG / plan / ADR filename starts with its `id`, in the owner-qualified
  scheme (`OWNER` from `tools/git-identity.*`);
- no duplicate ids across the registry (two people can never mint the same record);
- every record's `status` matches the subfolder it sits in — `tasks/done/`,
  `delivery_gaps/closed/`, `plans/implemented/`, `architecture/adr/implemented/`, … — and
  every required field is filled with an ISO date where a date belongs;
- every generated index (`TASK_INDEX.md`, `KNOWN_ISSUE_INDEX.md`, `DELIVERY_GAP_INDEX.md`,
  `PLAN_INDEX.md`, `ADR_INDEX.md`) is byte-for-byte what a regeneration would write, which
  subsumes "every record is linked from its index" and catches the drift a hand-maintained
  index accumulates. Repair with `sh tools/scaffold.sh records sync`;
- every snippet file is linked from `SNIPPETS_INDEX.md`;
- every hand-maintained `*_INDEX.md` carries a markdown table (header + delimiter row) —
  those indexes are canonical by shape, the empty state is an empty table (RULES.md
  §Task-first).

`.gitlab-ci.yml` is a `once` seed, so a project adopted before the job moved to a node image
keeps the old one and fails at pipeline time. `core` therefore declares a `postInstall`
checklist item (`ci-records-image`): `scaffold checklist` lists it, `status --check` fails on
it, and the item's `verify` predicate clears it as soon as the file contains the job on a node
image. The fix is one line — `image: node:20`, and delete the `apk add` step from that job.
Items a predicate cannot check are closed explicitly with `scaffold checklist done <ext>:<id>`
(the ack lives in `.scaffold/addons.json`).

## The `scaffold` job

`sh tools/scaffold.sh status --check` reports what the resolved source offers — available
upgrades, policy findings, drift — and exits non-zero on a problem; `update --check` reports
whether an update would change the project and writes nothing. It is shipped commented out
because the runner needs to reach the npm registry that serves the engine and addon packages;
uncomment it once the runner can reach it.

A drift failure is not a merge blocker to work around: the fix is to move the local change
into `docs/agents/RULES.local.md`, into a `once` file, or into an addon, then run
`sh tools/scaffold.sh update` (the previous content is kept under `.scaffold/backup/`).

## Template-repo test jobs

The template repository tests its own packages in the `engine` job:
`node --test packages/engine/test/*.test.mjs packages/records/test/*.test.mjs
packages/mcp/test/*.test.mjs` — the engine's install/update/remove behaviour, the record
parser and index generator, and the stdio MCP server with its twelve tools. Its `scaffold`
job runs `status --check` and `update --check` against `addons/`: the second fails when
the root state is stale — a file or a version changed under `addons/` without a
re-install — which `status --check` alone cannot see. The `vscode` job
does the same for the extension (`npm test`: compile, bundle, tests). The `vscode-host` job
goes one layer deeper: `xvfb-run npm run test:host` downloads a real VS Code and runs the
extension-host suite — activation, multi-root, the policy findings in the Problems panel and
the Windows link case. Like `scaffold` and `vscode`, these are template-repo-only jobs:
`.gitlab-ci.yml` is a `once` seed, so a project that installs `core` gets the file above
without them.

## Releasing the VS Code extension

The extension is distributed as a private VSIX inside an npm package on the team's npm
registry (Verdaccio). A tag `vscode/v<semver>` whose version matches
`packages/vscode/package.json` makes the `vsix` job run the suite, package the
`ai-scaffold-<version>.vsix` and publish `@youbiquo/ai-scaffold@<version>` — the VSIX,
`README.md` and `CHANGELOG.md` — to the registry. The name is scoped because the unscoped
`ai-scaffold` belongs to a public npm package the Verdaccio proxy serves back, which the
extension once offered as its own update. VS Code forbids a scoped extension name, so the
manifest's `name` stays `ai-scaffold` (the extension id `internal.ai-scaffold` is unchanged)
and the npm name lives in the manifest's `npmPackage` field, which the running extension reads
for its update check; the job stages that name into `package.json` just before `npm publish`,
since npm has no rename flag. The `release` job ignores `vscode/v*` tags — extension releases
keep the `<id>/v<semver>` names.

The registry URL is pinned in `packages/vscode/package.json` (`publishConfig.registry`): npm
applies it over `--registry` at publish time, so the committed host is the publish target and
`NPM_REGISTRY_URL` is gone. Publishing authenticates with two CI/CD variables:

| Variable | What it is |
|---|---|
| `NPM_REGISTRY_HOST` | The `publishConfig.registry` host (and port, when non-default), for the `//<host>/:_authToken` line the job writes to its `.npmrc`; that file is never committed, and a host that does not match fails the publish |
| `NPM_TOKEN` | Verdaccio publish token; store it masked and protected |

`aiScaffold.updateRegistry` overrides the same base URL for the running extension (and is the
registry addon resolution reads first, before `SCAFFOLD_REGISTRY` and `registry=` in
`~/.npmrc`; decision 2), falling back to the pinned `publishConfig.registry`: it reads the packument
(`<registry>/@youbiquo%2fai-scaffold`), compares `dist-tags.latest` with the installed version,
downloads the tarball, verifies `dist.integrity` (sha512, with the legacy `dist.shasum` as
fallback) and installs the VSIX inside it — the auto-update a private VSIX never gets from a
marketplace ([`packages/vscode/README.md`](../../packages/vscode/README.md) documents the
flow). Install manually with `code --install-extension ai-scaffold-<version>.vsix`.

## Releasing an addon, the catalog and the engine

Addons publish as npm packages (`PLAN-PIETRORUSSO-010` phase 5). A tag `<id>/v<semver>` whose
version matches `addons/<id>/addon.json` makes the `release` job run the engine suite, stage
`@youbiquo/scaffold-addon-<id>` with
`node packages/engine/bin/pack.mjs addon <id> --out dist/<id>` and publish it. The packer
generates the package's `package.json` — `dependencies` from `requires` — and runs the
`minEngine` gate: a manifest using a capability newer than its declared floor is refused
before a tarball exists. A prerelease version publishes on the `next` dist-tag, the
replacement for `--from url#branch` testing; everything else is `latest`.

A **new** addon is two publishes: the addon package and `@youbiquo/scaffold-catalog`, which
carries the addon package names and the profiles and is published by the `catalog` job on
`main` when `addons/` or `catalog/profiles.json` change. An **updated** addon is one publish.
`@youbiquo/scaffold-engine` — engine, records and MCP side by side under the package root — is
published by the `engine-package` job from `main` when those packages change, skipped when its
version is already on the registry. None of the three needs an extension release. The same
`NPM_REGISTRY_HOST` and `NPM_TOKEN` variables authenticate every publish, and the `.npmrc`
each job writes is never committed.

npm versions are immutable: a botched publish is repaired with a new patch version, not a
force-pushed tag.

## Convention checks (`conventions` job)

Uncomment the `conventions` job in `.gitlab-ci.yml` and fill it with the project's own
machine-checkable rules. Addons add their checks through `.gitlab-ci.yml.append`
fragments.

## Runner

Shared GitLab runners work; the slowest job (often the WebGL build, when the project builds
one) is the one to move to a dedicated or self-hosted runner if MR latency becomes a
problem. `Library/` is cached per job family and branch.

## CODEOWNERS

`CODEOWNERS` is committed with placeholder owners (commented out) — replace them with real
group/usernames and uncomment before merging (a name that does not exist can block MRs
outright). See the file header.
