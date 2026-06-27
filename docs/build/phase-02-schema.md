# Phase 2 — Prisma Schema + Migration (`C7 / D1–D18`)

Extend the schema with the V1 model set. Preserve all existing models, fields, and migrations.

---

## Prompt (paste verbatim)

```
DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md pairing protocol (note Rule 6 "extend never break" and Rule 7 anti-hallucination).
2. Read docs/pairing-knowledge-graph.md; locate community C7 and nodes D1–D18, D-PV.
3. Read ONLY:
   - docs/16-build-plan.md → Phase 2
   - docs/12-backend-data-model-map.md (AUTHORITATIVE for names/fields/relationships, V1 set)
   - docs/03-database-design.md
   - docs/15-pairing-engineering-quality-standard.md → §6 (indexing) and §14 (migration safety)
4. Inspect the existing schema and prior migration BEFORE editing:
   - read prisma/schema.prisma (models DebateSession @@map("Session"), Attendance, Member, cabinet)
   - read prisma/migrations/ (the prior attendance/pairing migration)
5. Confirm gates 1,2,3,4,5 resolved. If not, STOP.

TASK — Phase 2. In prisma/schema.prisma:
- Extend DebateSession (D1) and Attendance (D2) with the fields named in docs/12 — do NOT remove
  or rename existing columns relied on by current code.
- Add SessionRoleAssignment (D3) — session role is DISTINCT from account role.
- Add the V1 model set D4–D19 with the EXACT field names and relations from docs/12:
  PairingProposal, DebateRoomAssignment, DebateTeamAssignment, TeamSpeakerAssignment,
  RoomAdjudicatorAssignment, UnassignedParticipant, ProposalReviewLog, ProposalRating,
  SpeakerScoreRecord, ChairFeedbackRecord, AdjudicatorScoreRecord, PairingMetricDefinition,
  PairingMetricAdjustment, MemberMetricSnapshot, PairMetricSnapshot, TeamDynamicsRating.
  Note SpeakerScoreRecord has scoredByMemberId (chair-entered); TeamDynamicsRating (D19) is the
  speaker form's optional team-dynamics rating and is stored here, NOT on ChairFeedbackRecord.
- Use singular PascalCase model names and explicit relation names where a model joins Member twice
  (ChairFeedbackRecord, AdjudicatorScoreRecord, PairMetricSnapshot, TeamDynamicsRating).
- PARTICIPANT REFERENCE CONVENTION (Gate 11 = Option B, account-agnostic): Member, cabinet, AND
  President all debate (TechHead does not). Every debater-referencing field is
  (memberId?, cabinetId?, presidentId?) with EXACTLY ONE set — extending the existing Attendance
  model. Apply to all participant-carrying models listed in docs/12 "Participant Reference
  Convention"; enforce exactly-one in validation (and a DB check where practical). Do NOT key
  metrics/scores/snapshots to Member only.
- Add @@index on every field flagged in docs/15 §6: session scoping, published-proposal lookup,
  proposal status, member-session-role, pair-metric key, score uniqueness, review timeline.
- Do NOT add deferred models (LeaderboardSnapshot, MetricAdjustmentHistory, Eval*,
  TuningReviewWindow) — those come in Phase 8/9.
- PublishedPairingView (D-PV) is a LOGICAL read model, NOT a table — do not create it as a model.

Hard rules:
- Field/model/enum names come from docs/12 only. If a name is missing, STOP and ask.
- Do not touch app/, components/, types of UI. This is prisma/ only.

VERIFY:
- Generate the migration and apply it against a disposable/dev database; show the output.
- Run prisma generate; confirm generated types align with types/* from Phase 1.
- Confirm existing data/migrations still read (no destructive change). Show evidence.
Do not claim the migration is safe without running it.

CLOSE-OUT (required):
- Update docs/pairing-knowledge-graph.md: mark D1–D18 BUILT with the model names actually used;
  correct any field the build changed; note the migration filename.
- Print "Grounded in:".
```

---

## Done-when
- Migration applies cleanly on a dev DB (shown); `prisma generate` types match `types/*`.
- Existing columns/data/migration history intact; indexes from `15 §6` present.
- Graph nodes D1–D18 marked BUILT; `Grounded in:` printed.
</content>
