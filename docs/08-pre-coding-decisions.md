# Pre-Coding Decisions

## Purpose

This document lists the decisions that must be confirmed before implementation starts, along with the decisions that can still be tuned later without destabilizing the architecture.

## What Must Be Confirmed Before Coding

## 1. Final Metric Catalog

The metric catalog is now broadly defined and should include at minimum:

- `academic_year`
- `speaker_total_score`
- `speaker_motion_type_score`
- `speaker_strength`
- `repeat_partner_penalty`
- `bp_position_history`
- `internal_speaking_role_history`
- `role_score`
- `motion_type_x_role_score`
- `partner_dynamics_overall`
- `partner_dynamics_by_motion_type`
- `room_balance_score`
- `adjudicator_average_score`
- `chair_score`

Status: ACCEPTED for V1.

Decision recorded in Phase 0:

- accept the full metric catalog for V1
- do not defer any listed metric to stored-now / activated-later status at this stage

## 2. Hard Rules Vs Soft Rules

We must confirm which rules invalidate a pairing entirely and which merely reduce proposal quality.

This affects:

- feasibility checks
- candidate filtering
- scoring behavior
- regeneration logic

Status: ACCEPTED for V1.

Decision recorded in Phase 0:

- hard rules = only present participants, speaker or adjudicator role required, no double assignment, exactly 8 speakers per room, exactly 4 teams per room, exactly 2 speakers per team, valid BP positions `OG/OO/CG/CO`, at least 1 adjudicator per room, exactly 1 chair per room, no publish before approval
- strict forced constraints remain hard: forced team-up, forced separation, strict time constraint, forced chair, forced role, forced room-count override
- soft rules = repeat partner penalty, room balance, pair quality, motion-role fit, panel distribution beyond the required 1 adjudicator, and non-strict event team-up preference

## 3. Session-Role Routing Rule

Post-session dashboard behavior must be driven by the user's role in that session, not by permanent account role.

This affects:

- routing design
- authorization logic
- scoring-form assignment
- session-role storage

Status: ACCEPTED for V1.

Decision recorded in Phase 0:

- post-session routing is based on the user's role in that session, not permanent account role
- authorization for post-session scoring flows is based on `SessionRoleAssignment`
- scoring-form assignment is based on the user's session role for that debate session
- session role must be stored explicitly and used as the governing source for post-session behavior

## 4. Post-Session Scoring Inputs

We must confirm the exact inputs each session role submits after debate.

This includes:

- speaker scoring fields
- chair scoring fields
- whether adjudicators submit anything
- optional teammate or issue feedback shape

## 5. Core Database Model Structure

The main model structure must be stable before coding.

Minimum model direction should follow `12-backend-data-model-map.md`.
Use the authoritative model vocabulary from `docs/12-backend-data-model-map.md` and
`docs/pairing-knowledge-graph.md`; do not reintroduce older placeholder names here.

Core model direction:

- `AttendanceRecord`
- `DebateSession`
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
- `PublishedPairingView` as a logical read model for the official published pairing

## 6. Room Generation And Leftover Handling

We already have a default rule direction, but it should be explicitly confirmed before coding:

- rooms are based on full groups of `8` speakers
- leftovers are marked `UNASSIGNED`
- incomplete rooms are not auto-generated
- admin resolves leftovers by adjustment and regeneration

## 7. Proposal Selection Strategy

We have a strong current direction:

- generate many valid candidates
- score them
- keep the top band
- select probabilistically from the top band

What still needs confirmation:

- whether any post-V1 refinement is wanted beyond the current top-band size of `5`
- whether any post-V1 refinement is wanted beyond the current weighted-rank distribution direction

## 8. Tuning Governance

We have a strong current direction:

- collect `6-7` sessions
- compare proposal quality with outcomes
- apply bounded adjustments

What still needs confirmation:

- whether tuning is review-assisted only or partially automatic

## 9. Access Control And Published Visibility

We have a strong current direction:

- only cabinet and president can generate, review, approve, override, regenerate, rate, and publish pairings
- members cannot control the pairing lifecycle
- once a proposal is published, members, cabinet, and president can view the official published pairing
- the published read flow must use the official published proposal for the session

What still needs confirmation:

- exact names of the auth guard helpers
- whether cabinet and president are the only admin roles for V1, or whether a separate future admin role will be introduced later

## 10. Phase 6 Formula Blocker

The scoring-engine phase cannot start until the `Fo10` formulas are explicitly finalized.

This includes:

- `team_quality_aggregate`
- full `proposal_score`
- `consistency_score`
- `experience_index`
- pair-dynamics aggregation
- `role_score` aggregation
- tuning-adjustment formula

## What Can Still Be Tuned Later

These should not block initial implementation as long as the architecture supports them.

## 1. Exact Weight Values

Initial weights are enough to start. Final decimals can be tuned later.

## 2. Exact Confidence Targets

The fallback formula is fixed enough. Exact observation thresholds can still be adjusted after real usage.

## 3. Exact Probability Percentages

The top-band probabilistic design is fixed enough. The exact distribution across top proposals can be refined later.

## 4. Exact Leaderboard Display Formula

We need the right raw data first. Display refinements can happen later.

## Practical Checklist

Before coding starts, we should be able to answer these clearly:

1. Is the current metric list accepted for V1?
2. Which rules are hard and which are soft?
3. Is post-session routing based on session role only?
4. What exactly does each session role submit after the session?
5. Are the core models and relationships accepted?
6. Are room formation and leftover rules accepted?
7. Is top-band probabilistic proposal selection accepted?
8. Is tuning governance accepted?
9. Are the cabinet/president control rules and member published-view rule accepted?
10. Are the `Fo10` formulas finalized enough to start the scoring engine phase?

## Recommendation

The safest implementation order is:

1. confirm the pre-coding decisions in this file
2. keep metric and database docs aligned with them
3. begin schema and backend implementation only after that

