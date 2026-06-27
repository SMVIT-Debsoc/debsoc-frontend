# Database Design

## Purpose

This document captures the database changes currently expected for the debate pairing system. It includes both conceptual changes and likely model-level additions or modifications.

The database will become the long-term memory of the system. It needs to support operational state, history, scoring, metrics, review actions, publication visibility, eval inputs, and adaptive tuning inputs.

## Database Design Principles

The database should become the source of truth for:

- session state
- attendance state
- pairing proposals
- final published pairings
- scoring records
- leaderboard source data
- pairing metrics
- proposal-review history
- published pairing reads
- learning and tuning history
- evaluation replay inputs and outputs later

## 1. Attendance Model Changes

Attendance can no longer be treated as a simple present-or-absent snapshot.

### Attendance now needs to support

- whether a person is present for the session
- what role they have in this session
- whether they were used in the generated pairing
- whether they were left out after generation
- whether final attendance has been published
- whether final attendance is locked from the published proposal

## 2. Session Model Changes

The session record needs to store more context than before.

### Session should represent

- date of the debate
- motion type
- motion text
- attendance summary
- room count
- pairing status
- scoring status
- completion state
- reference to the current or accepted proposal
- reference to the published proposal
- publication timestamp
- pairing objective such as `DEVELOPMENT`, `BALANCED`, or `COMPETITIVE`

This matters because members, cabinet, and president should all be able to read the official published pairing once publication happens.

## 3. Pairing Proposal Storage

A generated pairing should exist as a proposal before publication.

### Proposal data should capture

- which session it belongs to
- when it was generated
- what rules or metric version it used
- who reviewed it
- whether it was approved, rejected, overridden, or regenerated
- the generated pairing payload
- proposal score summary
- whether it became the official published proposal
- admin rating after review if provided
- reasoning or notes for auditability

## 4. Pairing Structure Storage

The final generated structure is more complex than one record.

### We need to store

- rooms
- teams per room
- speaker assignments per team
- adjudicators per room
- chair designation per room
- unassigned participants when leftovers exist
- side allocations and exact speaking roles where relevant

This structure must support two different uses:

- admin review before publication
- member/cabinet/president viewing after publication

## 5. Pair History And Learning Data

Historical pairing data is central to future pairing quality.

### History should help answer

- who has been paired together before
- how often the same people have repeated as partners
- which people have frequently been in the same room
- which exact BP positions and internal roles members have held
- which motion types a speaker has performed well or poorly in
- how specific pairs perform overall and by motion type

## 6. Speaker Score Data

Speaker score needs to be more structured than a single generic session number.

### Current direction

Speaker performance should be understood through at least:

- overall speaker score
- motion-type-specific speaker score
- role-specific score
- motion-type and role combined score where enough data exists
- BP result points as an additional outcome signal

## 7. Adjudicator And Chair Score Data

Adjudicator performance should be tracked separately from speaker performance.

### The model should support

- adjudicator score records
- chair score records
- number of times a person served as adjudicator
- number of times a person served as chair
- average score across adjudicating sessions
- confidence count for chair-specific performance

## 8. Pairing Metric Storage

Pairing metrics themselves should also be stored in the database.

### Metrics should be first-class records

Each metric may need fields like:

- key
- name
- description
- category
- base weight
- learned adjustment
- enabled state
- whether it behaves as hard or soft logic
- whether it is historical or session-based
- what part of the engine it affects
- fallback config

### Additional learned metric storage direction

The system should also support metric snapshot style records such as:

- member metric snapshots
- pair metric snapshots

These make confidence-based reuse easier for the runtime engine.

## 9. Review, Audit, Publication, And Tuning Data

The review flow needs structured persistence.

### We should store

- approval actions
- rejection actions
- override actions
- regeneration history
- who performed each action
- when the action happened
- admin pairing rating
- admin issue tags
- publication timestamp and official published proposal reference
- proposal-to-outcome comparison inputs for later tuning

## 10. Likely Models To Add Or Change

### Models likely to add

- `PairingProposal`
- `ProposalRating`
- `DebateRoomAssignment`
- `DebateTeamAssignment`
- `TeamSpeakerAssignment`
- `RoomAdjudicatorAssignment`
- `UnassignedParticipant`
- `SpeakerScoreRecord`
- `ChairFeedbackRecord`
- `AdjudicatorScoreRecord`
- `PairingMetricDefinition`
- `PairingMetricAdjustment`
- `ProposalReviewLog`
- `MemberMetricSnapshot`
- `PairMetricSnapshot`
- `LeaderboardSnapshot`
- later eval/tuning support models

### Models likely to change

- `Attendance`
- `DebateSession`
- `Member`
- `cabinet`

## 11. Responsibility Notes

### `ProposalRating`
Stores admin evaluation of proposal quality before or during approval.

### `RoomAdjudicatorAssignment`
Stores adjudicators in rooms and whether they are the chair.

### `PairingMetricAdjustment`
Stores bounded learned adjustments over time instead of replacing base weights entirely.

### `SessionRoleAssignment` or `UserSessionRole`
Tracks what a user was doing in a specific session context.

### `MemberMetricSnapshot`
Stores member-level derived metric values and observation counts.

### `PairMetricSnapshot`
Stores pair-level derived metric values and observation counts.

## 12. DB Vs Config Boundary

Current direction:

- generated data and history belong in the database
- metric definitions and learned adjustments belong in the database
- published pairing ownership and official visibility state belong in the database
- high-level structural templates can still be documented in files

## 13. Risks To Watch

- over-normalizing too early may slow implementation
- under-normalizing may make future metric queries painful
- session role data must not get confused with permanent account roles
- leaderboard values should be derived from raw score data, not become the only stored truth
- tuning adjustments must stay bounded and auditable
- published pairing must have one clear official source of truth per session

## Summary

The database changes are foundational. We are moving toward a system where the database supports not only operational debate sessions but also proposal review, published pairing visibility, metric-based decision-making, adaptive tuning, and future pairing intelligence.
