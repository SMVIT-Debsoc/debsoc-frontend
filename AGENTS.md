<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:pairing-context-rules -->
# Pairing System: mandatory context-extraction protocol

The debate pairing system is a platform-level feature specified across `docs/01`–`docs/15`.
Its entire idea is indexed as a memory graph in **`docs/pairing-knowledge-graph.md`**. These
rules are **binding** for any work — code, schema, tests, or docs — that touches pairing,
attendance, sessions, scoring, leaderboards, metrics, proposals, publication, or the eval
harness. They override default behavior.

## Rule 1 — Load the graph first, every time
Before planning or writing ANY pairing-related change you MUST:
1. Read `docs/pairing-knowledge-graph.md` in full (it is short by design — it is the index).
2. From the graph, identify which **community (C1–C11)** and **nodes** your task touches.
3. Open and read the **governing doc(s)** cited on those nodes — and ONLY those. Do not work
   from memory, and do not load the whole `docs/` folder (see `15 §21` context discipline).
You may not write code for a node before reading the doc that node cites.

## Rule 2 — The doc wins; the graph is an index, not a source of truth
If the graph and a numbered doc disagree, the numbered doc is authoritative. Fix the graph in
the same change. If a numbered doc and the existing code/schema disagree, STOP and ask — do not
silently pick one. The build sequence and file/route/model mapping live in
`docs/16-build-plan.md`, which is itself derived from the graph and docs.

## Rule 3 — Respect locked vs proposed vs open
Each design point carries a status (`LOCKED` / `PROPOSED-V1` / `OPEN`) in the graph (C5) and in
`docs/09`/`docs/07`. You MUST NOT implement any `OPEN` item (notably the `Fo10` formulas:
`team_quality_aggregate`, full `proposal_score`, `consistency_score`, `experience_index`,
pair-dynamics aggregation, `role_score` aggregation, tuning-adjustment) until the user confirms
the exact formula. Implement `LOCKED` as written; flag `PROPOSED-V1` assumptions in your summary.

## Rule 4 — Honor the pre-coding gates
`docs/pairing-knowledge-graph.md` → "Pre-coding gates" lists 10 decisions that block specific
phases. Before starting a phase, confirm its gate is resolved (in `docs/07`/`docs/08` or with the
user). If a required gate is unresolved, do not start that phase — surface the gate instead.

## Rule 5 — Architecture is non-negotiable
Follow the layering in C9/`docs/11` and the quality standard C11/`docs/15` exactly:
- `app/api/*` routes are transport only: auth-guard → validate (zod) → call ONE `lib/server`
  service → shape response. No formulas, no orchestration, no Prisma in routes.
- All Prisma access lives in `lib/server/repositories/*`. Engine consumes a pre-shaped
  `PairingGenerationContext` (Maps), never raw tables, and issues no queries inside candidate
  or scoring loops.
- Keep the three layers separate (runtime generation / post-session metric update / periodic
  tuning+eval). Randomness only in final top-band selection and must be auditable.

## Rule 6 — Respect existing code
Existing models `DebateSession`, `Attendance`, `Member`, `cabinet` and roles
`TechHead | President | cabinet | Member` (`lib/server/roles.ts`, `prisma/schema.prisma`) are
EXTENDED, not broken. Migrations must preserve existing fields, data, and historical
readability (`15 §14`). Reuse `requireSessionUser({ roles })` from `lib/server/guards.ts` for
access control: lifecycle = `cabinet`+`President`; published read = `Member`+`cabinet`+`President`;
post-session scoring is gated on **session role**, not account role.

## Rule 7 — State what you grounded on
Every pairing change you propose or make must end with a short "Grounded in" line listing the
exact graph nodes and doc sections you used (e.g. `Grounded in: C7/D4, C8/A4, docs/11 engine.ts,
docs/14 §3`). If you cannot cite the governing doc, you are not ready to write the code.
<!-- END:pairing-context-rules -->
