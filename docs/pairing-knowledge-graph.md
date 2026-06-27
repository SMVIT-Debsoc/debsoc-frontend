# Pairing System — Knowledge Graph (Memory Graph)

> **What this file is.** A single, self-contained *memory graph* of the entire debate
> pairing feature, distilled from `docs/01` through `docs/17`. It exists so any agent
> (human or AI) can load the *whole idea* in one pass before touching code, then drill
> into the governing doc for exact detail.
>
> **This is a derived artifact, not a source of truth.** When this graph and a numbered
> doc disagree, the numbered doc wins and this file must be corrected. Every node cites
> its governing doc(s). Read this graph first, then read the cited docs for the slice you
> are building. See `AGENTS.md` → "Pairing System: mandatory context-extraction protocol".
>
> **Format.** Nodes are `[N#] Label` with a type, the doc(s) that govern them, and a
> one-line meaning + rationale. Edges are `source --relation--> target`. Hyperedges group
> 3+ nodes that participate in one flow. Communities are clusters of related nodes.

---

## Build status (updated at the end of every phase — see `docs/build/`)

> Per `AGENTS.md` Rule 8, the agent updates this table and tags implemented nodes `BUILT`
> (path) when a phase's Done-when passes. A phase is not complete until this reflects reality.

| Phase | Scope | Status | Notes |
|-------|-------|--------|-------|
| 0 | Decision freeze (gates 1-10) | not started | |
| 1 | Shared types (B0) | not started | |
| 2 | Schema D1-D18 | not started | |
| 3 | Repositories (B-repo) | not started | |
| 4 | Session services (B-sess) | not started | |
| 5 | Engine internals (LOCKED) | not started | |
| 6 | Scoring engine (B1,B3) | blocked: Gate 10 | |
| 7 | Review/publish (B10,B11) | not started | |
| 8 | Post-session scoring + progress (B-score, B-progress) | not started | |
| 9 | Eval + tuning | not started | |
| 10 | Realtime websocket integration (B-rt,A17) | not started | |
| 11 | Validations + routes | not started | |
| 12 | Deprecation cleanup | not started | |

Node status markers used below: `BUILT (path)` = implemented & verified; otherwise the node is
still planned. `RETIRED` = removed in Phase 12.

## Legend

- **Node types:** `concept` (domain idea), `rule` (hard/soft constraint), `formula`
  (math), `model` (DB entity), `service` (backend module), `route` (API endpoint),
  `role` (access actor), `state` (lifecycle state), `flow` (process), `standard`
  (engineering rule).
- **Confidence of a design point:** `LOCKED` (treat as fixed), `PROPOSED-V1`
  (implement as written, may refine), `OPEN` (must be confirmed before coding � see
  `docs/07-open-questions.md`).
- **Edge relations:** `governs`, `produces`, `feeds`, `validated_by`, `persists_to`,
  `calls`, `falls_back_to`, `restricted_to`, `transitions_to`, `optimizes`, `part_of`.

---

## Communities (clusters)

| # | Community | Owning docs | Core nodes |
|---|-----------|-------------|-----------|
| C1 | Product intent & access control | 01, 02 | N1, N2, N3, R1�R4 |
| C2 | Lifecycle & state machine | 02, 04, 06 | S1�S8, F1 |
| C3 | Engine pipeline | 04, 15 | E1�E9 |
| C4 | Metrics taxonomy | 05, 08 | M1�M18 |
| C5 | Formulas | 09, 05 | Fo1�Fo10 |
| C6 | Learning & tuning loop | 13, 05 | L1�L5 |
| C7 | Data model | 03, 12, 08 | D1�D18 |
| C8 | API surface | 14, 11, 17 | A1–A17 |
| C9 | Backend module map | 11, 17 | B1–B12, B-rt |
| C10 | Eval harness | 10, 13 | V1�V5 |
| C11 | Engineering quality standard | 15, 17 | Q1�Q18 |

---

## C1 — Product intent & access control  ·  governs: `01`, `02`

- **[N1] Pairing system** · concept · `01` — Central coordination layer for attendance →
  role assignment → generation → review → publication → scoring → leaderboards → learning.
  *Rationale: treated as a platform-level redesign, not an isolated feature.*
- **[N2] Adaptive probabilistic engine** · concept · `01`,`05` — Rule-driven, metric-aware,
  history-aware, admin-reviewed, probabilistic, progressively improvable. Generates strong
  *proposals*, not unchecked output.
- **[N3] Review-first publication** · concept · `01`,`02` — A proposal is NEVER public on
  generation; an admin must approve/override/regenerate before it becomes official.
- **[Rl-cabinet] cabinet** · role · `01`,`14` — May control the full pairing lifecycle.
- **[Rl-president] President** · role · `01`,`14` — May control the full pairing lifecycle.
- **[Rl-member] Member** · role · `01`,`14` — May NOT control lifecycle; MAY read the
  published pairing after publication.
- **[Rl-techhead] TechHead** · role · `14` — Admin/internal; eval routes.
  *(Code note: existing `DebsocRole = TechHead | President | cabinet | Member`,
  `lib/server/roles.ts`. Eval doc's "techhead admin" maps to `TechHead`.)*
- **[R1] Lifecycle-control = cabinet+president only** · rule · `01`,`02`,`14` — generate,
  review, approve, override, regenerate, rate, publish, attendance prep, session update.
- **[R2] Published read = member+cabinet+president** · rule · `01`,`02`,`14` — after publish.
- **[R3] Two access paths** · rule · `02` — restricted write/control routes vs. published
  read route. Generation access and published visibility are intentionally different.
- **[R4] Session-role authorization** · rule · `08`,`14`,`15` — post-session routing and
  scoring-form access are driven by a user's **role in that session**, never permanent role.
- **[R5] Scoring oversight access** · rule · `14 §scoring-status/Auth`,`15 §16` — scoring
  completion tracking (who hasn't filled their role's form) is read-only oversight for cabinet,
  president, and TechHead; completion + identity only, never submission content; nudge/close
  actions = cabinet+president only. *Completion ≠ content.*
- **[R6] Member-progress access** · rule · `14 §7`,`15 §16` — per-person progress analytics readable
  by cabinet+president for ANY participant; a member sees only their own. Analytics surface (≠
  leaderboard ranking). **Dependency:** requires participant metrics to cover cabinet accounts, not
  only `Member` (see Gate 11 below).

Edges:
- N1 --part_of--> N2, N3
- R1 --restricted_to--> Rl-cabinet, Rl-president
- R2 --restricted_to--> Rl-member, Rl-cabinet, Rl-president
- N3 --governs--> S3 (proposal approved) — see C2

---

## C2 — Lifecycle & state machine  ·  governs: `02`, `04`, `06`, `15 §9`

- **[S1] Session preparation** · state — attendance marked, roles assigned, session inputs set.
- **[S2] Proposal generated** · state — engine produced a proposal; not public.
- **[S3] Proposal approved** · state — admin approved; eligible for publish.
- **[S3b] Proposal overridden** · state — admin manually changed; original preserved (Q11).
- **[S4] Proposal published** · state — official pairing exists; attendance finalized.
- **[S5] Session active** · state.
- **[S6] Session completed** · state — scoring window open.
- **[S7] Scoring completed** · state.
- **[S8] Tuning window** · state — batch of 6–7 sessions reviewed.
- **[F1] End-to-end lifecycle** · flow · `02`,`04` —
  prepare → generate → review/rate → publish → run → score → update history → tune.

Edges / transitions (each transition MUST be guarded — `15 §9`):
- S1 --transitions_to--> S2 (only cabinet/president)
- S2 --transitions_to--> S3 / S3b
- S3 --transitions_to--> S4 (**publish forbidden before approval**)
- S4 --transitions_to--> S5 --transitions_to--> S6
- S6 --transitions_to--> S7 (speaker/chair scoring; **blocked before publish+completion**)
- S7 --feeds--> S8
- **Invariant:** exactly one official published proposal per session (`15 §13`).

Hyperedge **HE1 (lifecycle)**: {S1,S2,S3,S4,S5,S6,S7} form_one state machine governed by N3.

---

## C3 — Engine pipeline  ·  governs: `04`, `15 §3–§5`

- **[E1] Session preparation input** · flow · `04` — present participants + session-role split.
- **[E2] Session-only inputs** · concept · `04`,`05` — motion type, motion, time_constraint,
  event_team_up_preference, pairing_objective. Affect the current cycle ONLY (not learned).
- **[E3] Data loading (once)** · flow · `04`,`15 §6` — load history + DB metrics in a small,
  deliberate number of reads; front-load all DB cost. No queries inside candidate loops.
- **[E4] Pool construction** · flow · `04` — speaker pool, adjudicator pool, chair pool.
- **[E5] Feasibility & validity checks** · rule · `04`,`05` — enough speakers/adjudicators,
  no duplicate roles, strict session rules satisfiable. Fail explicitly if infeasible.
- **[E6] Room-count determination** · formula · `04`,`09` — `room_count = floor(speakers/8)`;
  leftovers marked `UNASSIGNED`, never silently dropped.
- **[E7] Candidate generation (bounded)** · flow · `04`,`15 §4` — build many valid
  arrangements; bounded search with pruning + hard-rule filtering early; explicit max-candidate
  and time-budget guardrails from V1.
- **[E8] Candidate scoring (deterministic)** · flow · `04`,`05`,`09` — score each valid
  candidate; deterministic for fixed candidate+context; reuse cached metric maps.
- **[E9] Top-band probabilistic selection** · formula · `04`,`05`,`09` — keep top 5, convert
  to weighted probabilities, pick one. Randomness affects ONLY selection, never validity.

Edges:
- E1 --feeds--> E3; E2 --feeds--> E3; E3 --feeds--> E4 --feeds--> E5
- E5 --validated_by--> R-hard (C4); E6 --feeds--> E7 --produces--> candidates
- E7 --feeds--> E8 --feeds--> E9 --produces--> D4 (PairingProposal)
- Pipeline string (`04 §18`): `prepared participants -> session inputs -> historical data
  -> metric activation -> candidate generation -> scoring -> top-band probabilistic selection
  -> proposal -> admin review -> publish -> post-session learning -> periodic tuning`

Hyperedge **HE2 (engine stages, `15 §3`)**: {E3,E4,E5,E7,E8,E9} participate_in one bounded
search-and-score request that ends in one persisted proposal with score explanation.

---

## C4 — Metrics taxonomy  ·  governs: `05`, `08 §1`

Four layers (`05`): **hard rules**, **session-only inputs**, **learned metrics**,
**soft optimization metrics**.

### Learned DB metrics (with base-weight zones & fallbacks)
- **[M1] speaker_total_score** · 0.20–0.24 · broad, no fallback. **CUMULATIVE SUM** of raw speaker
  scores across sessions (NOT averaged) = additive speaker leaderboard value; rewards attendance,
  so non-attendees can't rank high on an average (`09 §16b`). Ability-for-balance = M3 speaker_strength.
- **[M2] speaker_motion_type_score** · 0.16–0.20 · falls_back_to M1.
- **[M3] speaker_strength** · 0.10–0.14 · falls_back_to M1; formula Fo4. Built on cumulative M1 +
  consistency + confidence → **intentionally attendance/data-sensitive**: irregular/low-data members
  get a lower, less-trusted strength (less practice = weaker; thin data = low confidence). NOT
  attendance-neutral (`05` Regularity/Data Sensitivity, `09 §4`).
- **[M4] partner_dynamics_overall** · 0.10–0.14 · BP result points 3/2/1/0 (primary); optional
  secondary input from D19 TeamDynamicsRating; no fallback.
- **[M5] partner_dynamics_by_motion_type** · 0.08–0.12 · falls_back_to M4.
- **[M6] repeat_partner_penalty** · −0.06…−0.10 · soft penalty.
- **[M7] bp_position_history** · 0.06–0.09 · tracks OG/OO/CG/CO; diversity.
- **[M8] internal_speaking_role_history** · 0.06–0.10 · tracks PM/DPM/LO/DLO/MG/GW/MO/OW.
- **[M9] role_score** · falls_back_to M1 · per exact speaking role.
- **[M10] motion_type_x_role_score** · falls_back_to M9→M2→M1 · most specific; trust slowly.
- **[M11] academic_year** · 0.04–0.07 · experience balance input.
- **[M12] adjudicator_average_score** · 0.16–0.22 · chair scores each adj individually (1/session);
  **mean across sessions** = leaderboard rank (average ONLY, not cumulative, not count-boosted) so a
  member can be both speaker & adjudicator without penalty; counts (#adjudicated/#chaired) shown as
  context only (`09 §16b`).
- **[M13] chair_score** · 0.16–0.22 · falls_back_to M12. (Renamed from "CAP score".) **Derived
  average** of speaker→chair ratings: two-stage mean (within session, then across sessions),
  confidence by sessions chaired (target 4). Many `ChairFeedbackRecord` rows in → one averaged
  score out → leaderboard-stable. (Within-session multi-rater averaging applies to M13 ONLY; M12 =
  across-session mean+counts, M1 = cumulative sum — `09 §16b`.)
- **[M18] room_balance_score** · 0.35–0.45 · proposal-level; formula Fo5; only when rooms>1.

### Session-only inputs (`05`; stored with the generation request, never learned)
- **[M14] time_constraint** · strict OR high-priority soft (early speaking role if leaving early).
- **[M15] event_team_up_preference** · strict OR very-high soft (keep A+B same team).
- **[M16] motion_type** · activates M2, M5.
- **[M17] motion** · recordkeeping/analytics.
- **[Obj] pairing_objective** · enum `DEVELOPMENT | BALANCED | COMPETITIVE` · drives multipliers Fo9.

### Hard rules (`05`; violation ⇒ invalid proposal)
- **[R-hard] Core validity** · rule — only present participants; each marked speaker|adjudicator;
  no double assignment; each room = exactly 8 speakers, 4 teams, 2 speakers/team; benches
  OG/OO/CG/CO; ≥1 adjudicator/room; exactly 1 chair/room; no publish without approval.
  *(Panel size beyond the 1 required adjudicator is NOT hard — it is the soft, overridable panel
  distribution in B9/Fo6b.)*
- **[R-hard-strict] Session strict rules** · forced team-up, forced separation, strict
  time-constraint, forced chair, forced role, forced room-count override.

Edges:
- M2 --falls_back_to--> M1; M5 --falls_back_to--> M4; M10 --falls_back_to--> M9
  --falls_back_to--> M1; M13 --falls_back_to--> M12; M3 --falls_back_to--> M1
- M16 --feeds--> M2, M5; Obj --governs--> Fo9
- All Mx --feeds--> E8 (scoring); R-hard --validated_by--> B5 (hard-rules.ts)
- **Catalog gate (`08 §1`):** the V1 metric catalog = M1–M13, M18, M11 (confirm before coding).

---

## C5 — Formulas  ·  governs: `09` (status legend authoritative)

- **[Fo1] effective_weight = base_weight + learned_adjustment** · LOCKED · `|adj| ≤ 0.03`.
- **[Fo2] confidence = min(observation_count / target_count, 1.0)** · LOCKED.
- **[Fo3] effective_metric = confidence·specific + (1−confidence)·fallback** · LOCKED.
- **[Fo4] speaker_strength = 0.70·norm_total + 0.20·consistency + 0.10·confidence** · PROPOSED-V1.
- **[Fo5] room_balance_score = 1.0 − (0.75·norm_strength_var + 0.25·norm_experience_var)**;
  `=1.0` if one room · PROPOSED-V1.
- **[Fo6] chair_assignment_score = 0.60·chair_score + 0.25·adj_avg + 0.15·chair_confidence** · LOCKED.
- **[Fo6b] adjudicator panel distribution** · PROPOSED-V1 · `surplus = total_adj − room_count`;
  hardest-first round-robin; cap `MAX_ADJUDICATORS_PER_ROOM = 3`; overflow → RESERVE. Soft/overridable (`09 §6b`).
- **[Fo7] room_count = floor(speakers/8); leftovers = speakers % 8** · LOCKED.
- **[Fo8] top-band: top 5, weighted random; pattern 0.30/0.24/0.18/0.15/0.13** · LOCKED (size & shape OPEN to refine, `07 §4`).
- **[Fo9] objective_adjusted_weight = effective_weight · objective_multiplier** · LOCKED.
- **[Fo10] OPEN formulas** · `09 §10–§17` — `team_quality_aggregate`, full `proposal_score`,
  `consistency_score`, `experience_index`, pair-dynamics aggregation, `role_score`
  aggregation, tuning-adjustment. **These are `OPEN`/`STILL OPEN`: must be confirmed with the
  user before the scoring engine is coded.**

Confidence target counts (`05`; OPEN per `07 §3`): motion-type speaker 5 · pair-by-motion 4 ·
role 5 · motion×role 5 · chair 4.

Edges:
- Fo1 --governs--> all metric weights; Fo2 --feeds--> Fo3; Fo3 --governs--> M2,M5,M9,M10,M13
- Fo4 --produces--> M3; Fo5 --produces--> M18; Fo6 --governs--> chair assignment (B9)
- Fo8 --governs--> E9; Fo9 --governs--> Obj
- **Freeze gate (`09 §18`):** Fo1–Fo3, Fo4, Fo5, Fo6, Fo7, Fo8 ready for V1; Fo10 NOT ready.

---

## C6 — Learning & tuning loop  ·  governs: `13`, `05`

- **[L1] Per-session learning** · flow · `13` — after each session update speaker-side (M1–M3,
  M9, M10, M7, M8), pairing-side (M4, M5, M6), adjudication-side (M12, M13, counts).
- **[L2] Confidence growth** · concept · `13`,`05` — more observations ⇒ specific metrics gain
  influence, fallback reliance drops (via Fo2/Fo3).
- **[L3] Proposal-quality signal** · concept · `13`,`05` — admin rating + issue tags capture
  whether a proposal *looked* sensible, separate from noisy debate outcomes.
- **[L4] Batch tuning (6–7 sessions)** · flow · `13`,`05` — compare proposal score vs. admin
  rating vs. outcomes; suggest bounded `learned_adjustment` changes (`|Δ| ≤ 0.03`); auditable.
- **[L5] Three preserved layers** · standard · `13 §recommended`,`15` — (1) runtime generation,
  (2) post-session metric update, (3) periodic tuning+eval. MUST stay separate modules.

Edges:
- S7 --feeds--> L1 --feeds--> L2; L3 --feeds--> L4; L4 --produces--> D16 (PairingMetricAdjustment)
- L4 --validated_by--> C10 (eval harness); L5 --governs--> B-layering (C9)

Hyperedge **HE3 (safe-learning rules, `13 §safe`)**: never break hard rules · never auto-publish ·
never trust specific metrics too early · never tune from one session · never large auto jumps ·
always auditable · always eval against baseline.

---

## C7 — Data model  ·  governs: `12` (naming authoritative), `03`, `08 §5`

> Prisma direction (`12`): singular PascalCase models; explicit relation names where a model
> connects twice; avoid vague names. Existing models to CHANGE: `Attendance`, `DebateSession`,
> `Member`, `cabinet` (`prisma/schema.prisma`). **Do not break existing fields/migrations.**

### Minimal V1 model set (`12 §Minimal V1`) — build these first
- **[D1] DebateSession** (extend) — date, motionType, motionText, pairingObjective, status,
  pairingStatus, publicationStatus, scoringStatus, acceptedProposalId, publishedProposalId, publishedAt.
- **[D2] AttendanceRecord** (extend `Attendance`) — isPresent, isFinalized, wasAssigned,
  wasUnassigned, unassignedReason.
- **[D3] SessionRoleAssignment** — sessionId, memberId, role, isChair, roleAssignedAt.
  *Critical: session role ≠ permanent account role (R4).*
- **[D4] PairingProposal** — version, status, engineVersion, ruleVersion, topBandRank,
  proposalScore, scoreBreakdownJson, generatedAt/By, approvedAt, publishedAt, isPublishedOfficially.
- **[D5] DebateRoomAssignment** — roomIndex, roomScore, roomBalanceScore, roomDifficultyScore.
- **[D6] DebateTeamAssignment** — bpPosition (OG/OO/CG/CO), teamScore.
- **[D7] TeamSpeakerAssignment** — memberId, speakingRole (PM…OW), speakerOrder.
- **[D8] RoomAdjudicatorAssignment** — memberId, isChair, chairAssignmentScore.
- **[D9] UnassignedParticipant** — proposalId, memberId, reason.
- **[D10] ProposalReviewLog** — reviewerId, action, notes, createdAt.
- **[D11] ProposalRating** — reviewerId, rating, issueTagsJson, notes.
- **[D12] SpeakerScoreRecord** — bpPosition, speakingRole, rawScore, teamResultPoints,
  `scoredByMemberId` (the **chair** enters speaker scores — Gate 4).
- **[D13] ChairFeedbackRecord** — speakerMemberId, chairMemberId, `rating` (speaker→chair 0–10),
  notes. (Team-dynamics rating is NOT here — see D19.)
- **[D14] AdjudicatorScoreRecord** — chairMemberId, adjudicatorMemberId, rating, notes.
- **[D15] PairingMetricDefinition** — key, category, baseWeight, isEnabled, isHardRule,
  isSoftRule, scope, fallbackConfigJson.
- **[D16] PairingMetricAdjustment** — currentAdjustment, lastUpdatedAt, sourceWindowId.
- **[D17] MemberMetricSnapshot** — metricKey, contextKey, value, observationCount, confidence.
- **[D18] PairMetricSnapshot** — memberAId, memberBId, metricKey, contextKey, value, obs, confidence.
- **[D19] TeamDynamicsRating** — sessionId, raterMemberId, teammateMemberId, rating 0–10. The
  speaker form's optional team-dynamics rating, stored WITH the pair-dynamics data (not on D13);
  **secondary** input to partner_dynamics (M4/M5), which stays results-based.

### Deferrable (`12 §later`)
LeaderboardSnapshot, MetricAdjustmentHistory, EvalScenario, EvalRun, EvalScenarioResult,
TuningReviewWindow.

### Logical read model (not a table in V1)
- **[D-PV] PublishedPairingView** — assembled from D1+D4+D5+D6+D7+D8; the official member-visible read.

Edges (relationship map, `12`):
- D1 --has_many--> D2, D3, D4, D12, D13, D14
- D4 --has_many--> D5, D9, D10; --has_one?--> D11
- D5 --has_many--> D6, D8; D6 --has_many--> D7
- D15 --has_one--> D16; Member --has_many--> D17, D18
- E9 --persists_to--> D4; publish --persists_to--> D1.publishedProposalId (one source of truth)

---

## C8 — API surface  ·  governs: `14` (route contracts authoritative), `11`, `17`

Route groups: attendance, sessions, pairing, scoring, leaderboard, progress, realtime, eval. All routes thin;
logic in `lib/server/...`; access explicit. **V1 priority order = the list below.**

- **[A1] POST /api/attendance/prepare** · cabinet,president → `prepareAttendance()`.
- **[A2] POST /api/attendance/mark** · cabinet,president → `markAttendance()`.
- **[A3] GET /api/sessions/:id** · cabinet,president → `getSessionPreparationContext()`.
- **[A3b] PATCH /api/sessions/:id** · cabinet,president → session update (motionType/Text/objective).
- **[A3c] GET /api/sessions/:id/scoring-status** · oversight read = cabinet+president+TechHead; participants see their own task status only.
- **[A4] POST /api/pairing/generate** · cabinet,president ONLY → `generatePairingProposal()`.
- **[A5] GET /api/pairing/proposal/:id** · cabinet,president → repository fetch.
- **[A6] POST …/proposal/:id/approve** · → `approveProposal()`.
- **[A7] POST …/proposal/:id/override** · → `overrideProposal()`.
- **[A8] POST …/proposal/:id/regenerate** · → `regenerateProposal()`.
- **[A9] POST …/proposal/:id/rate** · → `rateProposal()`.
- **[A10] POST /api/pairing/publish/:sessionId** · → `publishApprovedProposal()`.
- **[A11] GET /api/pairing/published/:sessionId** · member,cabinet,president → `getPublishedPairing()`.
- **[A12] POST /api/scoring/speaker** · session speakers only → `submitSpeakerChairRating()`; speakers do NOT enter raw speaker score.
- **[A13] POST /api/scoring/chair** · session chairs only → `submitChairAdjudicatorScore()` + `submitRoomSpeakerScores()`.
- **[A13b] GET /api/leaderboard/speakers · /adjudicators** · authenticated.
- **[A14] POST /api/eval/replay · /eval/compare** · TechHead,president.
- **[A15] GET /api/progress/members** · cabinet+president · OPTIONAL batch summary for the existing roster.
- **[A16] GET /api/progress/members/:participantId** · cabinet+president or participant self-only · returns raw metrics plus a synthesized verdict.
- **[A17] GET /api/realtime/socket** · authenticated pairing-system roles → websocket connection + filtered subscriptions.

Edges:
- A4 --validated_by--> B-val-pairing; A4 --calls--> B1 (engine.ts)
- A6–A9 --calls--> B10 (review.ts); A10,A11 --calls--> B11 (publish.ts)
- A11 --reads--> D-PV (official source only); A12/A13 --validated_by--> R4 (session role)
- A15,A16 --calls--> B-progress
- A17 --calls--> B-rt; A17 --restricted_to--> Rl-member, Rl-cabinet, Rl-president, Rl-techhead

---

## C9 — Backend module map  ·  governs: `11`, `17` (folder/file/export map authoritative)

Principle (`11`,`15 §2`): `app/api/*` = transport only (parse, guard, call ONE service, format);
`lib/server/*` = domain logic; Prisma only in repositories; shared contracts in `types/`.

- **[B0] types/{pairing,session,scoring,eval}.ts** · shared contracts.
- **[B1] lib/server/pairing/engine.ts** · `generatePairingProposal()` orchestrator (the 9 stages).
- **[B2] candidate-generator.ts** · `generateCandidateProposals()`.
- **[B3] proposal-scorer.ts** · `scoreProposal()`, `scoreTeam()`.
- **[B4] proposal-selector.ts** · `selectProposalFromTopBand()` (Fo8).
- **[B5] hard-rules.ts** · `validateHardRules()`, `isCandidateValid()` (R-hard).
- **[B6] fallback.ts** · `computeConfidence()`, `blendSpecificWithFallback()` (Fo2,Fo3).
- **[B7] objectives.ts** · `getObjectiveMultipliers()`, `applyObjectiveMultiplier()` (Fo9).
- **[B8] leftovers.ts** · `computeRoomPlan()`, `buildUnassignedParticipants()` (Fo7).
- **[B9] chair-assignment.ts** · `computeChairAssignmentScore()`, `assignChairsToRooms()`, and adjudicator panel distribution.
- **[B-ml] metrics-loader.ts** · `loadPairingMetrics()`, `loadSessionInputs()`.
- **[B10] review.ts** · approve/override/regenerate/rate.
- **[B11] publish.ts** · `publishApprovedProposal()`, `getPublishedPairing()`.
- **[B-tune] tuning.ts** · `buildTuningReview()`, `suggestMetricAdjustments()` (L4).
- **[B-sess] sessions/{session,attendance,session-role}-service.ts**.
- **[B-score] scoring/{speaker,chair,leaderboard,metric-update}-service.ts** (L1).
- **[B-progress] scoring/member-progress-service.ts** · reads metric snapshots + raw records and produces the per-participant verdict.
- **[B-rt] realtime/{websocket-hub,event-publisher,channel-auth,types}.ts** + `types/realtime.ts` · authenticated websocket delivery + post-commit event fan-out.
- **[B-eval] eval/{harness,replay-runner,regression-checker,report-builder,synthetic-scenarios}.ts**.
- **[B-repo] repositories/{pairing,session,scoring,metrics,eval}-repository.ts** · all Prisma here.
- **[B-val] validations/{pairing,scoring,session}-validation.ts** · zod (project uses zod v4).

Anti-patterns (`11 §What Should Not Happen`, forbidden): formulas in routes; one giant service;
eval mixed into runtime; attendance-prep mixed with scoring; Prisma spread without repositories.

Implementation order (`11 §Recommended`): types → repositories → session/attendance services →
pairing internal modules → review+publish → published read → scoring → progress → eval → realtime modules → wire routes and websocket entrypoint.

---

## C10 — Eval harness  ·  governs: `10`, `13 §why eval`

- **[V1] Eval harness** · service · `10`,`11` — replay engine against historical/synthetic
  scenarios; safety net around learning. Not optional.
- **[V2] Replay datasets** · concept · `10` — historical + synthetic edge cases.
- **[V3] Scoring dimensions** · concept · `10` — validity, room balance, repetition control,
  objective behavior, admin-rating alignment, outcome alignment.
- **[V4] Probabilistic run strategy** · concept · `10` — many runs per scenario (count OPEN, `07 §8`).
- **[V5] Regression check vs. baseline** · rule · `10`,`15 §19` — any change to scores,
  candidate generation, tuning, or fallback MUST pass eval vs. baseline before trust.

Edges: L4 --validated_by--> V5; V5 --gates--> engine/formula changes; V1 --feeds--> rollout (`15 §19`).

---

## C11 � Engineering quality standard  �  governs: `15`, `17` (implementation contract)

Each is a non-negotiable `standard` node; full text in `15`. Treat as the review checklist gate.

- **[Q1] Correctness** � no double assignment, no invalid rooms, no unreviewed publish, no
  published/visible mismatch, no stale-proposal action, no leaderboard from partial scores.
- **[Q2] Layered architecture** � route/service/repository/formula separation (C9).
- **[Q3] Bounded engine** � constrained generation, early invalidation, pruning, explicit
  max-candidate + time-budget + top-band-size guardrails from V1; no combinatorial explosion.
- **[Q4] Front-loaded DB access** � batch-load context; project only needed fields; NO query in
  candidate/scoring loops; N+1 forbidden; index session/proposal/role/pair/score-uniqueness fields.
- **[Q5] Pre-shaped context object** � engine consumes `PairingGenerationContext` (Maps for
  per-member/per-pair lookup), not raw tables.
- **[Q6] TypeScript rigor** � no `any`; explicit service-boundary types; enums/`as const` for
  proposal status, session role, objective, motion type, review action, score type, leftover
  reason, tuning mode; aliased ids (`MemberId`, `SessionId`, `ProposalId`); numeric safety
  (normalize probabilities, clamp, no divide-by-zero, explicit zero-observation fallback).
- **[Q7] State-machine discipline** � explicit validated transitions + stale-write/version guards.
- **[Q8] Concurrency & idempotency** � guard double-generate/double-publish/duplicate-score;
  one official publish wins; optimistic locking / `updatedAt` checks; machine-readable conflicts.
- **[Q9] Auditable randomness** � randomness only in final selection; store engine/rule/metric
  version, candidate score summary, top-band rank, selection probability, seed, objective.
- **[Q10] Override preserves original** � keep original proposal, actor, reason, overridden fields.
- **[Q11] Transactions & one source of truth** � publish/score/tuning/override are transactional;
  one official published proposal per session; full-commit or full-rollback only.
- **[Q12] Config/rule/schema governance** � validate rules before activation; reject contradictory
  configs; migrations preserve replayability + historical readability + version refs.
- **[Q13] Error taxonomy** � distinguish validation/authz/impossible-state/insufficient-
  participants/no-valid-proposal/stale/duplicate/conflict/timeout/config errors; stable shape.
- **[Q14] Observability** � log generation start/end/duration, candidate counts, rejected count,
  top-band size, selected id, publish + score + tuning outcomes, conflicts; latency metrics.
- **[Q15] Test layers** � unit (formulas, guards), service (generate/publish), repository,
  integration (role-based scoring + published visibility), concurrency, eval-replay, migration.
- **[Q16] Realtime post-commit rule** � websocket events are emitted only after authoritative commit; HTTP stays source of truth (`15 �24`, `17`).
- **[Q17] Realtime visibility rule** � websocket payloads are role-filtered, session-filtered, and member-safe where required (`15 �16`,`15 �24`,`17`).
- **[Q18] Realtime recovery rule** � reconnect must recover through authenticated resubscribe + HTTP refetch; websocket failure must not corrupt committed state (`15 �24`,`17`).

Cross-cutting edge: **Q-context (`15 �21`)** � AI-assisted work MUST reference the *smallest
relevant doc subset* per task, not the whole folder. This graph is the index that enables that.

---

## Master cross-community edges (the "whole idea" in one breath)

```
N1 product
  └─ N2 adaptive engine ── N3 review-first
       │                      │
   C3 engine pipeline     C2 state machine ──restricted_to── C1 roles (R1/R2/R4)
   (E1..E9)                (S1..S8)
       │ scores with           │ persists
   C4 metrics (M1..M18) ──Fo──> C5 formulas (Fo1..Fo10, Fo10=OPEN)
       │ updated by                         │
   C6 learning loop (L1..L5) ──validated_by──> C10 eval (V1..V5)
       │ stored in
   C7 data model (D1..D18) --read by--> C8 API (A1..A17) --calls--> C9 modules (B*)
                                   everything bounded by --> C11 quality (Q1..Q18)
```

## Pre-coding gates (must be resolved before the matching phase — `07`, `08`)
1. **Metric catalog accepted** (M1-M13, M18, M11) - RESOLVED. Full V1 catalog accepted; no listed metric deferred at this stage. Blocks C4/C7/C5.
2. **Hard vs soft rule split confirmed** - RESOLVED. Accepted V1 split: R-hard core validity and R-hard-strict forced constraints remain hard; room balance, repeat partner penalty, pair quality, role/motion fit, and surplus panel distribution remain soft. Blocks B5/E5.
3. **Session-role-only routing confirmed (R4)** — blocks D3/A12/A13.
4. **Post-session form fields confirmed** — RESOLVED (Gate 4): speaker form = chairScore 0–10 +
   optional teamDynamicsRating 0–10; chair form = adjudicator scores + chair-entered raw speaker
   scores; non-chair adjudicators submit nothing. See `docs/14 §4`, `docs/02 §6`.
5. **Core models accepted (C7)** — blocks schema work.
6. **Room/leftover rules accepted (Fo7)** — blocks B8.
7. **Top-band selection accepted (Fo8)** — blocks B4.
8. **Tuning governance (auto vs review-assisted)** — blocks B-tune.
9. **Access-control + published-view rules accepted (R1/R2)** — blocks guards.
10. **OPEN formulas Fo10 finalized** — blocks B3 (scoring engine).
11. **Participant identity for metrics/progress** — RESOLVED: **Option B**, account-agnostic.
    Pairing covers `Member` + `cabinet` + `President` (TechHead does not debate). Tables stay
    separate; every debater-referencing field is a **participant reference** = (`memberId?`,
    `cabinetId?`, `presidentId?`) with EXACTLY ONE set. Metric reads, leaderboards, and progress
    (A15/A16) must resolve all three keys. See `docs/12` "Participant Reference Convention".
    Constrains Phase 2 schema. (Heads-up: with 3 debating account types, unified-id Option A is
    worth revisiting; staying on B per decision.)
</content>
</invoke>



