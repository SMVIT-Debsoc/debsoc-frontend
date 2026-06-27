# Open Questions

## Purpose

This document now acts as a narrow decision tracker.

It should contain only the genuinely unresolved items that still matter before implementation or before we trust the engine behavior as fully locked.

It should not repeat decisions that are already covered elsewhere in the docs set.

## 1. Final Formula Acceptance

We now have a mix of finalized-enough and proposed-V1 formulas for the key engine calculations.

What still needs final confirmation:

- do we accept the current `speaker_strength` formula as-is
- do we accept the current `room_balance_score` formula as-is

What is already treated as implementation-ready by the authoritative formula doc:

- `chair_assignment_score` is `FINALIZED ENOUGH`
- the fallback-confidence stack (`confidence`, `effective_metric`) is `FINALIZED ENOUGH`

## 2. Secondary Formula Locking

The main engine formulas are in place, but some deeper sub-formulas are still not fully frozen.

What still needs final confirmation:

- exact `consistency_score` formula
- exact `experience_index` formula
- exact `team_quality_aggregate` formula
- exact full `proposal_score` equation
- exact `pair_dynamics` aggregation formula
- exact `role_score` aggregation formula
- exact tuning-adjustment formula

## 3. Confidence Targets

We have the confidence formula, but the exact target counts still need final sign-off.

What still needs final confirmation:

- motion-type speaker target count
- pair-by-motion target count
- role-score target count
- motion-type-by-role target count
- chair-score target count

## 4. Proposal Selection Distribution

We have agreed on top-band probabilistic selection for V1, but may refine it later.

What still needs final confirmation:

- whether top band size remains `5` beyond V1
- whether the current `30/24/18/15/13` probability shape remains unchanged beyond V1
- do we want fixed-by-rank probabilities or score-gap-aware probabilities later

## 5. Admin Proposal Rating Shape

We have agreed that proposal rating should exist.

What still needs final confirmation:

- is rating score-only enough for V1
- are issue tags optional or required
- are free-text notes optional or required

## 6. Post-Session Form Final Shape — RESOLVED

Locked (Gate 4):

- speaker form: `chairScore` 0–10 (required) + `teamDynamicsRating` 0–10 (optional) + notes
  (optional). Speakers do NOT enter their own raw speaker score.
- chair form: `adjudicatorScores[]` (0–10 per panel adjudicator) + `speakerScores[]` (chair enters
  raw speaker scores for the room, with bpPosition/speakingRole/teamResultPoints).
- non-chair adjudicators submit nothing.
- raw speaker score is entered by the chair (resolves "who enters the raw speaker score").
- the optional team-dynamics rating is a secondary signal; `partner_dynamics_*` stays
  results-based.

Authoritative detail now lives in `docs/14 §4` and `docs/02 §6`.

Also decided:

- chair scoring stays ONE route (`/api/scoring/chair`) carrying both arrays, with two separate UI
  sections/screens (one endpoint + separate UI = better UX than two endpoints).
- the optional `teamDynamicsRating` is stored in its own `TeamDynamicsRating` record alongside the
  partner-dynamics data, NOT on `ChairFeedbackRecord`. Secondary signal; partner dynamics stays
  results-based.

Minor detail still tunable (not a blocker): the numeric range of the raw speaker score.

## 7. Tuning Governance

We have agreed on periodic tuning after about `6-7` sessions.

What still needs final confirmation:

- is tuning review-assisted only in V1
- can any bounded adjustment be auto-applied in V1
- who approves tuning suggestions if manual review is required

## 8. Eval Threshold Final Freeze

We now have proposed eval formulas and thresholds.

What still needs final confirmation:

- do we accept the current pass/warn/fail thresholds as the V1 standard
- do we want to relax any threshold until real data distribution is observed
- how many repeated runs per scenario should be required in V1

## 9. Cleanup Scope Confirmation

We know some old features will be reduced or removed.

What still needs final confirmation:

- exact routes to deprecate
- exact schema remnants to retire
- whether old data is archived, migrated, or ignored

## 10. Progress Verdict Thresholds

The member-progress verdict layer (`docs/14 §7`, `docs/17 §3b`) synthesizes statements like "strong
in IR, weak in Feminism" from the metrics. The interpretation rules are agreed; the exact thresholds
are tunable and not blockers:

- what gap above/below baseline counts as "strong" vs "weak" (and baseline = own history vs cohort)
- minimum observation count before a verdict is asserted vs shown as "needs more data"
- partner_dynamics cutoffs for "pairs well" vs "friction"

## Summary

This file should now remain short.

As each item above gets locked, it should be removed from this document and reflected only in the more detailed source-of-truth docs.

Important implementation note:

- the `Fo10` formula set remains open and blocks Phase 6 of `docs/16-build-plan.md`
