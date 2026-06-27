# Phase 8 — Post-Session Scoring & Learning (`B-score`, `L1`)

Speaker/chair submissions, leaderboard derivation, and converting outcomes into learned metrics.

---

## Prompt (paste verbatim)

```
DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md pairing protocol (Rule 6 session-role gating; Rule 5 layering; Rule 7).
2. Read docs/pairing-knowledge-graph.md; locate B-score (C9), L1 (C6), states S6/S7, D12–D14, D17/D18.
3. Read ONLY:
   - docs/16-build-plan.md → Phase 8
   - docs/11-backend-implementation-map.md → Scoring Module File Map
   - docs/02-backend-changes.md → §6 (scoring), §8 (leaderboard)
   - docs/13-pairing-learning-loop.md → "What metrics improve after each session"
   - docs/14-api-routing-map.md → §4 (scoring) for payload shapes
   - docs/15-pairing-engineering-quality-standard.md → §10 (idempotency)
   - earlier-phase types, repositories
4. Confirm gate 4 (post-session form fields) resolved and Phase 7 done. If not, STOP.

TASK — Phase 8. Create only:
- lib/server/scoring/speaker-scoring-service.ts → submitSpeakerScore(input),
  submitSpeakerChairRating(input)
- lib/server/scoring/chair-scoring-service.ts → submitChairAdjudicatorScore(input)
- lib/server/scoring/leaderboard-service.ts → recomputeSpeakerLeaderboard(),
  recomputeAdjudicatorLeaderboard(), recomputeChairDerivedStats()
- lib/server/scoring/metric-update-service.ts → updateLearnedMetricsFromSession(sessionId),
  updatePairHistoryFromSession(sessionId), updateRolePerformanceFromSession(sessionId)

Requirements (docs/15):
- Scoring is gated on SESSION role (the SessionRoleAssignment), not account role.
- Submissions are idempotent: a retry/duplicate must not corrupt aggregates (§10).
- Leaderboards are DERIVED from raw records and recomputable; raw data stays the source of truth.
- Metric updates increase observation counts and confidence (Fo2) for the right snapshots
  (MemberMetricSnapshot, PairMetricSnapshot); do NOT touch base weights here (that is tuning).

Hard rules:
- Use the confirmed field set from gate 4 / docs/14. If a field is unspecified, STOP and ask.
- All DB via repositories. No routes in this phase.

VERIFY: typecheck + tests: session-role gate enforced; duplicate submission idempotent;
leaderboard recompute from raw; snapshot confidence grows. Show results.

CLOSE-OUT (required):
- Update docs/pairing-knowledge-graph.md: mark B-score BUILT, L1 implemented; mark S6/S7 reachable.
- Print "Grounded in:".
```

---

## Done-when
- Four scoring services exist; session-role gated; idempotent; leaderboards derived from raw.
- Metric snapshots + confidence update correctly; tests pass (shown).
- Graph B-score BUILT, L1 marked; `Grounded in:` printed.
</content>
