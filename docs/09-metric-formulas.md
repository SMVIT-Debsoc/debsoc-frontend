# Metric Formulas

## Purpose

This document isolates the mathematical side of the pairing engine.

It exists to answer one question clearly:

- what exact formulas are we using
- what formulas are proposed but not fully locked
- what formulas are still intentionally open

This should become the main review document before implementation of the engine logic begins.

## Formula Status Legend

### `FINALIZED ENOUGH`

These formulas are strong enough to be treated as current implementation direction unless we explicitly revise them.

### `PROPOSED V1`

These formulas are currently the recommended version for implementation, but small refinements may still happen before coding.

### `STILL OPEN`

These formulas are not fully specified yet and should be finalized before building the real scoring engine.

## 1. Effective Weight Formula

### Status

`FINALIZED ENOUGH`

### Formula

```text
effective_weight = base_weight + learned_adjustment
```

### Meaning

- `base_weight` is the original intended importance of the metric
- `learned_adjustment` is a small bounded tuning overlay derived from historical evidence

### Safety Rule

```text
max_total_learned_adjustment_per_metric = +/- 0.03
```

This prevents the engine from drifting too far away from its designed behavior.

## 2. Confidence Formula

### Status

`FINALIZED ENOUGH`

### Formula

```text
confidence = min(observation_count / target_count, 1.0)
```

### Meaning

- when observations are low, confidence is low
- when observations reach the target count, confidence becomes `1.0`
- broad fallback metrics dominate early
- specific metrics dominate later

## 3. Fallback Blending Formula

### Status

`FINALIZED ENOUGH`

### Formula

```text
effective_metric = confidence * specific_metric + (1 - confidence) * fallback_metric
```

### Meaning

This is the main mechanism that makes the engine improve with more data without overfitting too early.

## 4. Speaker Strength Formula

### Status

`PROPOSED V1`

### Formula

```text
speaker_strength =
  0.70 * normalized_speaker_total_score +
  0.20 * consistency_score +
  0.10 * confidence_score
```

### Meaning

- `normalized_speaker_total_score` gives broad performance quality (built on the CUMULATIVE total,
  so low-attendance members start from a low base)
- `consistency_score` rewards stable speaker performance
- `confidence_score` rewards having enough evidence to trust the estimate

### Regularity / Data Sensitivity (intended)

This metric is deliberately attendance/data-sensitive: irregular or low-data members get a lower,
less-trusted strength, because less practice = a genuinely weaker speaker and thin data = lower
confidence. Direction for the confidence term: `confidence_score = min(sessions / target, 1.0)`.
Do NOT make this attendance-neutral. Full rationale in `05` → `speaker_strength`.

### Why This Formula Works

- keeps raw broad performance as the strongest signal
- prevents raw totals from fully dominating
- gives the engine a more dependable strength estimate for balancing rooms and teams
- penalizes irregularity correctly (less practice + less data → lower, less-trusted strength)

### Still Open Inside This Formula

- exact `consistency_score` calculation
- exact `confidence_score` calculation (direction set above: observation/session count based)
- whether recent-form component should be added later

## 5. Room Balance Score Formula

### Status

`PROPOSED V1`

### Step 1: Room Strength

For each room:

```text
room_strength = average(speaker_strength of all 8 speakers in room)
```

### Step 2: Room Experience

For each room:

```text
room_experience = average(experience_index of all 8 speakers in room)
```

### Step 3: Cross-Room Imbalance

Across all rooms:

```text
strength_balance_penalty = variance(room_strengths)
experience_balance_penalty = variance(room_experiences)
```

### Step 4: Final Room Balance Score

```text
room_balance_score = 1.0 - (
  0.75 * normalized_strength_variance +
  0.25 * normalized_experience_variance
)
```

### Single-Room Default

```text
if room_count == 1:
  room_balance_score = 1.0
```

### Meaning

- strength balance matters more than experience balance
- lower variance means better room fairness
- the score gets worse when one room is clearly stacked and another is weak

### Still Open Inside This Formula

- exact `experience_index` formula
- exact normalization method for variance
- whether room difficulty should also be included later

## 6. Chair Assignment Score Formula

### Status

`FINALIZED ENOUGH`

### Formula

```text
chair_assignment_score =
  0.60 * chair_score +
  0.25 * adjudicator_average_score +
  0.15 * chair_confidence_score
```

### Meaning

- `chair_score` is the primary signal
- general adjudicator quality still matters
- confidence protects against overtrusting a chair with too little history

### Allocation Rule

1. rank rooms by difficulty or importance
2. rank available adjudicators by `chair_assignment_score`
3. assign stronger chairs to stronger or more sensitive rooms first
4. the remaining adjudicators become the surplus pool for the panel distribution rule below

## 6b. Adjudicator Panel Distribution

### Status

`PROPOSED V1`

### Purpose

After each room has exactly one chair, spread the surplus adjudicators across rooms weighted by
room difficulty/importance, so harder rooms get larger panels. Balances adjudication quality
instead of stacking one room. Full prose lives in `05-pairing-metrics.md` →
"Adjudicator And Chair Allocation Logic".

### Formula

```text
surplus = total_adjudicators - room_count
MAX_ADJUDICATORS_PER_ROOM = 3            # 1 chair + up to 2 panel
```

### Rule

1. every room starts at chair-only (panel size 0)
2. using the difficulty/importance ranking from chair allocation, hand out surplus adjudicators
   one at a time, hardest room first, looping until surplus runs out
3. never exceed `MAX_ADJUDICATORS_PER_ROOM` per room
4. adjudicators left after every room hits the cap become `RESERVE` (shown to admin, never dropped)

### Hard-rule boundary

Panel distribution is soft and admin-overridable, but it sits ON TOP of two hard adjudicator
rules that it may never violate:

- each room has at least 1 adjudicator
- each room has **exactly 1 chair** — never 0, never 2

`surplus` is computed from adjudicators that are NOT chairs, and the distribution step only ever
assigns non-chair panel members. Neither distribution nor any admin override may create a room
with ≠1 chair; such a proposal is invalid and must be rejected before persistence.

### Still Open Inside This Rule

- whether `MAX_ADJUDICATORS_PER_ROOM` should be configurable per session
- whether difficulty ranking should also weight panel-member strength, not just panel size

## 7. Leftover Speaker Calculation

### Status

`FINALIZED ENOUGH`

### Formula

```text
room_count = floor(number_of_speakers / 8)
leftover_speakers = number_of_speakers % 8
```

### Default Rule

- generate only complete rooms
- do not automatically create incomplete BP rooms
- leftover speakers are marked `UNASSIGNED`

## 8. Probabilistic Top-Band Selection

### Status

`FINALIZED ENOUGH`

### Selection Flow

1. generate many valid proposals
2. score all proposals
3. sort descending by total proposal score
4. keep top `5`
5. choose one using weighted randomness

### Current Probability Pattern

```text
rank_1 = 0.30
rank_2 = 0.24
rank_3 = 0.18
rank_4 = 0.15
rank_5 = 0.13
```

### Meaning

- stronger proposals are more likely
- the system avoids always choosing the single top option
- the system stays exploratory without becoming chaotic

## 9. Objective Mode Weighting Rule

### Status

`FINALIZED ENOUGH`

### Formula Style

Use metric multipliers rather than completely separate formulas.

```text
objective_adjusted_weight = effective_weight * objective_multiplier
```

### Example

If:

```text
speaker_total_score base/effective weight = 0.22
COMPETITIVE multiplier = 1.20
```

then:

```text
objective_adjusted_weight = 0.22 * 1.20 = 0.264
```

### Why This Is Better

- keeps one core engine
- avoids maintaining three separate scoring systems
- makes objective behavior easier to explain and tune

## 10. Team Quality Aggregate

### Status

`STILL OPEN`

### Current Need

The proposal-scoring layer refers to `team_quality_aggregate`, but we have not frozen its exact formula.

### Likely Direction

A strong team-quality aggregate should combine:

- speaker total score contribution
- motion-type score contribution
- interpreted speaker strength
- pair compatibility
- role fit
- repetition penalties

### Candidate Formula Direction

```text
team_quality_aggregate =
  weighted_sum(
    speaker_total_score,
    speaker_motion_type_score,
    speaker_strength,
    partner_dynamics_overall,
    partner_dynamics_by_motion_type,
    role_score,
    motion_type_x_role_score,
    repeat_partner_penalty,
    bp_position_history,
    internal_speaking_role_history
  )
```

### What Still Needs Finalization

- whether this is a mean of team scores or a fairness-adjusted room mean
- whether pair compatibility should be stronger than role fit
- whether development objective changes the team-quality formula directly or only through multipliers

## 11. Full Proposal Score Formula

### Status

`STILL OPEN`

### Current Need

The engine needs one final proposal-level score used to rank all candidate proposals.

### Likely Structure

```text
proposal_score =
  proposal_layer_score +
  sum_of_team_scores +
  adjudication_score +
  objective_adjustments
```

### Candidate Layered Direction

```text
proposal_score =
  0.40 * room_balance_score +
  0.20 * adjudicator_average_score +
  0.20 * chair_score +
  0.12 * team_quality_aggregate +
  0.08 * experience_distribution_aggregate
```

### Why It Is Still Open

- we have not fixed whether `team_quality_aggregate` is already normalized enough
- we have not fixed whether `chair_score` should be direct or room-weighted
- we have not fixed whether proposal-level repetition penalties need a separate layer

## 12. Consistency Score Formula

### Status

`STILL OPEN`

### What It Should Mean

`consistency_score` should represent how stable a speaker's performance is across sessions.

### Candidate Direction

Use score variance or standard deviation inversely.

Example direction:

```text
consistency_score = 1.0 - normalized_score_variance
```

or:

```text
consistency_score = 1 / (1 + normalized_standard_deviation)
```

### What Still Needs Finalization

- whether variance or standard deviation is better
- how many past sessions are considered
- whether recent sessions should count more than old sessions

## 13. Experience Index Formula

### Status

`STILL OPEN`

### What It Should Mean

`experience_index` is used inside room-balance calculations to represent how experienced a member is for balancing purposes.

### Candidate Direction

A simple V1 option:

```text
experience_index = normalized_academic_year
```

A better later option:

```text
experience_index =
  weighted_sum(
    academic_year,
    number_of_speaking_sessions,
    number_of_motion_types_seen,
    number_of_roles_seen
  )
```

### What Still Needs Finalization

- whether academic year alone is enough for V1
- whether actual speaking history should be included immediately
- whether adjudication experience should contribute separately for adjudicator balancing

## 14. Pair Dynamics Aggregation Formula

### Status

`STILL OPEN`

### What We Already Know

Primary signal:

```text
bp_result_points = 3 / 2 / 1 / 0
```

### What Is Missing

We have not fully frozen how multiple sessions are aggregated into one pair score.

### Candidate Direction

```text
partner_dynamics_overall = average(bp_result_points_together)
```

Possible richer version:

```text
partner_dynamics_overall =
  weighted_sum(
    average_bp_result_points_together,
    average_combined_speaker_outcome,
    confidence_score
  )
```

### Motion-Type Version

```text
partner_dynamics_by_motion_type = average(bp_result_points_together_in_motion_type)
```

### What Still Needs Finalization

- whether we use simple average or weighted average
- whether speaker-score outcome should be blended in
- whether recent pair performances should weigh more

## 15. Role Score Aggregation Formula

### Status

`STILL OPEN`

### What It Should Mean

`role_score` should represent how well a speaker performs in one exact internal role such as `PM` or `OW`.

### Candidate Direction

```text
role_score(role) = average(raw_speaker_scores_when_assigned_that_role)
```

Possible stronger version:

```text
role_score(role) =
  weighted_sum(
    average_raw_speaker_score_in_role,
    confidence_score,
    normalized_bp_result_points_in_role
  )
```

### What Still Needs Finalization

- whether role score should use only raw speaker score or also team result
- whether motion type is excluded here and saved for `motion_type_x_role_score`
- whether low-observation roles should be heavily damped before fallback

## 16. Motion Type X Role Score Formula

### Status

`STILL OPEN`

### What It Should Mean

This is the most specific speaking metric, such as:

- `PM in IR`
- `OW in Policy`

### Candidate Direction

```text
motion_type_x_role_score = average(raw_scores_for_role_in_motion_type)
```

### Fallback Chain

```text
motion_type_x_role_score
-> role_score
-> speaker_motion_type_score
-> speaker_total_score
```

### What Still Needs Finalization

- whether this should include BP result points too
- how much data is required before trusting it
- whether this metric should stay lightly weighted in early versions

## 16b. Feedback Metric Aggregation

### Status

`PROPOSED V1`

### Purpose

Post-session feedback metrics aggregate differently depending on whether a metric is a *quality*
signal (averaged) or a *participation/points* signal (cumulative). Each raw rating is its own
record; the metric is derived and recomputable. Full prose in `05-pairing-metrics.md`.

### chair_score — two-stage mean (only metric with multiple raters per session)

Up to 8 speakers rate one chair, so average within a session, then across sessions:

```text
session_chair_rating(chair, session) = mean(speaker ratings for that chair that session)
chair_score(chair)                   = mean(session_chair_rating over the chair's sessions)
confidence                           = min(sessions_chaired / 4, 1.0)
```

### adjudicator_average_score — across-session mean ONLY (not cumulative, not count-boosted)

The chair scores each adjudicator individually (one rating per adjudicator per session):

```text
adjudicator_average_score(adj) = mean(chair rating for that adjudicator over their sessions)
```

The leaderboard ranks by this average only — so a member can be both speaker and adjudicator across
sessions without their adjudicator standing being penalized for adjudicating fewer times. Counts
(#adjudicated, #chaired) are shown as context only (may gate a min-sessions threshold to appear),
never as a ranking multiplier.

### speaker_total_score — CUMULATIVE SUM (not averaged)

One chair-entered raw score per speaker per session; the metric and the speaker leaderboard are
the running total:

```text
speaker_total_score(member) = sum(raw_speaker_score over the member's speaking sessions)
```

Additive on purpose — non-attendance must not be rewarded; a member with few sessions cannot rank
high on an average. Same cumulative shape applies per motion type for the motion-type leaderboard.

### Still Open Inside This Rule

- whether to weight recent sessions more (recency) for the averaged metrics
- whether to drop outlier ratings before averaging `chair_score`

RESOLVED: `speaker_strength` stays built on the cumulative `speaker_total_score` (+ consistency +
confidence) and is intentionally attendance/data-sensitive — it is NOT switched to a per-session
average. Irregular / low-data members get a lower, less-trusted strength by design (see `05` →
`speaker_strength` → "Regularity / Data Sensitivity").

## 17. Tuning Adjustment Formula

### Status

`STILL OPEN`

### What We Already Know

- tuning happens every `6-7` sessions
- tuning is bounded
- tuning uses admin proposal rating plus actual outcomes

### What Is Missing

We have not yet frozen the exact math for changing a metric weight.

### Candidate Direction

```text
new_learned_adjustment =
  old_learned_adjustment + bounded(delta_from_batch_review)
```

Possible bounded update form:

```text
delta = learning_rate * observed_metric_value_correlation_with_success
new_learned_adjustment = clamp(old_adjustment + delta, -0.03, +0.03)
```

### What Still Needs Finalization

- exact learning rate
- exact success definition in tuning
- whether admin rating and actual outcomes get equal importance
- whether tuning remains fully review-assisted in V1

## 18. Recommended V1 Formula Freeze List

These are the formulas I would treat as ready enough for a V1 implementation unless we deliberately revise them:

- `effective_weight = base_weight + learned_adjustment`
- `confidence = min(observation_count / target_count, 1.0)`
- `effective_metric = confidence * specific_metric + (1 - confidence) * fallback_metric`
- `speaker_strength = 0.70 * normalized_speaker_total_score + 0.20 * consistency_score + 0.10 * confidence_score`
- `room_balance_score = 1.0 - (0.75 * normalized_strength_variance + 0.25 * normalized_experience_variance)`
- `chair_assignment_score = 0.60 * chair_score + 0.25 * adjudicator_average_score + 0.15 * chair_confidence_score`
- `room_count = floor(number_of_speakers / 8)`
- `leftover_speakers = number_of_speakers % 8`
- top-band proposal selection from top `5`

## 19. Highest-Priority Formula Gaps Still To Lock

If we want the formula layer to feel truly complete before coding, the most important unresolved formulas are:

1. `consistency_score`
2. `experience_index`
3. `team_quality_aggregate`
4. `full proposal_score`
5. `pair_dynamics aggregation`
6. `role_score aggregation`
7. `tuning adjustment formula`

## Summary

The pairing system now has a strong formula foundation.

The engine already has clear formulas for:

- weight application
- confidence blending
- speaker strength direction
- room balance direction
- chair assignment
- top-band probabilistic selection
- leftover handling

What remains is mostly the deeper mathematical detail for secondary and tertiary formulas rather than the overall engine structure itself.
