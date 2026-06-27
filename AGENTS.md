<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:pairing-context-rules -->
# Pairing System — Binding Agent Protocol (READ IN FULL BEFORE ANY WORK)

The debate pairing system is a platform-level feature specified across `docs/01`–`docs/15`,
indexed by the memory graph `docs/pairing-knowledge-graph.md`, and built in strict order via
`docs/16-build-plan.md` with per-phase prompts in `docs/build/`. **These rules are MANDATORY and
override every default behavior.** They apply to any work — planning, code, schema, tests, or
docs — touching pairing, attendance, sessions, scoring, leaderboards, metrics, proposals,
publication, tuning, or the eval harness. If you cannot satisfy a rule, STOP and ask; do not
proceed on assumption.

## SCOPE LOCK — BACKEND ONLY (current stage)
We are building the **backend only** right now. You MUST NOT create, edit, or scaffold:
- React components, pages, layouts, or anything under `app/**` that renders UI
  (`page.tsx`, `layout.tsx`, `*.css`, client components, hooks for UI state).
- Anything under `components/`, styling, or design work.
The ONLY things under `app/` you may touch are **API route handlers** (`app/api/**/route.ts`),
and only in Phase 10 when the plan says so. Everything else lives in `lib/server/**`,
`types/**`, and `prisma/**`. If a task seems to require frontend, STOP and tell the user it is
out of scope for the current backend stage.

## DOCUMENT MAP — where everything lives (never guess a path)
- `docs/pairing-knowledge-graph.md` — **the memory graph.** Communities C1–C11, typed nodes,
  edges, hyperedges, pre-coding gates. The index you load first.
- `docs/16-build-plan.md` — the master phase plan (Phase 0–11), ordering, gates, deliverables.
- `docs/build/` — one ready-to-run prompt per phase (`phase-00…` to `phase-11…`) + `README.md`.
- `docs/01-overview.md` — product intent, access-control direction, philosophy.
- `docs/02-backend-changes.md` — backend behavior, lifecycle, removals/deprecations.
- `docs/03-database-design.md` — DB design direction and conceptual model changes.
- `docs/04-pairing-engine-flow.md` — engine pipeline stages, end to end.
- `docs/05-pairing-metrics.md` — metric taxonomy, hard/soft rules, weights, fallbacks.
- `docs/06-feature-flows.md` — end-to-end product flow.
- `docs/07-open-questions.md` — UNRESOLVED decisions (the OPEN list).
- `docs/08-pre-coding-decisions.md` — what must be confirmed before coding + the checklist.
- `docs/09-metric-formulas.md` — formulas with status legend (`FINALIZED ENOUGH` / `PROPOSED V1`
  / `STILL OPEN`). **This legend is authoritative for what may be implemented.**
- `docs/10-eval-harness.md` — eval/replay/regression design.
- `docs/11-backend-implementation-map.md` — **authoritative** folder/file/export map and
  route→service mapping.
- `docs/12-backend-data-model-map.md` — **authoritative** entity naming, fields, relationships,
  V1 model set.
- `docs/13-pairing-learning-loop.md` — learning/confidence/tuning behavior and module layering.
- `docs/14-api-routing-map.md` — **authoritative** API route contracts, methods, access rules.
- `docs/15-pairing-engineering-quality-standard.md` — **the implementation contract.** Read the
  relevant section for EVERY change. The §22 checklist is the merge gate.
- Code anchors: `lib/server/roles.ts`, `lib/server/guards.ts`, `lib/server/http.ts`,
  `prisma/schema.prisma`, `prisma/migrations/`.

## Rule 1 — Load order is fixed, every single task
Before planning or writing ANYTHING you MUST, in this order:
1. Read this protocol (the whole `pairing-context-rules` block).
2. Read `docs/pairing-knowledge-graph.md` in full.
3. Identify the exact community (C1–C11) and node IDs your task touches.
4. Open the phase prompt in `docs/build/` for the phase you are on.
5. Read ONLY the governing docs cited by those nodes/phase — plus the relevant section(s) of
   `docs/15`. Do NOT load the whole `docs/` folder (context discipline, `15 §21`).
You may not write a single line for a node before reading the doc that node cites.

## Rule 2 — Authority order (resolve conflicts, never silently pick)
Authority, highest first: **(a) the numbered doc that owns the concept** (see the "authoritative"
tags above) → (b) `docs/16-build-plan.md` → (c) `docs/pairing-knowledge-graph.md` → (d) existing
code/schema. If a higher source conflicts with a lower one, the higher wins and you must fix the
lower in the same change. If a numbered doc conflicts with existing code/schema, or two
authoritative docs conflict, **STOP and ask the user** — do not guess.

## Rule 3 — Status discipline: LOCKED / PROPOSED-V1 / OPEN
Every formula and decision carries a status in `docs/09` (legend) and the graph (C5).
- `LOCKED` / `FINALIZED ENOUGH`: implement exactly as written.
- `PROPOSED-V1`: implement as written, but explicitly list it as a V1 assumption in your summary.
- `OPEN` / `STILL OPEN`: **FORBIDDEN to implement** until the user gives the exact spec. This
  includes the `Fo10` set: `team_quality_aggregate`, full `proposal_score`, `consistency_score`,
  `experience_index`, pair-dynamics aggregation, `role_score` aggregation, tuning-adjustment.
  If a phase needs an OPEN item, stop and request the spec.

## Rule 4 — Pre-coding gates block phases
The graph's "Pre-coding gates" (and `docs/07`/`docs/08`) list 10 decisions that gate phases. At
the start of a phase, verify its gate is resolved. If unresolved, DO NOT START — report the gate
and ask. Never invent a field, formula, weight, route, or access rule to keep moving.

## Rule 5 — Architecture & quality are non-negotiable (`docs/11`, `docs/15`)
- `app/api/**/route.ts` = transport only: auth-guard → zod-validate → call ONE `lib/server`
  service → shape response. NO formulas, NO orchestration, NO Prisma in routes.
- ALL Prisma access lives in `lib/server/repositories/*`. Nowhere else.
- The engine consumes a pre-shaped `PairingGenerationContext` (Maps), never raw tables, and
  issues NO database queries inside candidate or scoring loops (front-load all reads, `15 §6`).
- Keep the three layers physically separate: runtime generation / post-session metric update /
  periodic tuning+eval (`13`, `15 §2`).
- Randomness occurs ONLY in final top-band selection and MUST be auditable (store engine/rule/
  metric version, top-band rank, selection probability, seed, objective — `15 §11`).
- Bounded search only: enforce explicit max-candidate and time-budget guardrails from V1
  (`15 §3,§4`). No unbounded combinatorics.
- Every change must pass the `docs/15 §22` 15-point review checklist before you call it done.

## Rule 6 — Respect existing code; extend, never break
Existing models `DebateSession` (`@@map("Session")`), `Attendance`, `Member`, `cabinet`, and roles
`TechHead | President | cabinet | Member` (`lib/server/roles.ts`, `prisma/schema.prisma`) are
EXTENDED, not replaced. Migrations MUST preserve existing fields, data, prior migration history,
and historical readability (`15 §14`). A prior migration already added attendance/pairing fields —
inspect it before editing the schema. Reuse `requireSessionUser({ roles })` from
`lib/server/guards.ts`: lifecycle routes → `["cabinet","President"]`; published read →
`["Member","cabinet","President"]`; eval → `["TechHead","President"]`; post-session scoring is
gated on **session role** (the `SessionRoleAssignment` record), NOT permanent account role.

## Rule 7 — Anti-hallucination (hard stops)
- NEVER invent a model name, field, route path, function/export name, weight, formula, or enum
  value. Every such identifier must be copied from `docs/11`, `docs/12`, `docs/14`, `docs/05`,
  or `docs/09`. If it is not in a doc, it does not exist — stop and ask.
- NEVER assume an API of this Next.js/Prisma version from memory. This is a customized Next 16 —
  read `node_modules/next/dist/docs/` for any Next API, and the installed Prisma 7 docs/types for
  Prisma. zod is v4.
- NEVER claim a file, symbol, or migration exists without verifying it (read it / grep it first).
- NEVER report something as done, passing, or verified unless you ran it and saw the result.
- If you are unsure whether something is in scope, locked, or already implemented: STOP and ask.
  Uncertainty is a stop condition, not a reason to improvise.

## Rule 8 — Close the loop: update the knowledge graph after every phase
When a phase's deliverables and "Done-when" checks pass, you MUST, before declaring the phase
complete, update `docs/pairing-knowledge-graph.md`:
- mark the implemented nodes with their real file path(s) and a `BUILT` marker,
- correct any node/edge that reality proved wrong (and note it),
- flip resolved gate/status entries, and
- add any new node/edge discovered during the build.
The graph must always reflect what now exists in code. A phase is NOT done until the graph is updated.

## Rule 9 — State what you grounded on
End every pairing response with a "Grounded in:" line citing the exact graph nodes and doc
sections you used (e.g. `Grounded in: C7/D4, C9/B1, docs/11 engine.ts, docs/14 §3, docs/15 §11`).
No citation = you did not follow the protocol = the work is not acceptable.
<!-- END:pairing-context-rules -->
