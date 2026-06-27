# Pairing System Ã¢â‚¬â€ Knowledge Graph (Memory Graph)

> **What this file is.** A single, self-contained *memory graph* of the entire debate
> pairing feature, distilled from `docs/01` through `docs/17`. It exists so any agent
> (human or AI) can load the *whole idea* in one pass before touching code, then drill
> into the governing doc for exact detail.
>
> **This is a derived artifact, not a source of truth.** When this graph and a numbered
> doc disagree, the numbered doc wins and this file must be corrected. Every node cites
> its governing doc(s). Read this graph first, then read the cited docs for the slice you
> are building. See `AGENTS.md` Ã¢â€ â€™ "Pairing System: mandatory context-extraction protocol".
>
> **Format.** Nodes are `[N#] Label` with a type, the doc(s) that govern them, and a
> one-line meaning + rationale. Edges are `source --relation--> target`. Hyperedges group
> 3+ nodes that participate in one flow. Communities are clusters of related nodes.

---

## Build status (updated at the end of every phase Ã¢â‚¬â€ see `docs/build/`)

> Per `AGENTS.md` Rule 8, the agent updates this table and tags implemented nodes `BUILT`
> (path) when a phase's Done-when passes. A phase is not complete until this reflects reality.

| Phase | Scope | Status | Notes |
|-------|-------|--------|-------|
| 0 | Decision freeze (gates 1-10) | built | Gates 1-10 resolved in docs; see Phase 0 commits on this branch. |
| 1 | Shared types (B0) | built | `types/pairing.ts`, `types/session.ts`, `types/scoring.ts`, `types/eval.ts` verified with `npx tsc --noEmit`. |
| 2 | Schema D1-D18 | built with verification gap | `prisma/schema.prisma` + `prisma/migrations/20260627204346_add_pairing_v1_schema/migration.sql`; validated with `prisma validate` and `prisma generate`, but not applied to a disposable DB in this environment. |
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
  (implement as written, may refine), `OPEN` (must be confirmed before coding Ã¯Â¿Â½ see
  `docs/07-open-questions.md`).
- **Edge relations:** `governs`, `produces`, `feeds`, `validated_by`, `persists_to`,
  `calls`, `falls_back_to`, `restricted_to`, `transitions_to`, `optimizes`, `part_of`.

---

## Communities (clusters)

| # | Community | Owning docs | Core nodes |
|---|-----------|-------------|-----------|
| C1 | Product intent & access control | 01, 02 | N1, N2, N3, R1Ã¯Â¿Â½R4 |
| C2 | Lifecycle & state machine | 02, 04, 06 | S1Ã¯Â¿Â½S8, F1 |
| C3 | Engine pipeline | 04, 15 | E1Ã¯Â¿Â½E9 |
| C4 | Metrics taxonomy | 05, 08 | M1Ã¯Â¿Â½M18 |
| C5 | Formulas | 09, 05 | Fo1Ã¯Â¿Â½Fo10 |
| C6 | Learning & tuning loop | 13, 05 | L1Ã¯Â¿Â½L5 |
| C7 | Data model | 03, 12, 08 | D1Ã¯Â¿Â½D18 |
| C8 | API surface | 14, 11, 17 | A1Ã¢â‚¬â€œA17 |
| C9 | Backend module map | 11, 17 | B1Ã¢â‚¬â€œB12, B-rt |
| C10 | Eval harness | 10, 13 | V1Ã¯Â¿Â½V5 |
| C11 | Engineering quality standard | 15, 17 | Q1Ã¯Â¿Â½Q18 |

---

## C1 Ã¢â‚¬â€ Product intent & access control  Ã‚Â·  governs: `01`, `02`

- **[N1] Pairing system** Ã‚Â· concept Ã‚Â· `01` Ã¢â‚¬â€ Central coordination layer for attendance Ã¢â€ â€™
  role assignment Ã¢â€ â€™ generation Ã¢â€ â€™ review Ã¢â€ â€™ publication Ã¢â€ â€™ scoring Ã¢â€ â€™ leaderboards Ã¢â€ â€™ learning.
  *Rationale: treated as a platform-level redesign, not an isolated feature.*
- **[N2] Adaptive probabilistic engine** Ã‚Â· concept Ã‚Â· `01`,`05` Ã¢â‚¬â€ Rule-driven, metric-aware,
  history-aware, admin-reviewed, probabilistic, progressively improvable. Generates strong
  *proposals*, not unchecked output.
- **[N3] Review-first publication** Ã‚Â· concept Ã‚Â· `01`,`02` Ã¢â‚¬â€ A proposal is NEVER public on
  generation; an admin must approve/override/regenerate before it becomes official.
- **[Rl-cabinet] cabinet** Ã‚Â· role Ã‚Â· `01`,`14` Ã¢â‚¬â€ May control the full pairing lifecycle.
- **[Rl-president] President** Ã‚Â· role Ã‚Â· `01`,`14` Ã¢â‚¬â€ May control the full pairing lifecycle.
- **[Rl-member] Member** Ã‚Â· role Ã‚Â· `01`,`14` Ã¢â‚¬â€ May NOT control lifecycle; MAY read the
  published pairing after publication.
- **[Rl-techhead] TechHead** Ã‚Â· role Ã‚Â· `14` Ã¢â‚¬â€ Admin/internal; eval routes.
  *(Code note: existing `DebsocRole = TechHead | President | cabinet | Member`,
  `lib/server/roles.ts`. Eval doc's "techhead admin" maps to `TechHead`.)*
- **[R1] Lifecycle-control = cabinet+president only** Ã‚Â· rule Ã‚Â· `01`,`02`,`14` Ã¢â‚¬â€ generate,
  review, approve, override, regenerate, rate, publish, attendance prep, session update.
- **[R2] Published read = member+cabinet+president** Ã‚Â· rule Ã‚Â· `01`,`02`,`14` Ã¢â‚¬â€ after publish.
- **[R3] Two access paths** Ã‚Â· rule Ã‚Â· `02` Ã¢â‚¬â€ restricted write/control routes vs. published
  read route. Generation access and published visibility are intentionally different.
- **[R4] Session-role authorization** Ã‚Â· rule Ã‚Â· `08`,`14`,`15` Ã¢â‚¬â€ post-session routing and
  scoring-form access are driven by a user's **role in that session**, never permanent role.
- **[R5] Scoring oversight access** Ã‚Â· rule Ã‚Â· `14 Ã‚Â§scoring-status/Auth`,`15 Ã‚Â§16` Ã¢â‚¬â€ scoring
  completion tracking (who hasn't filled their role's form) is read-only oversight for cabinet,
  president, and TechHead; completion + identity only, never submission content; nudge/close
  actions = cabinet+president only. *Completion Ã¢â€°Â  content.*
- **[R6] Member-progress access** Ã‚Â· rule Ã‚Â· `14 Ã‚Â§7`,`15 Ã‚Â§16` Ã¢â‚¬â€ per-person progress analytics readable
  by cabinet+president for ANY participant; a member sees only their own. Analytics surface (Ã¢â€°Â 
  leaderboard ranking). **Dependency:** requires participant metrics to cover cabinet accounts, not
  only `Member` (see Gate 11 below).

Edges:
- N1 --part_of--> N2, N3
- R1 --restricted_to--> Rl-cabinet, Rl-president
- R2 --restricted_to--> Rl-member, Rl-cabinet, Rl-president
- N3 --governs--> S3 (proposal approved) Ã¢â‚¬â€ see C2

---

## C2 Ã¢â‚¬â€ Lifecycle & state machine  Ã‚Â·  governs: `02`, `04`, `06`, `15 Ã‚Â§9`

- **[S1] Session preparation** Ã‚Â· state Ã¢â‚¬â€ attendance marked, roles assigned, session inputs set.
- **[S2] Proposal generated** Ã‚Â· state Ã¢â‚¬â€ engine produced a proposal; not public.
- **[S3] Proposal approved** Ã‚Â· state Ã¢â‚¬â€ admin approved; eligible for publish.
- **[S3b] Proposal overridden** Ã‚Â· state Ã¢â‚¬â€ admin manually changed; original preserved (Q11).
- **[S4] Proposal published** Ã‚Â· state Ã¢â‚¬â€ official pairing exists; attendance finalized.
- **[S5] Session active** Ã‚Â· state.
- **[S6] Session completed** Ã‚Â· state Ã¢â‚¬â€ scoring window open.
- **[S7] Scoring completed** Ã‚Â· state.
- **[S8] Tuning window** Ã‚Â· state Ã¢â‚¬â€ batch of 6Ã¢â‚¬â€œ7 sessions reviewed.
- **[F1] End-to-end lifecycle** Ã‚Â· flow Ã‚Â· `02`,`04` Ã¢â‚¬â€
  prepare Ã¢â€ â€™ generate Ã¢â€ â€™ review/rate Ã¢â€ â€™ publish Ã¢â€ â€™ run Ã¢â€ â€™ score Ã¢â€ â€™ update history Ã¢â€ â€™ tune.

Edges / transitions (each transition MUST be guarded Ã¢â‚¬â€ `15 Ã‚Â§9`):
- S1 --transitions_to--> S2 (only cabinet/president)
- S2 --transitions_to--> S3 / S3b
- S3 --transitions_to--> S4 (**publish forbidden before approval**)
- S4 --transitions_to--> S5 --transitions_to--> S6
- S6 --transitions_to--> S7 (speaker/chair scoring; **blocked before publish+completion**)
- S7 --feeds--> S8
- **Invariant:** exactly one official published proposal per session (`15 Ã‚Â§13`).

Hyperedge **HE1 (lifecycle)**: {S1,S2,S3,S4,S5,S6,S7} form_one state machine governed by N3.

---

## C3 Ã¢â‚¬â€ Engine pipeline  Ã‚Â·  governs: `04`, `15 Ã‚Â§3Ã¢â‚¬â€œÃ‚Â§5`

- **[E1] Session preparation input** Ã‚Â· flow Ã‚Â· `04` Ã¢â‚¬â€ present participants + session-role split.
- **[E2] Session-only inputs** Ã‚Â· concept Ã‚Â· `04`,`05` Ã¢â‚¬â€ motion type, motion, time_constraint,
  event_team_up_preference, pairing_objective. Affect the current cycle ONLY (not learned).
- **[E3] Data loading (once)** Ã‚Â· flow Ã‚Â· `04`,`15 Ã‚Â§6` Ã¢â‚¬â€ load history + DB metrics in a small,
  deliberate number of reads; front-load all DB cost. No queries inside candidate loops.
- **[E4] Pool construction** Ã‚Â· flow Ã‚Â· `04` Ã¢â‚¬â€ speaker pool, adjudicator pool, chair pool.
- **[E5] Feasibility & validity checks** Ã‚Â· rule Ã‚Â· `04`,`05` Ã¢â‚¬â€ enough speakers/adjudicators,
  no duplicate roles, strict session rules satisfiable. Fail explicitly if infeasible.
- **[E6] Room-count determination** Ã‚Â· formula Ã‚Â· `04`,`09` Ã¢â‚¬â€ `room_count = floor(speakers/8)`;
  leftovers marked `UNASSIGNED`, never silently dropped.
- **[E7] Candidate generation (bounded)** Ã‚Â· flow Ã‚Â· `04`,`15 Ã‚Â§4` Ã¢â‚¬â€ build many valid
  arrangements; bounded search with pruning + hard-rule filtering early; explicit max-candidate
  and time-budget guardrails from V1.
- **[E8] Candidate scoring (deterministic)** Ã‚Â· flow Ã‚Â· `04`,`05`,`09` Ã¢â‚¬â€ score each valid
  candidate; deterministic for fixed candidate+context; reuse cached metric maps.
- **[E9] Top-band probabilistic selection** Ã‚Â· formula Ã‚Â· `04`,`05`,`09` Ã¢â‚¬â€ keep top 5, convert
  to weighted probabilities, pick one. Randomness affects ONLY selection, never validity.

Edges:
- E1 --feeds--> E3; E2 --feeds--> E3; E3 --feeds--> E4 --feeds--> E5
- E5 --validated_by--> R-hard (C4); E6 --feeds--> E7 --produces--> candidates
- E7 --feeds--> E8 --feeds--> E9 --produces--> D4 (PairingProposal)
- Pipeline string (`04 Ã‚Â§18`): `prepared participants -> session inputs -> historical data
  -> metric activation -> candidate generation -> scoring -> top-band probabilistic selection
  -> proposal -> admin review -> publish -> post-session learning -> periodic tuning`

Hyperedge **HE2 (engine stages, `15 Ã‚Â§3`)**: {E3,E4,E5,E7,E8,E9} participate_in one bounded
search-and-score request that ends in one persisted proposal with score explanation.

---

## C4 Ã¢â‚¬â€ Metrics taxonomy  Ã‚Â·  governs: `05`, `08 Ã‚Â§1`

Four layers (`05`): **hard rules**, **session-only inputs**, **learned metrics**,
**soft optimization metrics**.

### Learned DB metrics (with base-weight zones & fallbacks)
- **[M1] speaker_total_score** Ã‚Â· 0.20Ã¢â‚¬â€œ0.24 Ã‚Â· broad, no fallback. **CUMULATIVE SUM** of raw speaker
  scores across sessions (NOT averaged) = additive speaker leaderboard value; rewards attendance,
  so non-attendees can't rank high on an average (`09 Ã‚Â§16b`). Ability-for-balance = M3 speaker_strength.
- **[M2] speaker_motion_type_score** Ã‚Â· 0.16Ã¢â‚¬â€œ0.20 Ã‚Â· falls_back_to M1.
- **[M3] speaker_strength** Ã‚Â· 0.10Ã¢â‚¬â€œ0.14 Ã‚Â· falls_back_to M1; formula Fo4. Built on cumulative M1 +
  consistency + confidence Ã¢â€ â€™ **intentionally attendance/data-sensitive**: irregular/low-data members
  get a lower, less-trusted strength (less practice = weaker; thin data = low confidence). NOT
  attendance-neutral (`05` Regularity/Data Sensitivity, `09 Ã‚Â§4`).
- **[M4] partner_dynamics_overall** Ã‚Â· 0.10Ã¢â‚¬â€œ0.14 Ã‚Â· BP result points 3/2/1/0 (primary); optional
  secondary input from D19 TeamDynamicsRating; no fallback.
- **[M5] partner_dynamics_by_motion_type** Ã‚Â· 0.08Ã¢â‚¬â€œ0.12 Ã‚Â· falls_back_to M4.
- **[M6] repeat_partner_penalty** Ã‚Â· Ã¢Ë†â€™0.06Ã¢â‚¬Â¦Ã¢Ë†â€™0.10 Ã‚Â· soft penalty.
- **[M7] bp_position_history** Ã‚Â· 0.06Ã¢â‚¬â€œ0.09 Ã‚Â· tracks OG/OO/CG/CO; diversity.
- **[M8] internal_speaking_role_history** Ã‚Â· 0.06Ã¢â‚¬â€œ0.10 Ã‚Â· tracks PM/DPM/LO/DLO/MG/GW/MO/OW.
- **[M9] role_score** Ã‚Â· falls_back_to M1 Ã‚Â· per exact speaking role.
- **[M10] motion_type_x_role_score** Ã‚Â· falls_back_to M9Ã¢â€ â€™M2Ã¢â€ â€™M1 Ã‚Â· most specific; trust slowly.
- **[M11] academic_year** Ã‚Â· 0.04Ã¢â‚¬â€œ0.07 Ã‚Â· experience balance input.
- **[M12] adjudicator_average_score** Ã‚Â· 0.16Ã¢â‚¬â€œ0.22 Ã‚Â· chair scores each adj individually (1/session);
  **mean across sessions** = leaderboard rank (average ONLY, not cumulative, not count-boosted) so a
  member can be both speaker & adjudicator without penalty; counts (#adjudicated/#chaired) shown as
  context only (`09 Ã‚Â§16b`).
- **[M13] chair_score** Ã‚Â· 0.16Ã¢â‚¬â€œ0.22 Ã‚Â· falls_back_to M12. (Renamed from "CAP score".) **Derived
  average** of speakerÃ¢â€ â€™chair ratings: two-stage mean (within session, then across sessions),
  confidence by sessions chaired (target 4). Many `ChairFeedbackRecord` rows in Ã¢â€ â€™ one averaged
  score out Ã¢â€ â€™ leaderboard-stable. (Within-session multi-rater averaging applies to M13 ONLY; M12 =
  across-session mean+counts, M1 = cumulative sum Ã¢â‚¬â€ `09 Ã‚Â§16b`.)
- **[M18] room_balance_score** Ã‚Â· 0.35Ã¢â‚¬â€œ0.45 Ã‚Â· proposal-level; formula Fo5; only when rooms>1.

### Session-only inputs (`05`; stored with the generation request, never learned)
- **[M14] time_constraint** Ã‚Â· strict OR high-priority soft (early speaking role if leaving early).
- **[M15] event_team_up_preference** Ã‚Â· strict OR very-high soft (keep A+B same team).
- **[M16] motion_type** Ã‚Â· activates M2, M5.
- **[M17] motion** Ã‚Â· recordkeeping/analytics.
- **[Obj] pairing_objective** Ã‚Â· enum `DEVELOPMENT | BALANCED | COMPETITIVE` Ã‚Â· drives multipliers Fo9.

### Hard rules (`05`; violation Ã¢â€¡â€™ invalid proposal)
- **[R-hard] Core validity** Ã‚Â· rule Ã¢â‚¬â€ only present participants; each marked speaker|adjudicator;
  no double assignment; each room = exactly 8 speakers, 4 teams, 2 speakers/team; benches
  OG/OO/CG/CO; Ã¢â€°Â¥1 adjudicator/room; exactly 1 chair/room; no publish without approval.
  *(Panel size beyond the 1 required adjudicator is NOT hard Ã¢â‚¬â€ it is the soft, overridable panel
  distribution in B9/Fo6b.)*
- **[R-hard-strict] Session strict rules** Ã‚Â· forced team-up, forced separation, strict
  time-constraint, forced chair, forced role, forced room-count override.

Edges:
- M2 --falls_back_to--> M1; M5 --falls_back_to--> M4; M10 --falls_back_to--> M9
  --falls_back_to--> M1; M13 --falls_back_to--> M12; M3 --falls_back_to--> M1
- M16 --feeds--> M2, M5; Obj --governs--> Fo9
- All Mx --feeds--> E8 (scoring); R-hard --validated_by--> B5 (hard-rules.ts)
- **Catalog gate (`08 Ã‚Â§1`):** the V1 metric catalog = M1Ã¢â‚¬â€œM13, M18, M11 (confirm before coding).

---

## C5 Ã¢â‚¬â€ Formulas  Ã‚Â·  governs: `09` (status legend authoritative)

- **[Fo1] effective_weight = base_weight + learned_adjustment** Ã‚Â· LOCKED Ã‚Â· `|adj| Ã¢â€°Â¤ 0.03`.
- **[Fo2] confidence = min(observation_count / target_count, 1.0)** Ã‚Â· LOCKED.
- **[Fo3] effective_metric = confidenceÃ‚Â·specific + (1Ã¢Ë†â€™confidence)Ã‚Â·fallback** Ã‚Â· LOCKED.
- **[Fo4] speaker_strength = 0.70Ã‚Â·norm_total + 0.20Ã‚Â·consistency + 0.10Ã‚Â·confidence** Ã‚Â· PROPOSED-V1.
- **[Fo5] room_balance_score = 1.0 Ã¢Ë†â€™ (0.75Ã‚Â·norm_strength_var + 0.25Ã‚Â·norm_experience_var)**;
  `=1.0` if one room Ã‚Â· PROPOSED-V1.
- **[Fo6] chair_assignment_score = 0.60Ã‚Â·chair_score + 0.25Ã‚Â·adj_avg + 0.15Ã‚Â·chair_confidence** Ã‚Â· LOCKED.
- **[Fo6b] adjudicator panel distribution** Ã‚Â· PROPOSED-V1 Ã‚Â· `surplus = total_adj Ã¢Ë†â€™ room_count`;
  hardest-first round-robin; cap `MAX_ADJUDICATORS_PER_ROOM = 3`; overflow Ã¢â€ â€™ RESERVE. Soft/overridable (`09 Ã‚Â§6b`).
- **[Fo7] room_count = floor(speakers/8); leftovers = speakers % 8** Ã‚Â· LOCKED.
- **[Fo8] top-band: top 5, weighted random; pattern 0.30/0.24/0.18/0.15/0.13** Ã‚Â· LOCKED (size & shape OPEN to refine, `07 Ã‚Â§4`).
- **[Fo9] objective_adjusted_weight = effective_weight Ã‚Â· objective_multiplier** Ã‚Â· LOCKED.
- **[Fo10] OPEN formulas** Ã‚Â· `09 Ã‚Â§10Ã¢â‚¬â€œÃ‚Â§17` Ã¢â‚¬â€ `team_quality_aggregate`, full `proposal_score`,
  `consistency_score`, `experience_index`, pair-dynamics aggregation, `role_score`
  aggregation, tuning-adjustment. **These are `OPEN`/`STILL OPEN`: must be confirmed with the
  user before the scoring engine is coded.**

Confidence target counts (`05`; OPEN per `07 Ã‚Â§3`): motion-type speaker 5 Ã‚Â· pair-by-motion 4 Ã‚Â·
role 5 Ã‚Â· motionÃƒâ€”role 5 Ã‚Â· chair 4.

Edges:
- Fo1 --governs--> all metric weights; Fo2 --feeds--> Fo3; Fo3 --governs--> M2,M5,M9,M10,M13
- Fo4 --produces--> M3; Fo5 --produces--> M18; Fo6 --governs--> chair assignment (B9)
- Fo8 --governs--> E9; Fo9 --governs--> Obj
- **Freeze gate (`09 Ã‚Â§18`):** Fo1Ã¢â‚¬â€œFo3, Fo4, Fo5, Fo6, Fo7, Fo8 ready for V1; Fo10 NOT ready.

---

## C6 Ã¢â‚¬â€ Learning & tuning loop  Ã‚Â·  governs: `13`, `05`

- **[L1] Per-session learning** Ã‚Â· flow Ã‚Â· `13` Ã¢â‚¬â€ after each session update speaker-side (M1Ã¢â‚¬â€œM3,
  M9, M10, M7, M8), pairing-side (M4, M5, M6), adjudication-side (M12, M13, counts).
- **[L2] Confidence growth** Ã‚Â· concept Ã‚Â· `13`,`05` Ã¢â‚¬â€ more observations Ã¢â€¡â€™ specific metrics gain
  influence, fallback reliance drops (via Fo2/Fo3).
- **[L3] Proposal-quality signal** Ã‚Â· concept Ã‚Â· `13`,`05` Ã¢â‚¬â€ admin rating + issue tags capture
  whether a proposal *looked* sensible, separate from noisy debate outcomes.
- **[L4] Batch tuning (6Ã¢â‚¬â€œ7 sessions)** Ã‚Â· flow Ã‚Â· `13`,`05` Ã¢â‚¬â€ compare proposal score vs. admin
  rating vs. outcomes; suggest bounded `learned_adjustment` changes (`|ÃŽâ€| Ã¢â€°Â¤ 0.03`); auditable.
- **[L5] Three preserved layers** Ã‚Â· standard Ã‚Â· `13 Ã‚Â§recommended`,`15` Ã¢â‚¬â€ (1) runtime generation,
  (2) post-session metric update, (3) periodic tuning+eval. MUST stay separate modules.

Edges:
- S7 --feeds--> L1 --feeds--> L2; L3 --feeds--> L4; L4 --produces--> D16 (PairingMetricAdjustment)
- L4 --validated_by--> C10 (eval harness); L5 --governs--> B-layering (C9)

Hyperedge **HE3 (safe-learning rules, `13 Ã‚Â§safe`)**: never break hard rules Ã‚Â· never auto-publish Ã‚Â·
never trust specific metrics too early Ã‚Â· never tune from one session Ã‚Â· never large auto jumps Ã‚Â·
always auditable Ã‚Â· always eval against baseline.

---

## C7 Ã¢â‚¬â€ Data model  Ã‚Â·  governs: `12` (naming authoritative), `03`, `08 Ã‚Â§5`

> Prisma direction (`12`): singular PascalCase models; explicit relation names where a model
> connects twice; avoid vague names. Existing models to CHANGE: `Attendance`, `DebateSession`,
> `Member`, `cabinet` (`prisma/schema.prisma`). **Do not break existing fields/migrations.**

### Minimal V1 model set (`12 Ã‚Â§Minimal V1`) Ã¢â‚¬â€ build these first
- **[D1] DebateSession** (extend) Ã¢â‚¬â€ date, motionType, motionText, pairingObjective, status,
  pairingStatus, publicationStatus, scoringStatus, acceptedProposalId, publishedProposalId, publishedAt.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D2] AttendanceRecord** (extend `Attendance`) Ã¢â‚¬â€ isPresent, isFinalized, wasAssigned,
  wasUnassigned, unassignedReason.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D3] SessionRoleAssignment** Ã¢â‚¬â€ sessionId, memberId, role, isChair, roleAssignedAt.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
  *Critical: session role Ã¢â€°Â  permanent account role (R4).*
- **[D4] PairingProposal** Ã¢â‚¬â€ version, status, engineVersion, ruleVersion, topBandRank,
  proposalScore, scoreBreakdownJson, generatedAt/By, approvedAt, publishedAt, isPublishedOfficially.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D5] DebateRoomAssignment** Ã¢â‚¬â€ roomIndex, roomScore, roomBalanceScore, roomDifficultyScore.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D6] DebateTeamAssignment** Ã¢â‚¬â€ bpPosition (OG/OO/CG/CO), teamScore.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D7] TeamSpeakerAssignment** Ã¢â‚¬â€ memberId, speakingRole (PMÃ¢â‚¬Â¦OW), speakerOrder.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D8] RoomAdjudicatorAssignment** Ã¢â‚¬â€ memberId, isChair, chairAssignmentScore.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D9] UnassignedParticipant** Ã¢â‚¬â€ proposalId, memberId, reason.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D10] ProposalReviewLog** Ã¢â‚¬â€ reviewerId, action, notes, createdAt.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D11] ProposalRating** Ã¢â‚¬â€ reviewerId, rating, issueTagsJson, notes.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D12] SpeakerScoreRecord** Ã¢â‚¬â€ bpPosition, speakingRole, rawScore, teamResultPoints,
  `scoredByMemberId` (the **chair** enters speaker scores Ã¢â‚¬â€ Gate 4).
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D13] ChairFeedbackRecord** Ã¢â‚¬â€ speakerMemberId, chairMemberId, `rating` (speakerÃ¢â€ â€™chair 0Ã¢â‚¬â€œ10),
  notes. (Team-dynamics rating is NOT here Ã¢â‚¬â€ see D19.)
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D14] AdjudicatorScoreRecord** Ã¢â‚¬â€ chairMemberId, adjudicatorMemberId, rating, notes.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D15] PairingMetricDefinition** Ã¢â‚¬â€ key, category, baseWeight, isEnabled, isHardRule,
  isSoftRule, scope, fallbackConfigJson.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D16] PairingMetricAdjustment** Ã¢â‚¬â€ currentAdjustment, lastUpdatedAt, sourceWindowId.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D17] MemberMetricSnapshot** Ã¢â‚¬â€ metricKey, contextKey, value, observationCount, confidence.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D18] PairMetricSnapshot** Ã¢â‚¬â€ memberAId, memberBId, metricKey, contextKey, value, obs, confidence.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).
- **[D19] TeamDynamicsRating** Ã¢â‚¬â€ sessionId, raterMemberId, teammateMemberId, rating 0Ã¢â‚¬â€œ10. The
  speaker form's optional team-dynamics rating, stored WITH the pair-dynamics data (not on D13);
  **secondary** input to partner_dynamics (M4/M5), which stays results-based.
  BUILT (`prisma/schema.prisma`, migration `20260627204346_add_pairing_v1_schema`).

### Deferrable (`12 Ã‚Â§later`)
LeaderboardSnapshot, MetricAdjustmentHistory, EvalScenario, EvalRun, EvalScenarioResult,
TuningReviewWindow.

### Logical read model (not a table in V1)
- **[D-PV] PublishedPairingView** Ã¢â‚¬â€ assembled from D1+D4+D5+D6+D7+D8; the official member-visible read.

Edges (relationship map, `12`):
- D1 --has_many--> D2, D3, D4, D12, D13, D14
- D4 --has_many--> D5, D9, D10; --has_one?--> D11
- D5 --has_many--> D6, D8; D6 --has_many--> D7
- D15 --has_one--> D16; Member --has_many--> D17, D18
- E9 --persists_to--> D4; publish --persists_to--> D1.publishedProposalId (one source of truth)

---

## C8 Ã¢â‚¬â€ API surface  Ã‚Â·  governs: `14` (route contracts authoritative), `11`, `17`

Route groups: attendance, sessions, pairing, scoring, leaderboard, progress, realtime, eval. All routes thin;
logic in `lib/server/...`; access explicit. **V1 priority order = the list below.**

- **[A1] POST /api/attendance/prepare** Ã‚Â· cabinet,president Ã¢â€ â€™ `prepareAttendance()`.
- **[A2] POST /api/attendance/mark** Ã‚Â· cabinet,president Ã¢â€ â€™ `markAttendance()`.
- **[A3] GET /api/sessions/:id** Ã‚Â· cabinet,president Ã¢â€ â€™ `getSessionPreparationContext()`.
- **[A3b] PATCH /api/sessions/:id** Ã‚Â· cabinet,president Ã¢â€ â€™ session update (motionType/Text/objective).
- **[A3c] GET /api/sessions/:id/scoring-status** Ã‚Â· oversight read = cabinet+president+TechHead; participants see their own task status only.
- **[A4] POST /api/pairing/generate** Ã‚Â· cabinet,president ONLY Ã¢â€ â€™ `generatePairingProposal()`.
- **[A5] GET /api/pairing/proposal/:id** Ã‚Â· cabinet,president Ã¢â€ â€™ repository fetch.
- **[A6] POST Ã¢â‚¬Â¦/proposal/:id/approve** Ã‚Â· Ã¢â€ â€™ `approveProposal()`.
- **[A7] POST Ã¢â‚¬Â¦/proposal/:id/override** Ã‚Â· Ã¢â€ â€™ `overrideProposal()`.
- **[A8] POST Ã¢â‚¬Â¦/proposal/:id/regenerate** Ã‚Â· Ã¢â€ â€™ `regenerateProposal()`.
- **[A9] POST Ã¢â‚¬Â¦/proposal/:id/rate** Ã‚Â· Ã¢â€ â€™ `rateProposal()`.
- **[A10] POST /api/pairing/publish/:sessionId** Ã‚Â· Ã¢â€ â€™ `publishApprovedProposal()`.
- **[A11] GET /api/pairing/published/:sessionId** Ã‚Â· member,cabinet,president Ã¢â€ â€™ `getPublishedPairing()`.
- **[A12] POST /api/scoring/speaker** Ã‚Â· session speakers only Ã¢â€ â€™ `submitSpeakerChairRating()`; speakers do NOT enter raw speaker score.
- **[A13] POST /api/scoring/chair** Ã‚Â· session chairs only Ã¢â€ â€™ `submitChairAdjudicatorScore()` + `submitRoomSpeakerScores()`.
- **[A13b] GET /api/leaderboard/speakers Ã‚Â· /adjudicators** Ã‚Â· authenticated.
- **[A14] POST /api/eval/replay Ã‚Â· /eval/compare** Ã‚Â· TechHead,president.
- **[A15] GET /api/progress/members** Ã‚Â· cabinet+president Ã‚Â· OPTIONAL batch summary for the existing roster.
- **[A16] GET /api/progress/members/:participantId** Ã‚Â· cabinet+president or participant self-only Ã‚Â· returns raw metrics plus a synthesized verdict.
- **[A17] GET /api/realtime/socket** Ã‚Â· authenticated pairing-system roles Ã¢â€ â€™ websocket connection + filtered subscriptions.

Edges:
- A4 --validated_by--> B-val-pairing; A4 --calls--> B1 (engine.ts)
- A6Ã¢â‚¬â€œA9 --calls--> B10 (review.ts); A10,A11 --calls--> B11 (publish.ts)
- A11 --reads--> D-PV (official source only); A12/A13 --validated_by--> R4 (session role)
- A15,A16 --calls--> B-progress
- A17 --calls--> B-rt; A17 --restricted_to--> Rl-member, Rl-cabinet, Rl-president, Rl-techhead

---

## C9 Ã¢â‚¬â€ Backend module map  Ã‚Â·  governs: `11`, `17` (folder/file/export map authoritative)

Principle (`11`,`15 Ã‚Â§2`): `app/api/*` = transport only (parse, guard, call ONE service, format);
`lib/server/*` = domain logic; Prisma only in repositories; shared contracts in `types/`.

- **[B0] types/{pairing,session,scoring,eval}.ts** - shared contracts. BUILT (`types/pairing.ts`, `types/session.ts`, `types/scoring.ts`, `types/eval.ts`). Phase 1 assumptions: `MotionType` remains `string` because the docs do not freeze a closed value set; score payload values are numeric while `ScoreSubmissionType` remains a controlled domain label type.
- **[B1] lib/server/pairing/engine.ts** Ã‚Â· `generatePairingProposal()` orchestrator (the 9 stages).
- **[B2] candidate-generator.ts** Ã‚Â· `generateCandidateProposals()`.
- **[B3] proposal-scorer.ts** Ã‚Â· `scoreProposal()`, `scoreTeam()`.
- **[B4] proposal-selector.ts** Ã‚Â· `selectProposalFromTopBand()` (Fo8).
- **[B5] hard-rules.ts** Ã‚Â· `validateHardRules()`, `isCandidateValid()` (R-hard).
- **[B6] fallback.ts** Ã‚Â· `computeConfidence()`, `blendSpecificWithFallback()` (Fo2,Fo3).
- **[B7] objectives.ts** Ã‚Â· `getObjectiveMultipliers()`, `applyObjectiveMultiplier()` (Fo9).
- **[B8] leftovers.ts** Ã‚Â· `computeRoomPlan()`, `buildUnassignedParticipants()` (Fo7).
- **[B9] chair-assignment.ts** Ã‚Â· `computeChairAssignmentScore()`, `assignChairsToRooms()`, and adjudicator panel distribution.
- **[B-ml] metrics-loader.ts** Ã‚Â· `loadPairingMetrics()`, `loadSessionInputs()`.
- **[B10] review.ts** Ã‚Â· approve/override/regenerate/rate.
- **[B11] publish.ts** Ã‚Â· `publishApprovedProposal()`, `getPublishedPairing()`.
- **[B-tune] tuning.ts** Ã‚Â· `buildTuningReview()`, `suggestMetricAdjustments()` (L4).
- **[B-sess] sessions/{session,attendance,session-role}-service.ts**.
- **[B-score] scoring/{speaker,chair,leaderboard,metric-update}-service.ts** (L1).
- **[B-progress] scoring/member-progress-service.ts** Ã‚Â· reads metric snapshots + raw records and produces the per-participant verdict.
- **[B-rt] realtime/{websocket-hub,event-publisher,channel-auth,types}.ts** + `types/realtime.ts` Ã‚Â· authenticated websocket delivery + post-commit event fan-out.
- **[B-eval] eval/{harness,replay-runner,regression-checker,report-builder,synthetic-scenarios}.ts**.
- **[B-repo] repositories/{pairing,session,scoring,metrics,eval}-repository.ts** Ã‚Â· all Prisma here.
- **[B-val] validations/{pairing,scoring,session}-validation.ts** Ã‚Â· zod (project uses zod v4).

Anti-patterns (`11 Ã‚Â§What Should Not Happen`, forbidden): formulas in routes; one giant service;
eval mixed into runtime; attendance-prep mixed with scoring; Prisma spread without repositories.

Implementation order (`11 Ã‚Â§Recommended`): types Ã¢â€ â€™ repositories Ã¢â€ â€™ session/attendance services Ã¢â€ â€™
pairing internal modules Ã¢â€ â€™ review+publish Ã¢â€ â€™ published read Ã¢â€ â€™ scoring Ã¢â€ â€™ progress Ã¢â€ â€™ eval Ã¢â€ â€™ realtime modules Ã¢â€ â€™ wire routes and websocket entrypoint.

---

## C10 Ã¢â‚¬â€ Eval harness  Ã‚Â·  governs: `10`, `13 Ã‚Â§why eval`

- **[V1] Eval harness** Ã‚Â· service Ã‚Â· `10`,`11` Ã¢â‚¬â€ replay engine against historical/synthetic
  scenarios; safety net around learning. Not optional.
- **[V2] Replay datasets** Ã‚Â· concept Ã‚Â· `10` Ã¢â‚¬â€ historical + synthetic edge cases.
- **[V3] Scoring dimensions** Ã‚Â· concept Ã‚Â· `10` Ã¢â‚¬â€ validity, room balance, repetition control,
  objective behavior, admin-rating alignment, outcome alignment.
- **[V4] Probabilistic run strategy** Ã‚Â· concept Ã‚Â· `10` Ã¢â‚¬â€ many runs per scenario (count OPEN, `07 Ã‚Â§8`).
- **[V5] Regression check vs. baseline** Ã‚Â· rule Ã‚Â· `10`,`15 Ã‚Â§19` Ã¢â‚¬â€ any change to scores,
  candidate generation, tuning, or fallback MUST pass eval vs. baseline before trust.

Edges: L4 --validated_by--> V5; V5 --gates--> engine/formula changes; V1 --feeds--> rollout (`15 Ã‚Â§19`).

---

## C11 Ã¯Â¿Â½ Engineering quality standard  Ã¯Â¿Â½  governs: `15`, `17` (implementation contract)

Each is a non-negotiable `standard` node; full text in `15`. Treat as the review checklist gate.

- **[Q1] Correctness** Ã¯Â¿Â½ no double assignment, no invalid rooms, no unreviewed publish, no
  published/visible mismatch, no stale-proposal action, no leaderboard from partial scores.
- **[Q2] Layered architecture** Ã¯Â¿Â½ route/service/repository/formula separation (C9).
- **[Q3] Bounded engine** Ã¯Â¿Â½ constrained generation, early invalidation, pruning, explicit
  max-candidate + time-budget + top-band-size guardrails from V1; no combinatorial explosion.
- **[Q4] Front-loaded DB access** Ã¯Â¿Â½ batch-load context; project only needed fields; NO query in
  candidate/scoring loops; N+1 forbidden; index session/proposal/role/pair/score-uniqueness fields.
- **[Q5] Pre-shaped context object** Ã¯Â¿Â½ engine consumes `PairingGenerationContext` (Maps for
  per-member/per-pair lookup), not raw tables.
- **[Q6] TypeScript rigor** Ã¯Â¿Â½ no `any`; explicit service-boundary types; enums/`as const` for
  proposal status, session role, objective, motion type, review action, score type, leftover
  reason, tuning mode; aliased ids (`MemberId`, `SessionId`, `ProposalId`); numeric safety
  (normalize probabilities, clamp, no divide-by-zero, explicit zero-observation fallback).
- **[Q7] State-machine discipline** Ã¯Â¿Â½ explicit validated transitions + stale-write/version guards.
- **[Q8] Concurrency & idempotency** Ã¯Â¿Â½ guard double-generate/double-publish/duplicate-score;
  one official publish wins; optimistic locking / `updatedAt` checks; machine-readable conflicts.
- **[Q9] Auditable randomness** Ã¯Â¿Â½ randomness only in final selection; store engine/rule/metric
  version, candidate score summary, top-band rank, selection probability, seed, objective.
- **[Q10] Override preserves original** Ã¯Â¿Â½ keep original proposal, actor, reason, overridden fields.
- **[Q11] Transactions & one source of truth** Ã¯Â¿Â½ publish/score/tuning/override are transactional;
  one official published proposal per session; full-commit or full-rollback only.
- **[Q12] Config/rule/schema governance** Ã¯Â¿Â½ validate rules before activation; reject contradictory
  configs; migrations preserve replayability + historical readability + version refs.
- **[Q13] Error taxonomy** Ã¯Â¿Â½ distinguish validation/authz/impossible-state/insufficient-
  participants/no-valid-proposal/stale/duplicate/conflict/timeout/config errors; stable shape.
- **[Q14] Observability** Ã¯Â¿Â½ log generation start/end/duration, candidate counts, rejected count,
  top-band size, selected id, publish + score + tuning outcomes, conflicts; latency metrics.
- **[Q15] Test layers** Ã¯Â¿Â½ unit (formulas, guards), service (generate/publish), repository,
  integration (role-based scoring + published visibility), concurrency, eval-replay, migration.
- **[Q16] Realtime post-commit rule** Ã¯Â¿Â½ websocket events are emitted only after authoritative commit; HTTP stays source of truth (`15 Ã¯Â¿Â½24`, `17`).
- **[Q17] Realtime visibility rule** Ã¯Â¿Â½ websocket payloads are role-filtered, session-filtered, and member-safe where required (`15 Ã¯Â¿Â½16`,`15 Ã¯Â¿Â½24`,`17`).
- **[Q18] Realtime recovery rule** Ã¯Â¿Â½ reconnect must recover through authenticated resubscribe + HTTP refetch; websocket failure must not corrupt committed state (`15 Ã¯Â¿Â½24`,`17`).

Cross-cutting edge: **Q-context (`15 Ã¯Â¿Â½21`)** Ã¯Â¿Â½ AI-assisted work MUST reference the *smallest
relevant doc subset* per task, not the whole folder. This graph is the index that enables that.

---

## Master cross-community edges (the "whole idea" in one breath)

```
N1 product
  Ã¢â€â€Ã¢â€â‚¬ N2 adaptive engine Ã¢â€â‚¬Ã¢â€â‚¬ N3 review-first
       Ã¢â€â€š                      Ã¢â€â€š
   C3 engine pipeline     C2 state machine Ã¢â€â‚¬Ã¢â€â‚¬restricted_toÃ¢â€â‚¬Ã¢â€â‚¬ C1 roles (R1/R2/R4)
   (E1..E9)                (S1..S8)
       Ã¢â€â€š scores with           Ã¢â€â€š persists
   C4 metrics (M1..M18) Ã¢â€â‚¬Ã¢â€â‚¬FoÃ¢â€â‚¬Ã¢â€â‚¬> C5 formulas (Fo1..Fo10, Fo10=OPEN)
       Ã¢â€â€š updated by                         Ã¢â€â€š
   C6 learning loop (L1..L5) Ã¢â€â‚¬Ã¢â€â‚¬validated_byÃ¢â€â‚¬Ã¢â€â‚¬> C10 eval (V1..V5)
       Ã¢â€â€š stored in
   C7 data model (D1..D18) --read by--> C8 API (A1..A17) --calls--> C9 modules (B*)
                                   everything bounded by --> C11 quality (Q1..Q18)
```

## Pre-coding gates (must be resolved before the matching phase Ã¢â‚¬â€ `07`, `08`)
1. **Metric catalog accepted** (M1-M13, M18, M11) - RESOLVED. Full V1 catalog accepted; no listed metric deferred at this stage. Blocks C4/C7/C5.
2. **Hard vs soft rule split confirmed** - RESOLVED. Accepted V1 split: R-hard core validity and R-hard-strict forced constraints remain hard; room balance, repeat partner penalty, pair quality, role/motion fit, and surplus panel distribution remain soft. Blocks B5/E5.
3. **Session-role-only routing confirmed (R4)** - RESOLVED. Accepted V1 rule: post-session routing, authorization, and scoring-form assignment are governed by `SessionRoleAssignment`, not permanent account role. Blocks D3/A12/A13.
4. **Post-session form fields confirmed** Ã¢â‚¬â€ RESOLVED (Gate 4): speaker form = chairScore 0Ã¢â‚¬â€œ10 +
   optional teamDynamicsRating 0Ã¢â‚¬â€œ10; chair form = adjudicator scores + chair-entered raw speaker
   scores; non-chair adjudicators submit nothing. See `docs/14 Ã‚Â§4`, `docs/02 Ã‚Â§6`.
5. **Core models accepted (C7)** - RESOLVED. Accepted V1 core model structure from `docs/12-backend-data-model-map.md`; schema drafting remains Phase 2 work and must preserve the participant-reference convention. Blocks schema work.
6. **Room/leftover rules accepted (Fo7)** - RESOLVED. Accepted V1 rule: `room_count = floor(speakers / 8)`, leftovers are `UNASSIGNED`, incomplete BP rooms are not auto-generated, and admin resolves leftovers through adjustment/regeneration. Blocks B8.
7. **Top-band selection accepted (Fo8)** - RESOLVED. Accepted V1 top-band selection: keep top `5` proposals and apply weighted random rank selection `0.30 / 0.24 / 0.18 / 0.15 / 0.13`. Blocks B4.
8. **Tuning governance (auto vs review-assisted)** - RESOLVED. Accepted V1 tuning governance: review-assisted only; no automatic adjustment application in V1. Blocks B-tune.
9. **Access-control + published-view rules accepted (R1/R2)** - RESOLVED. Accepted V1 access rule: only `cabinet` and `President` control lifecycle actions; published pairing visibility is limited to `Member`, `cabinet`, and `President`; the official published proposal is the only published-read source of truth. Blocks guards.
10. **OPEN formulas Fo10 finalized** - RESOLVED. Accepted V1 formulas for `consistency_score`, `experience_index`, `team_quality_aggregate`, `proposal_score`, `partner_dynamics_*`, `role_score`, and review-assisted bounded tuning adjustment are now recorded in `docs/09-metric-formulas.md` and `docs/08-pre-coding-decisions.md`. Blocks B3 (scoring engine).
11. **Participant identity for metrics/progress** Ã¢â‚¬â€ RESOLVED: **Option B**, account-agnostic.
    Pairing covers `Member` + `cabinet` + `President` (TechHead does not debate). Tables stay
    separate; every debater-referencing field is a **participant reference** = (`memberId?`,
    `cabinetId?`, `presidentId?`) with EXACTLY ONE set. Metric reads, leaderboards, and progress
    (A15/A16) must resolve all three keys. See `docs/12` "Participant Reference Convention".
    Constrains Phase 2 schema. (Heads-up: with 3 debating account types, unified-id Option A is
    worth revisiting; staying on B per decision.)
</content>
</invoke>




