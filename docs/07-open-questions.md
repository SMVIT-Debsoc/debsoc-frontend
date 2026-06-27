# Open Questions

## Purpose

This document now acts as a narrow decision tracker.

It should contain only the genuinely unresolved items that still matter before implementation or before we trust the engine behavior as fully locked.

It should not repeat decisions that are already covered elsewhere in the docs set.

## 1. Final Formula Acceptance

We now have proposed V1 formulas for the key engine calculations.

What still needs final confirmation:

- do we accept the current `speaker_strength` formula as-is
- do we accept the current `room_balance_score` formula as-is
- do we accept the current `chair_assignment_score` formula as-is
- do we accept the current fallback-confidence formula as-is

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

We have agreed on top-band probabilistic selection.

What still needs final confirmation:

- do we lock top band size at `5`
- do we keep the current `30/24/18/15/13` probability shape
- do we want fixed-by-rank probabilities or score-gap-aware probabilities later

## 5. Admin Proposal Rating Shape

We have agreed that proposal rating should exist.

What still needs final confirmation:

- is rating score-only enough for V1
- are issue tags optional or required
- are free-text notes optional or required

## 6. Post-Session Form Final Shape

We have the role-routing direction, but the exact form payloads still need final lock.

What still needs final confirmation:

- exact speaker submission fields
- exact chair submission fields
- whether teammate-related feedback fields are fully optional
- whether any issue taxonomy is mandatory for future learning

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

## Summary

This file should now remain short.

As each item above gets locked, it should be removed from this document and reflected only in the more detailed source-of-truth docs.
