# <Project> Documentation

Welcome to the <Project> documentation.

## Start here

- [`onboarding.md`](onboarding.md) — first-time contributor guide.
- [`agents/RULES.md`](agents/RULES.md) — canonical rules for AI agents. **Read before letting
  an agent write code.**
- [`development/architecture/README.md`](development/architecture/README.md) — architecture
  doc map.

## Structure

```
docs/
├── README.md                    # this index
├── onboarding.md                # first-time contributor guide
│
├── agents/RULES.md              # canonical agent rules (single source of truth)
│
├── contributing/                # how to work in this repo
│   ├── agentic-tools.md         #   working with Claude Code / opencode
│   ├── commits.md               #   Conventional Commits
│   ├── pull-requests.md         #   PR process and review checklist
│   └── ci-cd.md                 #   CI pipeline (lint + records jobs)
│
└── development/                 # how we build <Project> — read every session
    ├── IDENTITIES.md            #   record owner tokens (tools/git-identity.*)
    ├── architecture/            #   how the system is built, and why
    │   ├── README.md            #     folder map (adr / features / system / patterns / integrations)
    │   ├── adr/                 #     Architecture Decision Records + ADR_INDEX.md
    │   ├── features/            #     per-feature deep dives + FEATURE_INDEX.md
    │   ├── system/              #     overview, layers, dependency graph + SYSTEM_INDEX.md
    │   ├── patterns/            #     state, DI, serialization, ... + PATTERNS_INDEX.md
    │   └── integrations/        #     external services, mocks + INTEGRATIONS_INDEX.md
    ├── known_issues/            #   one KI-<OWNER>-<NNN>.md per defect + KNOWN_ISSUE_TEMPLATE.md
    │   ├── KNOWN_ISSUE_INDEX.md #     roll-up of every KI (open and fixed)
    │   └── fixed/               #     resolved issues, moved here when closed (no index)
    ├── delivery_gaps/           #   one DG-<OWNER>-<NNN>.md per gap + DELIVERY_GAP_TEMPLATE.md
    │   └── DELIVERY_GAP_INDEX.md#     roll-up: id, status, release impact per DG
    ├── plans/                   #   agreed plans + PLAN_INDEX.md + PLAN_TEMPLATE.md
    ├── snippets/                #   reference code to adapt + SNIPPETS_INDEX.md
    └── tasks/                   #   one task .md per work item + TASK_TEMPLATE.md
        ├── TASK_INDEX.md        #     roll-up: id, status, type, area per task
        └── done/                #     closed tasks, moved here when Done (no index)
```

Every multi-record folder (`tasks/`, `known_issues/`, `delivery_gaps/`, `plans/`,
`snippets/`, `adr/`, `features/`, `system/`, `patterns/`, `integrations/`) carries an
`<X>_INDEX.md` roll-up — read that before opening individual records.
`known_issues/fixed/` and `tasks/done/` are exceptions: they hold closed records but stay
covered by `KNOWN_ISSUE_INDEX.md` / `TASK_INDEX.md` only. `snippets/` holds reusable code
examples, not records: every file must be linked from `SNIPPETS_INDEX.md`.

**The record indexes are generated, never hand-edited:** `TASK_INDEX.md`,
`KNOWN_ISSUE_INDEX.md`, `DELIVERY_GAP_INDEX.md`, `PLAN_INDEX.md` and `ADR_INDEX.md` are
written by `sh tools/scaffold.sh records sync` (and by every `records move`) from the records
on disk, and the CI `records` job fails when one differs from a regeneration.

**The rest are canonical by shape:** `FEATURE_INDEX.md`, `SNIPPETS_INDEX.md` and the
architecture indexes stay hand-maintained and carry their tables always — an empty state is
an empty table (header + delimiter row), never prose (`None.`) and never placeholder rows
(`| — | — |`). This keeps every adopting repo's indexes structurally identical.

## Conventions at a glance

- Naming: see `agents/RULES.md` §Naming.
- No hard-coded strings, colors, or endpoints (project-specific rules in RULES.md).
- Every external dependency is an interface with a mock, switchable by config.
