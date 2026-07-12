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

## 2. Confidence Targets

We have the confidence formula, but the exact target counts still need final sign-off.

What still needs final confirmation:

- motion-type speaker target count
- pair-by-motion target count
- role-score target count
- motion-type-by-role target count
- chair-score target count

## 3. Admin Proposal Rating Shape

We have agreed that proposal rating should exist.

What still needs final confirmation:

- is rating score-only enough for V1
- are issue tags optional or required
- are free-text notes optional or required

## 4. Post-Session Form Final Shape — RESOLVED

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

## 5. Eval Threshold Final Freeze

We now have proposed eval formulas and thresholds.

What still needs final confirmation:

- do we accept the current pass/warn/fail thresholds as the V1 standard
- do we want to relax any threshold until real data distribution is observed
- how many repeated runs per scenario should be required in V1

## 6. Cleanup Scope Confirmation - RESOLVED

Phase 12 cleanup keeps historical readability and retires legacy surfaces behind explicit `410 Gone`
responses instead of destructive route deletion. The confirmed retired surfaces are anonymous
feedback, task assignment, attendance-linked manual pairing/attendance endpoints, old
non-proposal session/admin endpoints, and the old aggregate leaderboard route.

Schema retirement is limited to the unused anonymous feedback and task tables already removed from
the active Prisma schema by the backend cleanup migration. Other historical session, attendance,
score, and pairing data remains readable through the replacement pairing-system flows.

## 7. Progress Verdict Thresholds

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

- the remaining tunable items are no longer Phase 0 blockers; accepted V1 formula choices now live in `docs/09-metric-formulas.md` and `docs/08-pre-coding-decisions.md`



