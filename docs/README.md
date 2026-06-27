# Debate Pairing System Docs

This folder contains the working product and engineering documentation for the debate pairing system planned for the DebSoc platform.

These docs are living documents. They capture the current design direction and should evolve as we refine formulas, database structure, API design, and review workflows.

## Document Map

### [01-overview.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\01-overview.md)
High-level overview of the feature, goals, adaptive engine philosophy, and admin-review model.

### [02-backend-changes.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\02-backend-changes.md)
Backend-focused change plan covering attendance, sessions, generation flow, scoring, publication, and lifecycle management.

### [03-database-design.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\03-database-design.md)
Detailed database planning, including models to add or change, proposal-review storage, metric storage, and tuning data.

### [04-pairing-engine-flow.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\04-pairing-engine-flow.md)
Step-by-step explanation of how the pairing engine works conceptually, including candidate generation, probabilistic top-band selection, and periodic tuning.

### [05-pairing-metrics.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\05-pairing-metrics.md)
Detailed metric reference covering learned metrics, session-only inputs, hard vs soft logic, formulas, fallback behavior, and adaptive learning.

### [06-feature-flows.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\06-feature-flows.md)
End-to-end product flow across attendance, session handling, pairing generation, publishing, dashboards, scoring, and learning feedback.

### [07-open-questions.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\07-open-questions.md)
Remaining open decisions that still need final confirmation before implementation.

### [08-pre-coding-decisions.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\08-pre-coding-decisions.md)
Checklist of decisions that should be confirmed before schema and backend implementation begins.

### [09-metric-formulas.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\09-metric-formulas.md)
Formula-focused reference separating finalized formulas, proposed V1 formulas, and still-open sub-formulas for the engine.

### [10-eval-harness.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\10-eval-harness.md)
Evaluation-harness design covering replay datasets, scoring dimensions, regression checks, probabilistic run strategy, and tuning-safety thresholds.

### [11-backend-implementation-map.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\11-backend-implementation-map.md)
Concrete backend blueprint showing the recommended folder structure, files to create, exports, route-to-service mapping, and implementation order.

### [12-backend-data-model-map.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\12-backend-data-model-map.md)
Backend data-model reference covering the core entities, responsibilities, relationships, minimal V1 model set, and Prisma naming direction.

### [13-pairing-learning-loop.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\13-pairing-learning-loop.md)
Dedicated explanation of how the system improves after each use through metric updates, confidence growth, proposal feedback, and periodic tuning.

### [14-api-routing-map.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\14-api-routing-map.md)
Dedicated backend API routing map covering endpoint groups, methods, access rules, request shapes, and route-to-service mapping.

### [15-pairing-engineering-quality-standard.md](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\15-pairing-engineering-quality-standard.md)
Engineering quality standard for implementing the pairing system safely, with guidance on performance, scalability, type safety, state management, observability, testing, and UX responsiveness.

### [16-build-plan.md](16-build-plan.md)
Tightly-coupled, phase-by-phase build plan derived from docs 01–15. Every step cites its graph nodes, governing docs, pre-coding gate, exact deliverable files, and acceptance checks. Strict ordering; no step may be skipped.

### [pairing-knowledge-graph.md](pairing-knowledge-graph.md)
Single-file memory graph of the whole feature (communities C1–C11, nodes, edges, hyperedges, pre-coding gates). Read this first to load the whole idea, then drill into the cited docs. `AGENTS.md` makes consulting it mandatory before any pairing work.

## Reference Files

### [rules.template.jsonc](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\rules.template.jsonc)
Commented rules template for the pairing engine configuration, including hard rules, soft-rule weights, objective behavior, probabilistic selection, and tuning limits.

### [pairing-metric-seed.example.jsonc](C:\Users\mobas\OneDrive\Documents\Debsoc\Debsoc-new\debsoc-frontend\docs\pairing-metric-seed.example.jsonc)
Example seed data for metric records that will live in the database, including metric scope, fallback logic, confidence settings, and learning configuration.

## Current Status

The system design currently assumes:

- pairing is admin-assisted, not fully autonomous
- pairing output is generated as a proposal first
- admin review is mandatory before publication
- the engine is weighted and probabilistic rather than purely deterministic
- historical data should improve the system over time
- session-specific inputs should influence only the current generation cycle
- proposal review and post-session outcomes should both contribute to later tuning
- only cabinet and president can generate, review, rate, override, regenerate, or publish pairings
- once published, member, cabinet, and president roles can view the official published pairing
- engineering quality and scalability should be treated as first-class requirements for this feature

## Documentation Style

Each document is organized around a single concern so future edits are safer:

- product behavior stays separate from database design
- engine logic stays separate from UI flow
- unresolved decisions stay separate from accepted assumptions
- detailed metric definitions stay separate from feature walkthroughs
- formulas, eval logic, implementation mapping, data-model mapping, learning-loop design, and routing stay separate from higher-level overviews
- engineering quality standards stay separate from product rules so implementation discipline remains explicit

This should keep the planning set readable as the system becomes more concrete.
