# Pairing System — Build Plan (Tightly Coupled, Strict)

> **Authority chain.** This plan is derived from `docs/01`–`docs/15` and indexed by
> `docs/pairing-knowledge-graph.md`. Where a numbered doc and this plan disagree, the doc wins.
> Follow `AGENTS.md` → "Pairing System: mandatory context-extraction protocol" before every step.
>
> **How to read each step.** Every step lists: **Graph nodes** it implements, **Governing docs**
> you must read first, **Gate** that must be resolved before starting, **Deliverables** (exact
> files), and **Done-when** acceptance checks. Do not start a step until its gate is green and the
> previous step's Done-when checks pass. No step may be skipped or reordered.

## Ground truth about the current repo (verify before you start)
- Next.js (`^16`, custom — read `node_modules/next/dist/docs/`), Prisma `^7`, zod `^4`, next-auth.
- Roles: `TechHead | President | cabinet | Member` (`lib/server/roles.ts`). The eval doc's
  "techhead admin" = `TechHead`. "cabinet/president" admins = `cabinet` + `President`.
- Guard: `requireSessionUser({ roles, requireVerified })` (`lib/server/guards.ts`),
  response helpers in `lib/server/http.ts`.
- Existing models to EXTEND, not replace: `DebateSession` (`@@map("Session")`), `Attendance`,
  `Member`, `cabinet` (`prisma/schema.prisma`). A prior migration already added attendance/pairing
  fields — inspect it before editing the schema.
- `lib/server/` already exists and is the home for backend logic. `app/api/` is the route tree.

---

## Phase 0 — Decision freeze (no code)

**Goal:** turn the 10 pre-coding gates into confirmed decisions. **Nothing in Phases 1+ may begin
until the gate it depends on is resolved.**

- **Graph nodes:** Pre-coding gates 1–10. **Governing docs:** `07`, `08`, plus `05`/`09` for the
  formula/metric gates.
- **Deliverables:** record each decision inline in `docs/07-open-questions.md` (remove items as
  locked) and `docs/08-pre-coding-decisions.md`; reflect any change back into
  `docs/pairing-knowledge-graph.md`.
- **Done-when:** for each gate, the answer is written down and the graph status (`LOCKED` /
  `PROPOSED-V1` / `OPEN`) is updated. **Gate 10 (Fo10 OPEN formulas) blocks Phase 6 only** — the
  rest of the build can proceed while those formulas are finalized.

> Strict rule: if you reach a step whose gate is still `OPEN`, STOP and ask the user. Do not invent
> a formula, a field, or an access rule to keep moving.

---

## Phase 1 — Shared types  ·  `B0`

- **Graph nodes:** B0. **Governing docs:** `11 §Shared Type File Map`, `15 §8` (TS rigor).
- **Gate:** Gates 1, 5 (metric catalog + core models accepted).
- **Deliverables:**
  - `types/pairing.ts`, `types/session.ts`, `types/scoring.ts`, `types/eval.ts`.
  - Domain enums / `as const`: `ProposalStatus`, `SessionRole`, `PairingObjective`
    (`DEVELOPMENT|BALANCED|COMPETITIVE`), `MotionType`, `ReviewAction`, `ScoreSubmissionType`,
    `LeftoverReason`, `TuningMode`, BP `BenchPosition` (OG/OO/CG/CO), `SpeakingRole`
    (PM/DPM/LO/DLO/MG/GW/MO/OW).
  - Aliased ids: `MemberId`, `SessionId`, `ProposalId`, `PairKey`, `MetricKey`.
  - The `PairingGenerationContext` interface from `15 §7` (Maps for member/pair lookups).
- **Done-when:** `tsc` passes; no `any` in these files; every enum value matches the docs exactly.

---

## Phase 2 — Prisma schema + migration  ·  `C7 / D1–D18`

- **Graph nodes:** D1–D18 (+ D-PV logical). **Governing docs:** `12` (naming authoritative), `03`,
  `08 §5`, `15 §14` (migration safety).
- **Gate:** Gates 1, 2, 3, 4, 5 resolved.
- **Deliverables (in `prisma/schema.prisma`):**
  - Extend `DebateSession` (D1) and `Attendance`→ keep model, add D2 fields. Add `SessionRoleAssignment`
    (D3) — **session role is distinct from account role**.
  - Add the V1 model set: D4–D19 with the exact field names from `12` (D19 = `TeamDynamicsRating`,
    the speaker form's optional team-dynamics rating, stored with pair data — not on D13). Singular
    PascalCase, explicit relation names where a model joins `Member` twice (D13, D14, D18, D19).
  - **Participant reference convention (Gate 11 = Option B, account-agnostic):** pairing covers
    Member + cabinet + President (not TechHead). Every debater-referencing field is
    `(memberId?, cabinetId?, presidentId?)` with EXACTLY ONE set (extends existing `Attendance`).
    Apply to all participant-carrying models per `docs/12` "Participant Reference Convention";
    enforce exactly-one in validation/DB check. Do NOT key metrics to `Member` only.
  - Index every field flagged in `15 §6 Indexing rule`: session scoping, published-proposal lookup,
    proposal status, member-session-role, pair-metric key, score uniqueness, review timeline.
  - One migration; do not drop or rename existing columns relied on by current code.
- **Done-when:** `prisma migrate` applies cleanly on a copy; existing seed/data still reads; old
  migration history intact; `prisma generate` types match `types/*`.

> Defer LeaderboardSnapshot, MetricAdjustmentHistory, Eval* , TuningReviewWindow to Phase 8/9.

---

## Phase 3 — Repositories  ·  `B-repo`

- **Graph nodes:** B-repo (pairing/session/scoring/metrics/eval). **Governing docs:** `11 §Repository
  File Map`, `15 §6` (DB discipline), `15 §13` (transactions).
- **Gate:** Phase 2 done.
- **Deliverables (`lib/server/repositories/*`):** `pairing-repository.ts`, `session-repository.ts`,
  `scoring-repository.ts`, `metrics-repository.ts`, `eval-repository.ts`. Implement batch context
  loaders: `getGenerationContext(sessionId)`, `getMemberMetricSnapshots(ids)`,
  `getPairMetricSnapshots(keys)`, `getRoomAssignmentSummary(sessionId)`,
  `publishProposalTransaction(input)`.
- **Done-when:** all Prisma calls live here; every read projects only needed fields; no N+1; publish
  + multi-step writes are wrapped in transactions; repository unit/query tests pass.

---

## Phase 4 — Session, attendance & role services  ·  `B-sess`

- **Graph nodes:** B-sess, S1. **Governing docs:** `11 §Session Module`, `02 §1–2`, `14 §1–2`.
- **Gate:** Gate 3 (session-role-only routing). Phase 3 done.
- **Deliverables (`lib/server/sessions/*`):** `session-service.ts`
  (`getSessionPreparationContext`, `updateSessionLifecycleState`), `attendance-service.ts`
  (`prepareAttendance`, `markAttendance`, `finalizeAttendanceFromPublishedPairing`),
  `session-role-service.ts` (`assignSessionRole`, `getUserSessionRole`).
- **Done-when:** session lifecycle state transitions are guarded (`15 §9`); attendance entry pool
  feeds generation; service tests pass.

---

## Phase 5 — Pairing engine internals (deterministic + LOCKED math)  ·  `B5,B6,B7,B8,B9,B-ml,B2,B4`

- **Graph nodes:** E3–E9 minus scoring math; B5 hard-rules, B6 fallback, B7 objectives, B8
  leftovers, B9 chair-assignment, B-ml metrics-loader, B2 candidate-generator, B4 proposal-selector.
- **Governing docs:** `04`, `05`, `09` (only LOCKED formulas Fo1–Fo3, Fo6, Fo7, Fo8, Fo9),
  `15 §3,§4,§5`.
- **Gate:** Gates 2, 6, 7. (Scoring math Fo10 is Phase 6.)
- **Deliverables (`lib/server/pairing/*`):** `hard-rules.ts` (R-hard, R-hard-strict),
  `fallback.ts` (Fo2,Fo3), `objectives.ts` (Fo9), `leftovers.ts` (Fo7), `chair-assignment.ts`
  (Fo6), `metrics-loader.ts`, `candidate-generator.ts` (bounded — explicit max-candidate guardrail),
  `proposal-selector.ts` (Fo8 top-5 weighted), `types.ts`.
- **Done-when:** hard-rule filtering runs early; candidate search is bounded with enforced limits
  (`15 §4`); selection randomness is isolated and seed/metadata captured (`15 §11`); unit tests
  cover confidence fallback, leftover handling, room-balance inputs, top-band normalization,
  zero-observation fallback.

---

## Phase 6 — Scoring engine + orchestrator  ·  `B3, B1`  *(blocked by Gate 10)*

- **Graph nodes:** E8 scoring, B3 proposal-scorer, B1 engine. **Governing docs:** `09 §10–§17`
  (the OPEN Fo10 formulas), `05`, `04 §9–§12`, `15 §3,§11`.
- **Gate:** **Gate 10 — Fo10 formulas confirmed by the user.** Do not start otherwise.
- **Deliverables:** `proposal-scorer.ts` (`scoreProposal`, `scoreTeam` using the confirmed
  `team_quality_aggregate` / `proposal_score`), `engine.ts` (`generatePairingProposal` running the
  9 stages and persisting via `pairing-repository`).
- **Done-when:** score is deterministic for fixed candidate+context; engine persists proposal with
  engine/rule/metric version, top-band rank, selection probability, objective, seed (`15 §11`);
  eval replay (Phase 9) green vs. baseline before this engine is trusted (`15 §19`).

---

## Phase 7 — Review, publish & published read  ·  `B10, B11`

- **Graph nodes:** B10 review, B11 publish, S2–S4, D-PV. **Governing docs:** `11 §review.ts/publish.ts`,
  `02 §4–5`, `14 §3`, `15 §10,§11,§13` (override preservation, one source of truth, transactions).
- **Gate:** Gate 9 (access + published-view). Phase 6 done.
- **Deliverables (`lib/server/pairing/*`):** `review.ts` (approve/override/regenerate/rate —
  override preserves original), `publish.ts` (`publishApprovedProposal` transactional, finalize
  attendance, set single `publishedProposalId`; `getPublishedPairing` assembles D-PV).
- **Done-when:** publish forbidden before approval; exactly one official proposal per session;
  override keeps original + actor + reason; concurrency guard prevents double-publish (`15 §8,§10`).

---

## Phase 8 — Post-session scoring, learning & progress  ·  `B-score, B-progress, L1`

- **Graph nodes:** B-score, B-progress, L1, S6, S7, D12–D14; progress routes A15/A16, rule R6.
  **Governing docs:** `02 §6,§8`, `13 §what-learns`, `14 §4–5,§7`, `15 §10,§16`.
- **Gate:** Gate 4 (form fields), Gate 11 (participant ref — already resolved Option B). Phase 7 done.
- **Deliverables (`lib/server/scoring/*`):** `speaker-scoring-service.ts`, `chair-scoring-service.ts`,
  `leaderboard-service.ts` (derive from raw, never sole truth; speaker = cumulative total,
  adjudicator = average-only ranking with participation counts shown as context, not a ranking
  factor), `metric-update-service.ts` (`updateLearnedMetricsFromSession`,
  `updatePairHistoryFromSession`, `updateRolePerformanceFromSession`), and
  `member-progress-service.ts` (B-progress) producing the per-participant **verdict** (strengths /
  weaknesses / gaps / role-aptitude / compatibility, confidence-gated) for A15/A16. Progress
  interprets existing metrics only — NO new scoring.
- **Done-when:** scoring gated on session role (R4); duplicate submissions idempotent (`15 §10`);
  leaderboards recomputable from raw; metric snapshots + confidence updated (Fo2); progress verdict
  resolves all participant keys (member/cabinet/president) and never asserts from thin data.

---

## Phase 9 — Eval harness + tuning  ·  `B-eval, B-tune, V1–V5, L4`

- **Graph nodes:** B-eval, B-tune, V1–V5, L4, L5. **Governing docs:** `10`, `13 §tuning`, `15 §19`.
- **Gate:** Gate 8 (tuning governance). Phase 8 done.
- **Deliverables:** `lib/server/eval/*` (harness, replay-runner, regression-checker, report-builder,
  synthetic-scenarios, types) and `lib/server/pairing/tuning.ts` (bounded `|Δ| ≤ 0.03`, auditable).
  Add deferred models (Eval*, TuningReviewWindow, MetricAdjustmentHistory) now.
- **Done-when:** replay runs N-times/scenario; regression compare vs. baseline; tuning produces
  suggestions only (or bounded auto-apply if Gate 8 allows); no hard-rule break; HE3 safe-learning
  rules enforced.

---

## Phase 10 — Validations + route wiring  ·  `B-val, C8 / A1–A14`

- **Graph nodes:** B-val, A1–A14. **Governing docs:** `14` (route contracts), `11 §Route→Service`,
  `15 §2,§16` (thin routes, security).
- **Gate:** the service each route calls exists and its phase's Done-when passed.
- **Deliverables:** `lib/server/validations/{pairing,scoring,session}-validation.ts` (zod), then the
  route files in V1 priority order (`14 §Recommended V1 Route Priority`):
  1. `app/api/attendance/{prepare,mark}/route.ts` (A1,A2)
  2. `app/api/sessions/[sessionId]/route.ts` (+ `/scoring-status`) (A3,A3b,A3c)
  3. `app/api/pairing/generate/route.ts` (A4)
  4. `app/api/pairing/proposal/[proposalId]/{route,approve,override,regenerate,rate}/route.ts` (A5–A9)
  5. `app/api/pairing/publish/[sessionId]/route.ts` (A10)
  6. `app/api/pairing/published/[sessionId]/route.ts` (A11)
  7. `app/api/scoring/{speaker,chair}/route.ts` (A12,A13)
  8. `app/api/leaderboard/{speakers,adjudicators}/route.ts` (A13b)
  9. `app/api/eval/{replay,compare}/route.ts` (A14)
- **Access (via `requireSessionUser`):** A1–A10 → `["cabinet","President"]`; A11 →
  `["Member","cabinet","President"]`; A12/A13 → authenticated + **session-role** check in service;
  A14 → `["TechHead","President"]`.
- **Done-when:** each route only guards/validates/calls-one-service/formats; no logic leaks;
  integration tests in `15 §18` pass (cabinet/president can generate+publish, member cannot, member
  reads published, speaker sees correct scoring route, double-publish blocked, duplicate score safe).

---

## Phase 11 — Deprecation cleanup  ·  governs: `02 §12`, `11 §Existing Areas`, `07 §9`

- **Gate:** Gate 9 (cleanup scope confirmed) + the replacement flow live and tested.
- **Scope (confirm each before removal):** anonymous feedback flow, task assignment flow,
  attendance-linked manual pairing + speaker-score behavior, old non-proposal session routes.
- **Done-when:** removals are confirmed with the user, done behind the working replacement, and old
  published/historical data remains readable (`15 §14`). Do not delete blindly.

---

## Global Definition of Done (every phase)
Run the `15 §22` 15-point review checklist. A phase is done only when: types compile with no `any`;
no Prisma outside repositories; no query inside engine loops; state transitions guarded; randomness
auditable; one official published source; session-role routing correct; concurrency/stale-write
guarded; errors follow the `15 §15` taxonomy; observability hooks present (`15 §17`); and the phase's
required tests (`15 §18`) pass. End each change with the `AGENTS.md` Rule 7 "Grounded in" citation.
</content>
