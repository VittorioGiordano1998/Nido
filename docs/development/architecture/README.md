# Architecture Docs

Technical documentation of how the system is built and why.

| Folder | Holds |
|---|---|
| `adr/` | Architecture Decision Records — one `ADR-<NNN>.md` per decision, indexed by `ADR_INDEX.md` |
| `features/` | Per-feature deep dives of current behaviour, indexed by `FEATURE_INDEX.md` |
| `system/` | System-level docs: overview, layers, dependency graph, module map, indexed by `SYSTEM_INDEX.md` |
| `patterns/` | Cross-cutting patterns (state, DI, serialization, ...), indexed by `PATTERNS_INDEX.md` |
| `integrations/` | External services, mocks, contracts, indexed by `INTEGRATIONS_INDEX.md` |

Every multi-record folder carries an `<X>_INDEX.md` roll-up — read that before opening
individual records, and keep it in sync when records are added or closed.
