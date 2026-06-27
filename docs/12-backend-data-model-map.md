# Backend Data Model Map

## Purpose

This document translates the planning work into a backend data-model reference.

It is the bridge between:

- product and engine planning
- database design direction
- backend implementation structure
- future Prisma schema work

It answers:

- what core entities we need
- what each entity is responsible for
- how entities relate to one another
- which entities support pairing generation
- which entities support post-session scoring
- which entities support review, publication visibility, eval, and tuning

This is not the final Prisma schema file. It is the model map we should agree on before implementing or refactoring the schema.

## Modeling Principles

The pairing engine needs the database to support four types of data:

1. `Operational session data`
2. `Historical performance and pairing data`
3. `Proposal, review, publication, and published-read workflow data`
4. `Evaluation and tuning data`

The model set should reflect those four concerns clearly.

## Participant Reference Convention (Gate 11 — Option B)

Pairing is **position/account agnostic**: `Member`, `cabinet`, AND `President` all get paired and
all accrue metrics. (`TechHead` is the only account that does NOT debate.) So any field that
identifies a debating participant is a **participant reference**, not a plain `memberId`:

```text
participant reference = ( memberId?  cabinetId?  presidentId? )   // EXACTLY ONE is set
```

This extends the existing `Attendance` pattern (already nullable `memberId` + `cabinetId`) to also
cover president. The rule:

- exactly one of `memberId` / `cabinetId` / `presidentId` must be non-null on each participant reference
- enforce it in validation (and a DB check where practical)
- metric reads, leaderboards, and the progress routes (A15/A16) must resolve ALL THREE keys
- being a participant (paired/scored/ranked) is independent of lifecycle-control access: a president
  can both control the pairing lifecycle AND be paired as a debater

Below, wherever a field is described with `...MemberId` (e.g. `memberId`, `speakerMemberId`,
`chairMemberId`, `memberAId`, `raterMemberId`, `scoredByMemberId`), read it as a **participant
reference** following this convention — it may resolve to a member, a cabinet, OR a president. The
names are kept `...MemberId` for readability; the storage is the (memberId?, cabinetId?, presidentId?)
set.

Models that carry participant references: `AttendanceRecord`, `SessionRoleAssignment`,
`TeamSpeakerAssignment`, `RoomAdjudicatorAssignment`, `UnassignedParticipant`, `SpeakerScoreRecord`,
`ChairFeedbackRecord`, `AdjudicatorScoreRecord`, `MemberMetricSnapshot`, `PairMetricSnapshot`,
`TeamDynamicsRating`, `LeaderboardSnapshot`. (Admin-actor fields like `ProposalReviewLog.reviewerId`
follow the same shape since reviewers are cabinet/president.)

## Recommended Core Model Groups

```text
1. Session And Attendance Models
2. Pairing Proposal And Assignment Models
3. Scoring And Leaderboard Source Models
4. Metric And Tuning Models
5. Evaluation Models
```

## 1. Session And Attendance Models

These models define who is participating in a session and what state the session is in.

## `DebateSession`

### Purpose

Parent record for one debate session lifecycle.

### Suggested responsibilities

- session date
- motion type
- motion text
- pairing objective
- pairing state
- publication state
- scoring state
- completion state
- reference to accepted proposal
- reference to published proposal
- room count summary
- attendance summary

### Important fields

- `id`
- `sessionDate`
- `motionType`
- `motionText`
- `pairingObjective`
- `status`
- `pairingStatus`
- `publicationStatus`
- `scoringStatus`
- `acceptedProposalId`
- `publishedProposalId`
- `publishedAt`

### Relationships

- has many `AttendanceRecord`
- has many `PairingProposal`
- has many `SessionRoleAssignment`
- has many `SpeakerScoreRecord`
- has many `ChairFeedbackRecord`
- has many `AdjudicatorScoreRecord`

## `AttendanceRecord`

### Purpose

Stores session attendance and participation eligibility.

### Suggested responsibilities

- whether member is present
- whether member is absent
- whether member was included in pairing
- whether member was left unassigned
- whether final attendance is locked after publish

### Important fields

- `id`
- `sessionId`
- `memberId`
- `isPresent`
- `isFinalized`
- `wasAssigned`
- `wasUnassigned`
- `unassignedReason`

### Relationships

- belongs to `DebateSession`
- belongs to `Member`
- one-to-one or tightly coupled with `SessionRoleAssignment`

## `SessionRoleAssignment`

### Purpose

Stores the role a member has in a specific session.

### Suggested responsibilities

- speaker or adjudicator assignment before generation
- final session role context after publish
- chair flag if the adjudicator becomes chair
- role context for post-session routing

### Important fields

- `id`
- `sessionId`
- `memberId`
- `role`
- `isChair`
- `roleAssignedAt`

### Relationships

- belongs to `DebateSession`
- belongs to `Member`

### Why It Matters

This model is critical because post-session routing depends on session role, not permanent account role.

## 2. Pairing Proposal And Assignment Models

These models store generated proposals, rooms, teams, assignments, review actions, publication state, and published pairing visibility.

## `PairingProposal`

### Purpose

Stores one generated proposal for a session before publication.

### Suggested responsibilities

- generated proposal payload
- proposal score summary
- proposal status
- proposal version within a session
- selected-vs-rejected proposal history
- admin review notes
- whether this proposal became the published official pairing

### Important fields

- `id`
- `sessionId`
- `proposalVersion`
- `status`
- `engineVersion`
- `ruleVersion`
- `topBandRank`
- `proposalScore`
- `scoreBreakdownJson`
- `generatedAt`
- `generatedBy`
- `approvedAt`
- `publishedAt`
- `isPublishedOfficially`

### Relationships

- belongs to `DebateSession`
- has many `DebateRoomAssignment`
- has many `ProposalReviewLog`
- has one optional `ProposalRating`
- has many `UnassignedParticipant`

### Why It Matters

Once published, this proposal becomes the source of truth for the member-visible published pairing endpoint.

## `DebateRoomAssignment`

### Purpose

Stores one room inside a proposal.

### Suggested responsibilities

- room number/index
- room-level score summary
- room-level difficulty summary
- room-level balance summary

### Important fields

- `id`
- `proposalId`
- `roomIndex`
- `roomScore`
- `roomBalanceScore`
- `roomDifficultyScore`

### Relationships

- belongs to `PairingProposal`
- has many `DebateTeamAssignment`
- has many `RoomAdjudicatorAssignment`

## `DebateTeamAssignment`

### Purpose

Stores one team inside a room.

### Suggested responsibilities

- broad BP position assignment
- team-level score summary

### Important fields

- `id`
- `roomAssignmentId`
- `bpPosition`
- `teamScore`

### Relationships

- belongs to `DebateRoomAssignment`
- has many `TeamSpeakerAssignment`

## `TeamSpeakerAssignment`

### Purpose

Stores which speaker occupies which exact role inside a team.

### Suggested responsibilities

- member assignment
- exact speaking role such as `PM`, `DPM`, `LO`, etc.
- broad BP position inheritance through team

### Important fields

- `id`
- `teamAssignmentId`
- `memberId`
- `speakingRole`
- `speakerOrder`

### Relationships

- belongs to `DebateTeamAssignment`
- belongs to `Member`

## `RoomAdjudicatorAssignment`

### Purpose

Stores adjudicators assigned to a room.

### Suggested responsibilities

- adjudicator member assignment
- whether this adjudicator is chair
- chair assignment score snapshot

### Important fields

- `id`
- `roomAssignmentId`
- `memberId`
- `isChair`
- `chairAssignmentScore`

### Relationships

- belongs to `DebateRoomAssignment`
- belongs to `Member`

## `UnassignedParticipant`

### Purpose

Stores leftover participants not included in full valid rooms.

### Suggested responsibilities

- identify leftover speakers
- preserve reason for non-assignment
- keep publication transparent
- support published visibility if leftovers should be shown to admins or members later

### Important fields

- `id`
- `proposalId`
- `memberId`
- `reason`

### Relationships

- belongs to `PairingProposal`
- belongs to `Member`

## `ProposalReviewLog`

### Purpose

Stores review and state-transition history for proposals.

### Suggested responsibilities

- approve action
- override action
- regenerate action
- rejection if kept separately
- note who did what and when

### Important fields

- `id`
- `proposalId`
- `reviewerId`
- `action`
- `notes`
- `createdAt`

### Relationships

- belongs to `PairingProposal`
- belongs to `Member` as reviewer

## `ProposalRating`

### Purpose

Stores admin rating of proposal quality.

### Suggested responsibilities

- numeric score
- issue tags
- optional notes

### Important fields

- `id`
- `proposalId`
- `reviewerId`
- `rating`
- `issueTagsJson`
- `notes`
- `createdAt`

### Relationships

- belongs to `PairingProposal`
- belongs to `Member`

## `PublishedPairingView`

### Purpose

Logical read model for the published pairing endpoint.

### Suggested responsibilities

- expose the official published pairing for member, cabinet, and president visibility
- assemble session metadata plus room/team/adjudicator assignments into one response shape

### Important note

This does not have to be a dedicated Prisma model in V1.
It can be produced from `DebateSession + PairingProposal + DebateRoomAssignment + DebateTeamAssignment + TeamSpeakerAssignment + RoomAdjudicatorAssignment`.

It is included here because the published read rule affects how we think about publication state and official proposal ownership.

## 3. Scoring And Leaderboard Source Models

These models store raw post-session inputs that later update metrics and leaderboards.

## `SpeakerScoreRecord`

### Purpose

Stores speaker score outcome for a member in a session.

### Suggested responsibilities

- raw speaker score
- role context
- BP position context
- motion type context
- team result context

### Important fields

- `id`
- `sessionId`
- `memberId`
- `proposalId`
- `bpPosition`
- `speakingRole`
- `rawScore`
- `teamResultPoints`
- `scoredByMemberId` — the chair who entered this raw speaker score (Gate 4: chair enters speaker
  scores). Kept for audit/authorization.

### Relationships

- belongs to `DebateSession`
- belongs to `Member` (the speaker)
- belongs to `Member` as `scoredBy` (the chair)
- can reference `TeamSpeakerAssignment`

## `ChairFeedbackRecord`

### Purpose

Stores speaker-to-chair rating after the session.

### Suggested responsibilities

- rate assigned chair
- preserve speaker-chosen rating
- provide chair-score source data

### Important fields

- `id`
- `sessionId`
- `proposalId`
- `speakerMemberId`
- `chairMemberId`
- `rating` — speaker-to-chair score, 0–10 (Gate 4). Source for `chair_score`.
- `notes`

Note: the speaker form's optional team-dynamics rating is NOT stored here (it is about the team,
not the chair). It lives in its own `TeamDynamicsRating` record alongside the partner-dynamics
data — see below.

### Relationships

- belongs to `DebateSession`
- belongs to `Member` twice by role (speaker, chair)

## `AdjudicatorScoreRecord`

### Purpose

Stores chair-to-adjudicator rating after the session.

### Suggested responsibilities

- chair scores adjudicators in that room
- provide adjudicator average source data

### Important fields

- `id`
- `sessionId`
- `proposalId`
- `chairMemberId`
- `adjudicatorMemberId`
- `rating`
- `notes`

### Relationships

- belongs to `DebateSession`
- belongs to `Member` twice by role

## `LeaderboardSnapshot`

### Purpose

Optional cached leaderboard layer for faster reads.

### Suggested responsibilities

- cached speaker leaderboard row
- cached adjudicator leaderboard row
- cached chair-derived stats

### Important fields

- `id`
- `memberId`
- `leaderboardType`
- `valueJson`
- `updatedAt`

### Relationships

- belongs to `Member`

### Important Note

This should be treated as a derived or cached read model, not the source of truth.

## 4. Metric And Tuning Models

These models support learned metrics, fallback confidence, and bounded adaptive tuning.

## `PairingMetricDefinition`

### Purpose

Stores DB-backed metric definitions.

### Suggested responsibilities

- metric key
- category
- base weight
- enabled state
- scope
- whether it is hard or soft
- fallback target

### Important fields

- `id`
- `key`
- `name`
- `description`
- `category`
- `baseWeight`
- `isEnabled`
- `isHardRule`
- `isSoftRule`
- `scope`
- `fallbackConfigJson`

## `PairingMetricAdjustment`

### Purpose

Stores bounded learned adjustment overlays over the base metric definitions.

### Suggested responsibilities

- current learned adjustment
- total drift tracking
- reason or batch source

### Important fields

- `id`
- `metricDefinitionId`
- `currentAdjustment`
- `lastUpdatedAt`
- `sourceWindowId`

### Relationships

- belongs to `PairingMetricDefinition`

## `MetricAdjustmentHistory`

### Purpose

Stores historical adjustment changes over time.

### Suggested responsibilities

- old adjustment
- new adjustment
- why it changed
- which tuning window caused it

### Important fields

- `id`
- `metricDefinitionId`
- `oldAdjustment`
- `newAdjustment`
- `reason`
- `tuningWindowId`
- `createdAt`

## `MemberMetricSnapshot`

### Purpose

Stores reusable derived metrics for a specific member.

### Suggested responsibilities

- overall speaker score snapshot
- motion-type score snapshots
- role-score snapshots
- motion-type-x-role snapshots
- confidence counts
- speaker strength snapshot

### Important fields

- `id`
- `memberId`
- `metricKey`
- `contextKey`
- `value`
- `observationCount`
- `confidence`
- `updatedAt`

### Relationships

- belongs to `Member`

### Example usage

- `speaker_total_score`
- `speaker_motion_type_score:IR`
- `role_score:PM`
- `motion_type_x_role_score:IR:PM`

## `PairMetricSnapshot`

### Purpose

Stores learned metrics about two-member pair dynamics.

### Suggested responsibilities

- overall pair compatibility
- motion-type-specific pair compatibility
- pair observation count
- pair confidence

### Important fields

- `id`
- `memberAId`
- `memberBId`
- `metricKey`
- `contextKey`
- `value`
- `observationCount`
- `confidence`
- `updatedAt`

### Relationships

- belongs to `Member` twice

## `TeamDynamicsRating`

### Purpose

Stores the speaker post-session form's OPTIONAL subjective team-dynamics rating (0–10). It lives
here, with the partner-dynamics data, NOT on `ChairFeedbackRecord` — because it is about the
speaker's team/teammate, not the chair.

### Suggested responsibilities

- capture one speaker's subjective rating of their own team dynamics for a session
- act as a **secondary** input to `partner_dynamics_*`; the primary input stays results-based
  (BP result points / pair win record). Never let this subjective rating dominate the metric.

### Important fields

- `id`
- `sessionId`
- `raterMemberId` — the speaker who submitted the rating
- `teammateMemberId` — their teammate (the other half of the BP team)
- `rating` — 0–10
- `createdAt`

### Relationships

- belongs to `DebateSession`
- belongs to `Member` twice (rater, teammate)
- feeds `PairMetricSnapshot` (partner_dynamics) as a secondary signal

### Why It Matters

Keeps the subjective signal cleanly separated from chair feedback and co-located with the pair
data it actually informs, while preserving the rule that partner dynamics is primarily results-based.

## 5. Evaluation Models

These models support eval harness replay and safe comparison of engine behavior.

## `EvalScenario`

### Purpose

Stores replayable evaluation scenarios.

### Suggested responsibilities

- historical or synthetic scenario payload
- scenario type
- scenario difficulty
- baseline expectations if any

### Important fields

- `id`
- `scenarioType`
- `name`
- `inputJson`
- `expectedSignalsJson`
- `createdAt`

## `EvalRun`

### Purpose

Stores one execution of the eval harness.

### Suggested responsibilities

- engine version tested
- rule version tested
- run mode
- run summary

### Important fields

- `id`
- `engineVersion`
- `ruleVersion`
- `runType`
- `startedAt`
- `completedAt`
- `summaryJson`
- `resultStatus`

## `EvalScenarioResult`

### Purpose

Stores per-scenario outcome inside an eval run.

### Suggested responsibilities

- rule validity result
- quality metrics
- scenario recommendation
- repeated probabilistic run summary

### Important fields

- `id`
- `evalRunId`
- `scenarioId`
- `validityJson`
- `qualityJson`
- `recommendation`

### Relationships

- belongs to `EvalRun`
- belongs to `EvalScenario`

## `TuningReviewWindow`

### Purpose

Represents one periodic tuning batch such as `6-7` sessions.

### Suggested responsibilities

- which sessions were included
- what signals were compared
- what suggestions were made
- whether suggestions were approved

### Important fields

- `id`
- `windowStartSessionId`
- `windowEndSessionId`
- `sessionCount`
- `analysisJson`
- `status`
- `reviewedAt`

## Relationship Summary

This is the conceptual relationship map.

```text
DebateSession
  -> AttendanceRecord[]
  -> SessionRoleAssignment[]
  -> PairingProposal[]
  -> SpeakerScoreRecord[]
  -> ChairFeedbackRecord[]
  -> AdjudicatorScoreRecord[]

PairingProposal
  -> DebateRoomAssignment[]
  -> UnassignedParticipant[]
  -> ProposalReviewLog[]
  -> ProposalRating?

DebateRoomAssignment
  -> DebateTeamAssignment[]
  -> RoomAdjudicatorAssignment[]

DebateTeamAssignment
  -> TeamSpeakerAssignment[]

PairingMetricDefinition
  -> PairingMetricAdjustment
  -> MetricAdjustmentHistory[]

Member
  -> AttendanceRecord[]
  -> SessionRoleAssignment[]
  -> SpeakerScoreRecord[]
  -> ChairFeedbackRecord[]
  -> AdjudicatorScoreRecord[]
  -> MemberMetricSnapshot[]
  -> PairMetricSnapshot[]
```

## Minimal V1 Model Set

If we want to stay practical, these are the models I would treat as the minimum high-value V1 set:

- `DebateSession`
- `AttendanceRecord`
- `SessionRoleAssignment`
- `PairingProposal`
- `DebateRoomAssignment`
- `DebateTeamAssignment`
- `TeamSpeakerAssignment`
- `RoomAdjudicatorAssignment`
- `UnassignedParticipant`
- `ProposalReviewLog`
- `ProposalRating`
- `SpeakerScoreRecord`
- `ChairFeedbackRecord`
- `AdjudicatorScoreRecord`
- `PairingMetricDefinition`
- `PairingMetricAdjustment`
- `MemberMetricSnapshot`
- `PairMetricSnapshot`
- `TeamDynamicsRating`

## Models That Can Be Added Slightly Later

These are useful, but could be deferred if needed:

- `LeaderboardSnapshot`
- `MetricAdjustmentHistory`
- `EvalScenario`
- `EvalRun`
- `EvalScenarioResult`
- `TuningReviewWindow`

## Recommended Prisma Naming Direction

For consistency, I would recommend:

- singular PascalCase model names in Prisma
- explicit relation names where the same model connects twice
- avoid vague names like only `Room` or only `Score`

Good examples:

- `DebateSession`
- `PairingProposal`
- `TeamSpeakerAssignment`
- `ChairFeedbackRecord`
- `PairMetricSnapshot`

## What This Model Map Helps Prevent

This model map is important because it prevents:

- mixing session role with permanent account role
- storing pairing only as an opaque JSON blob
- losing review history
- losing leftover participant visibility
- losing published-pairing ownership clarity
- losing tuning auditability
- tying leaderboard logic directly to UI-only concepts

## Summary

This is the backend data-model bridge between planning and implementation.

It gives us:

- a stable model vocabulary
- a clear split between session, pairing, scoring, metric, and eval entities
- a realistic V1 model set
- a path from docs into Prisma schema work

Once this model map is accepted, the next implementation-ready step is to convert it into the actual Prisma model draft.
