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

What still needs confirmation:

- whether any metric should be removed from V1
- whether any metric should be stored now but activated later

## 2. Hard Rules Vs Soft Rules

We must confirm which rules invalidate a pairing entirely and which merely reduce proposal quality.

This affects:

- feasibility checks
- candidate filtering
- scoring behavior
- regeneration logic

## 3. Session-Role Routing Rule

Post-session dashboard behavior must be driven by the user's role in that session, not by permanent account role.

This affects:

- routing design
- authorization logic
- scoring-form assignment
- session-role storage

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

Core model direction:

- `Attendance`
- `DebateSession`
- `SessionParticipantRole`
- `PairingProposal`
- `ProposalRating`
- `PairingRoom`
- `PairingTeam`
- `TeamSpeakerAssignment`
- `RoomAdjudicatorAssignment`
- `ChairAssignment`
- `LeftoverAssignment`
- `PairHistory`
- `SpeakerScore`
- `AdjudicatorScore`
- `PairingMetric`
- `PairingMetricAdjustment`
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

- exact top-band size
- exact probability distribution approach

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

## Recommendation

The safest implementation order is:

1. confirm the pre-coding decisions in this file
2. keep metric and database docs aligned with them
3. begin schema and backend implementation only after that