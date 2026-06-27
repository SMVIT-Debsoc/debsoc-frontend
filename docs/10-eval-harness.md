# Eval Harness

## Purpose

This document defines the evaluation harness for the debate pairing engine.

The pairing engine is:

- probabilistic
- metric-weighted
- adaptive over time
- partly tuned from feedback and outcomes

Because of that, we need a separate evaluation system that tells us whether a change actually makes pairing better or only changes behavior.

The eval harness is the safety system for the engine.

It should help us answer questions like:

- is the engine still producing valid proposals
- did a formula change improve room balance
- did a weight change reduce repetition
- is `DEVELOPMENT` actually more developmental than `COMPETITIVE`
- did periodic tuning improve performance or make it worse

## Core Role Of The Eval Harness

The pairing engine generates proposals.

The eval harness judges them.

This means the eval harness should be able to:

- run the engine on fixed input data
- collect output proposals and scores
- calculate evaluation metrics
- compare engine versions, formulas, weights, or tuning states
- identify regressions

## Why The Eval Harness Matters

Without an eval harness, the system can become unstable in subtle ways.

For example:

- a change may improve room balance but hurt development spread
- a change may reduce repetition but weaken chair assignment
- a tuning step may overfit to one short batch of sessions
- a probabilistic change may look better in one run but worse over many runs

The eval harness gives us repeatable evidence instead of intuition only.

## What The Eval Harness Should Evaluate

The eval harness should cover at least four layers.

## 1. Rule Validity Evaluation

This checks whether the generated proposal is structurally valid.

### Example checks

- only present participants are assigned
- each present participant has a valid session role
- no participant is assigned twice
- every BP room has exactly `8` speakers
- every room has exactly `4` teams of `2`
- BP positions are valid
- each room has at least `1` adjudicator
- each room has exactly `1` chair
- leftovers are handled correctly
- strict session constraints are respected

### Why This Layer Matters

A proposal that fails hard rules should be considered invalid regardless of how good its soft score looks.

## 2. Quality Metric Evaluation

This checks whether a valid proposal is good according to the intended soft objectives.

### Example quality dimensions

- room balance quality
- team quality
- partner repetition avoidance
- BP position repetition avoidance
- internal speaking role repetition avoidance
- motion-type fit
- pair compatibility quality
- experience balance
- adjudicator quality distribution
- chair suitability

### Why This Layer Matters

The engine is not only meant to be valid. It is meant to be useful and high quality.

## 3. Objective-Mode Evaluation

This checks whether `DEVELOPMENT`, `BALANCED`, and `COMPETITIVE` genuinely behave differently in the intended way.

### What To Test

#### `DEVELOPMENT`

Should show:

- more role rotation
- more partner exploration
- more exposure to weaker or less-practiced areas
- acceptable fairness without excessive stacking

#### `BALANCED`

Should show:

- moderate room fairness
- moderate experimentation
- moderate repetition control

#### `COMPETITIVE`

Should show:

- stronger team quality
- stronger proven partnerships
- stronger motion fit
- stronger chair allocation
- less forced experimentation

### Why This Layer Matters

If all three objectives produce almost the same kind of output, then the objective system is not actually working.

## 4. Regression Evaluation

This checks whether a new engine version is worse than a previous one.

### What It Compares

- old weights vs new weights
- old formulas vs new formulas
- pre-tuning vs post-tuning behavior
- one engine version vs another

### Why This Layer Matters

The engine will evolve. We need a way to detect silent quality drops.

## 5. Historical Replay Evaluation

This is one of the most important evaluation modes.

### Core Idea

Take historical session snapshots and replay the engine on them as if the engine had to generate those sessions today.

### Inputs

- participants present in that historical session
- assigned speaker/adjudicator roles
- motion type
- motion
- session-only constraints if available
- relevant metric history up to that point in time

### What We Compare

- proposal validity
- proposal score
- admin pairing rating if available
- actual post-session outcomes
- room balance quality
- whether the engine would have produced a better or worse proposal than before

### Why This Layer Matters

This lets us test the engine on realistic data rather than only synthetic examples.

## Input Dataset Format

The eval harness should support at least two input styles.

## 1. Historical Replay Dataset

This is based on real session snapshots.

### Each replay record should include

- `session_id`
- `session_date`
- `participants_present`
- `session_roles`
- `motion_type`
- `motion`
- `pairing_objective`
- `session_constraints`
- `historical_metric_snapshot`
- `actual_generated_pairing_if_available`
- `admin_pairing_rating_if_available`
- `actual_post_session_outcomes_if_available`

## 2. Synthetic Scenario Dataset

This is manually designed test data used to force special cases.

### Example synthetic scenarios

- exactly `8` speakers and `1` adjudicator
- `10` speakers with `2` leftovers
- highly imbalanced speaker pool
- strong pair that keeps repeating
- many first-years and few seniors
- no trustworthy motion-type data
- conflicting session-only constraints
- multiple strong chairs and one difficult room

### Why Synthetic Data Matters

Historical data will not cover every edge case we care about.

## Evaluation Metrics

The eval harness should calculate a structured evaluation report rather than one generic score.

## Rule Validity Metrics

### `valid_proposal_rate`

```text
valid_proposal_rate = valid_proposals / total_generated_proposals
```

Threshold:

- `PASS` if `1.00`
- `WARN` if `>= 0.98`
- `FAIL` if `< 0.98`

V1 stricter rule:

- any invalid proposal in eval should be treated as `FAIL`

### `duplicate_assignment_errors`

```text
duplicate_assignment_errors = total_duplicate_assignments
```

Threshold:

- `PASS` if `0`
- `FAIL` if `> 0`

### `invalid_room_count_errors`

```text
invalid_room_count_errors = count(proposals where room structure invalid)
```

Threshold:

- `PASS` if `0`
- `FAIL` if `> 0`

### `invalid_team_structure_errors`

```text
invalid_team_structure_errors = count(rooms not having 4 teams of 2)
```

Threshold:

- `PASS` if `0`
- `FAIL` if `> 0`

### `invalid_chair_assignment_errors`

```text
invalid_chair_assignment_errors = count(rooms with chair_count != 1)
```

Threshold:

- `PASS` if `0`
- `FAIL` if `> 0`

### `strict_constraint_violation_count`

```text
strict_constraint_violation_count = total_strict_constraints_broken
```

Threshold:

- `PASS` if `0`
- `FAIL` if `> 0`

### `leftover_handling_correctness`

```text
leftover_handling_correctness =
  correctly_handled_leftover_cases / total_leftover_cases
```

Threshold:

- `PASS` if `1.00`
- `WARN` if `>= 0.98`
- `FAIL` if `< 0.98`

## Quality Metrics

### `average_room_balance_score`

```text
average_room_balance_score =
  sum(room_balance_score across evaluated proposals) / proposal_count
```

Threshold:

- `PASS` if `>= 0.80`
- `WARN` if `0.70 - 0.79`
- `FAIL` if `< 0.70`

### `room_strength_spread`

```text
room_strength_spread =
  average(max_room_strength - min_room_strength per proposal)
```

Threshold:

- `PASS` if `<= 0.12`
- `WARN` if `0.13 - 0.20`
- `FAIL` if `> 0.20`

### `repeat_partner_rate`

```text
repeat_partner_rate =
  repeated_pair_assignments / total_pair_assignments
```

Threshold:

- `PASS` if `<= 0.20`
- `WARN` if `0.21 - 0.30`
- `FAIL` if `> 0.30`

### `bp_position_repetition_rate`

```text
bp_position_repetition_rate =
  repeated_bp_position_assignments / total_bp_position_assignments
```

Threshold:

- `PASS` if `<= 0.35`
- `WARN` if `0.36 - 0.50`
- `FAIL` if `> 0.50`

### `internal_role_repetition_rate`

```text
internal_role_repetition_rate =
  repeated_internal_role_assignments / total_internal_role_assignments
```

Threshold:

- `PASS` if `<= 0.30`
- `WARN` if `0.31 - 0.45`
- `FAIL` if `> 0.45`

### `chair_assignment_quality_score`

```text
chair_assignment_quality_score =
  average(chair_assignment_score of assigned chairs)
```

Threshold:

- `PASS` if `>= 0.75`
- `WARN` if `0.65 - 0.74`
- `FAIL` if `< 0.65`

### `chair_room_alignment_score`

```text
chair_room_alignment_score =
  correlation(room_difficulty, assigned_chair_strength)
```

Threshold:

- `PASS` if `>= 0.60`
- `WARN` if `0.40 - 0.59`
- `FAIL` if `< 0.40`

## Objective-Mode Metrics

### `development_rotation_score`

```text
development_rotation_score =
  normalized(
    bp_position_diversity +
    internal_role_diversity +
    new_pair_exposure
  ) / 3
```

Threshold:

- `PASS` if `DEVELOPMENT > BALANCED > COMPETITIVE`
- `WARN` if `DEVELOPMENT >= BALANCED` but close
- `FAIL` if `DEVELOPMENT <= BALANCED`

### `competitive_strength_score`

```text
competitive_strength_score =
  average(team_quality_aggregate in COMPETITIVE mode)
```

Threshold:

- `PASS` if `COMPETITIVE > BALANCED > DEVELOPMENT`
- `WARN` if `COMPETITIVE >= BALANCED`
- `FAIL` if `COMPETITIVE < BALANCED`

### `balanced_tradeoff_score`

```text
balanced_tradeoff_score =
  0.5 * normalized_team_quality +
  0.5 * normalized_rotation_quality
```

Threshold:

- `PASS` if `BALANCED` lies between `DEVELOPMENT` and `COMPETITIVE` on both axes
- `WARN` if only partially true
- `FAIL` if `BALANCED` collapses into one of the extremes

## Feedback Alignment Metrics

### `admin_rating_alignment`

```text
admin_rating_alignment =
  correlation(engine_proposal_score, admin_pairing_rating)
```

Threshold:

- `PASS` if `>= 0.60`
- `WARN` if `0.40 - 0.59`
- `FAIL` if `< 0.40`

### `post_session_outcome_alignment`

```text
post_session_outcome_alignment =
  correlation(engine_team_quality_prediction, actual_team_outcomes)
```

Threshold:

- `PASS` if `>= 0.55`
- `WARN` if `0.35 - 0.54`
- `FAIL` if `< 0.35`

### `chair_feedback_alignment`

```text
chair_feedback_alignment =
  correlation(predicted_chair_quality, actual_speaker_chair_feedback)
```

Threshold:

- `PASS` if `>= 0.50`
- `WARN` if `0.30 - 0.49`
- `FAIL` if `< 0.30`

## Regression Metrics

### `quality_delta`

```text
quality_delta =
  candidate_average_quality_score - baseline_average_quality_score
```

Threshold:

- `PASS` if `>= +0.02`
- `WARN` if `-0.01 to +0.01`
- `FAIL` if `< -0.01`

### `validity_delta`

```text
validity_delta =
  candidate_valid_proposal_rate - baseline_valid_proposal_rate
```

Threshold:

- `PASS` if `= 0`
- `FAIL` if `< 0`

### `stability_delta`

```text
stability_delta =
  candidate_score_variance_across_runs - baseline_score_variance_across_runs
```

Threshold:

- `PASS` if `<= +0.03`
- `WARN` if `+0.04 to +0.06`
- `FAIL` if `> +0.06`

## Tuning Safety Metrics

### `tuning_adjustment_magnitude`

```text
tuning_adjustment_magnitude =
  max(abs(metric_adjustment_i))
```

Threshold:

- `PASS` if `<= 0.01` per cycle
- `WARN` if `0.011 - 0.02`
- `FAIL` if `> 0.02`

### `metric_drift_alert`

```text
metric_drift_alert = count(metrics where total_adjustment > 0.03)
```

Threshold:

- `PASS` if `0`
- `FAIL` if `> 0`

### `post_tuning_quality_delta`

```text
post_tuning_quality_delta =
  tuned_engine_quality - pre_tuning_engine_quality
```

Threshold:

- `PASS` if `>= 0`
- `WARN` if slight mixed movement but no validity loss
- `FAIL` if `< 0` consistently

## Master Eval Decision Rule

### `FAIL`

The overall eval result should be `FAIL` if any of these happen:

- any hard validity metric fails
- validity gets worse than baseline
- strict constraints are violated
- chair assignment structure breaks
- leftover handling breaks
- tuning exceeds safe bounds

### `WARN`

The overall eval result should be `WARN` if:

- hard validity is fine
- but one or more soft metrics degrade modestly
- or alignment metrics are weak
- or objective-mode separation is unclear

### `PASS`

The overall eval result should be `PASS` if:

- all hard checks pass
- quality is at least baseline
- no dangerous drift appears
- objective modes behave as intended

## Recommended V1 Scorecard

For V1, these should be the primary summary scoreboard:

- `valid_proposal_rate`
- `average_room_balance_score`
- `repeat_partner_rate`
- `internal_role_repetition_rate`
- `chair_assignment_quality_score`
- `admin_rating_alignment`
- `post_session_outcome_alignment`
- `quality_delta`

## Evaluation Output Format

The eval harness should produce a structured report.

### Minimum report sections

- engine version
- rule validity summary
- soft quality summary
- objective-mode summary
- regression comparison summary
- tuning safety summary
- scenario-by-scenario failures
- recommendation

## Example Recommendation Types

- `safe_to_keep`
- `safe_but_needs_review`
- `regression_detected`
- `invalid_configuration`
- `insufficient_data`

## Offline Replay Flow

This should be the main first implementation of the eval harness.

### Flow

1. load historical or synthetic test scenarios
2. load engine configuration and metric snapshot
3. run pairing generation repeatedly if needed because the engine is probabilistic
4. collect generated proposals and internal scores
5. compute eval metrics
6. compare against baseline engine version or previous weight set
7. produce evaluation report

## Why Repeated Runs Matter

Because the engine is probabilistic, one run is not enough.

The harness should support repeated execution per scenario.

### Example

```text
runs_per_scenario = 25
```

This helps answer:

- average behavior
- variance of output quality
- whether one change increases instability

## Baseline Comparison Strategy

The eval harness should compare candidate engine versions against a baseline.

### Possible baselines

- current production rules
- previous approved rule set
- previous metric weight snapshot
- previous tuning state

### Why This Matters

A new version should not be accepted only because it looks different. It should outperform or at least safely match the baseline.

## How The Eval Harness Helps Tuning Safely

The periodic tuning system should not change weights blindly.

Before applying or approving a tuning change, the eval harness should test:

- whether validity remains stable
- whether room balance improves or worsens
- whether repetition gets better or worse
- whether objective behavior still matches intent
- whether admin-rating alignment improves

This makes tuning review-driven rather than guess-driven.

## Recommended Use In The Project

The eval harness should be used in three ways.

## 1. Formula Review

When we change formulas such as:

- `speaker_strength`
- `room_balance_score`
- `proposal_score`

we should run the eval harness before accepting the change.

## 2. Weight Review

When we change base weights or learned adjustments, we should run the eval harness to compare old and new behavior.

## 3. Tuning Review

After every tuning window such as `6-7` sessions, the proposed adjustments should be evaluated through the harness before being accepted.

## Future Extensions

Later, the eval harness can be expanded to support:

- CI checks for engine changes
- automated regression gates
- admin-labeled gold scenario sets
- fairness dashboards
- visualization of proposal variance across repeated probabilistic runs

## What Is Still Open For The Eval Harness

The eval harness concept is strong, but some details still need finalization.

### Still open

- exact final eval metric formulas for secondary metrics not yet mathematically frozen elsewhere
- exact pass/fail thresholds may be refined after observing real data distribution
- how many repeated runs per scenario are required beyond the initial recommendation
- whether admin-rated gold examples will exist
- whether tuning approval is manual-only in V1

## Recommended V1 Scope

The safest first version of the eval harness should include:

- offline replay mode
- synthetic edge-case scenarios
- rule-validity checks
- room-balance and repetition quality checks
- baseline comparison
- repeated probabilistic runs
- report generation

This is enough to make engine evolution much safer.

## Summary

The eval harness is not optional if we want the pairing engine to be adaptive and tunable safely.

It should serve as:

- a validator
- a quality judge
- a regression detector
- a tuning safety system

The engine generates proposals.
The eval harness tells us whether those proposals and engine changes are actually getting better.
