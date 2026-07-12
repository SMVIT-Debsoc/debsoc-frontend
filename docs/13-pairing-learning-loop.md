# Pairing System Learning Loop

## Purpose

This document explains how the pairing system becomes better over time after each use.

This is important because the system is not a static rule engine.
It is designed to improve gradually as:

- more session data is collected
- more pairing outcomes are observed
- more role and motion data becomes available
- more admin proposal reviews are stored
- more tuning windows are completed

This learning loop affects:

- backend design
- database design
- metric calculation
- eval harness design
- tuning workflow
- service boundaries

So it deserves its own reference.

## Core Idea

The pairing engine should improve through repeated evidence, not through one-shot guessing.

That means the system should:

- trust broad metrics first
- trust specific metrics more as observations increase
- preserve every session as learning data
- use both pre-session and post-session signals
- adjust behavior only slowly and in bounded ways

This is not a literal transformer training system.
It is an adaptive, confidence-weighted, feedback-tuned engine.

## The Full Learning Cycle

The intended learning cycle is:

1. prepare session inputs
2. generate pairing proposal
3. admin reviews and possibly rates proposal
4. publish approved proposal
5. run session
6. collect post-session scoring and outcomes
7. update historical metric records
8. increase confidence where more evidence now exists
9. periodically review a small session batch
10. suggest or apply bounded tuning changes
11. use the updated state in the next generation cycle

This is the loop that makes the engine better after repeated use.

## What The System Learns From Each Session

After each session, the system should learn from multiple kinds of evidence.

## 1. Participation Evidence

The session tells the system:

- who was present
- who spoke
- who adjudicated
- who chaired
- who was left unassigned

This matters because history is role-specific and session-specific.

## 2. Assignment Evidence

The session tells the system:

- who was paired with whom
- which BP position each team received
- which exact speaking role each speaker received
- which adjudicators were placed in which rooms
- which adjudicator was the chair

This becomes future history for repetition control and specialization analysis.

## 3. Outcome Evidence

The session tells the system:

- raw speaker scores
- BP result points such as `3/2/1/0`
- chair feedback from speakers
- adjudicator ratings from the chair

This is one of the most important learning layers because it converts assignments into usable performance signals.

## 4. Proposal-Quality Evidence

Before and around approval, the system can also learn from admin review.

This includes:

- proposal approval
- proposal override
- proposal regeneration
- proposal rating
- issue tags
- optional admin notes

This matters because the system should not only learn from debate outcomes. It should also learn whether a generated proposal looked sensible in the first place.

## What Metrics Improve After Each Session

The engine should update several learned metrics after every completed session.

## Speaker-Side Metrics

These should improve after each relevant speaking session:

- `speaker_total_score`
- `speaker_motion_type_score`
- `speaker_strength`
- `role_score`
- `motion_type_x_role_score`
- `bp_position_history`
- `internal_speaking_role_history`

## Pairing-Side Metrics

These should improve after each relevant team assignment:

- `partner_dynamics_overall`
- `partner_dynamics_by_motion_type`
- `repeat_partner_penalty`

## Adjudication-Side Metrics

These should improve after adjudication usage:

- `adjudicator_average_score`
- `chair_score`
- adjudicator history counts
- chair confidence counts

## Why Confidence Matters In Learning

The system should not learn all metrics equally fast.

Some metrics are broad and become useful quickly.
Some metrics are very specific and need more data.

Examples:

- `speaker_total_score` becomes useful relatively early
- `speaker_motion_type_score` needs more motion-specific observations
- `role_score` needs enough role-specific appearances
- `motion_type_x_role_score` needs even more specific evidence
- `partner_dynamics_by_motion_type` needs repeated pair observations in the same motion type

That is why the system uses confidence-weighted fallback rather than trusting specific metrics too early.

## Confidence Growth Over Time

The current design direction is:

```text
confidence = min(observation_count / target_count, 1.0)
```

As a member or pair gets more observations:

- confidence increases
- fallback reliance decreases
- specific metric influence increases

This is the main mechanism through which the system becomes more nuanced over time.

## Example Of Learning Over Sessions

Imagine a speaker `A` with very little history.

Early sessions:

- engine mostly trusts `speaker_total_score`
- role-specific and motion-specific signals are weak

After several `IR` sessions as `PM`:

- `speaker_motion_type_score` for `IR` becomes more useful
- `role_score` for `PM` becomes more useful
- `motion_type_x_role_score` for `IR:PM` becomes partially trustworthy

So the engine no longer treats `A` as only a generic speaker. It starts to understand `A` in more specific contexts.

## How Pair Learning Improves

The same principle applies to partner metrics.

Early on:

- the engine knows little about whether `A + B` are actually good together

After repeated pairings:

- the engine observes BP result points together
- the engine observes combined score outcomes
- the engine observes whether they perform well only generally or also in specific motion types

That is how:

- `partner_dynamics_overall`
- `partner_dynamics_by_motion_type`

become stronger over time.

## How Proposal Review Helps Learning

Admin proposal rating is a different kind of learning signal.

It tells the system:

- this proposal looked well balanced
- this proposal looked repetitive
- this proposal had weak chair allocation
- this proposal did not match development goals

This is useful because a debate outcome can be noisy.
A proposal may be well-designed but still produce mixed scores because of debate performance variation.

So the system should learn from both:

- proposal-quality feedback
- post-session outcome feedback

## How Tuning Happens After Multiple Sessions

The system should not change weights after every single session.

Instead, it should collect a small evidence window such as:

- `6-7` sessions

Then review:

- proposal scores
- admin proposal ratings
- raw speaker outcomes
- BP result points
- chair feedback
- adjudicator scores
- objective-mode context
- repetition patterns

Only after that should it suggest or apply small bounded changes.

## Why Batch Tuning Is Better

One session can be noisy.
A small batch is more reliable.

Batch tuning helps answer:

- was a metric actually predictive
- was a weight too strong or too weak
- did the engine over-prioritize one factor
- did a recent tuning step improve or worsen results

This is much safer than reacting instantly to one bad session.

## What Actually Changes During Tuning

The current design is not full model retraining.
It is bounded metric adjustment.

The main formula is:

```text
effective_weight = base_weight + learned_adjustment
```

Where:

- `base_weight` stays stable unless humans deliberately change it
- `learned_adjustment` changes slowly from evidence
- total adjustment stays bounded

Current recommended bound:

```text
max_total_learned_adjustment_per_metric = +/- 0.03
```

So the system improves, but does not become chaotic.

## What Must Be Stored For Learning To Work

The learning design affects data modeling directly.

The system must store:

- session participation history
- role assignment history
- team and room assignment records
- raw speaker scores
- BP result points
- chair feedback
- adjudicator scores
- proposal scores
- proposal review actions
- admin proposal ratings
- metric snapshots or derivable metric history
- learned adjustments
- tuning review history

If this data is not stored cleanly, the system cannot improve properly.

## How This Affects Coding Design

Because the system improves after each use, the backend should not be designed as one monolithic pairing function.

We need separate modules for:

- generation
- scoring
- metric updates
- proposal review
- tuning review
- eval replay

This is one reason the architecture split into:

- `lib/server/pairing`
- `lib/server/scoring`
- `lib/server/eval`
- `lib/server/repositories`

is important.

## Why Eval Harness Is Part Of The Learning Loop

The eval harness is not separate from learning conceptually.
It is the safety layer around learning.

When formulas or weights change, the eval harness should check:

- validity
- room balance
- repetition control
- objective behavior
- admin-rating alignment
- outcome alignment

Without that, the system might "learn" in the wrong direction.

## Safe Learning Principles

The current intended safe-learning rules are:

- never break hard rules
- never auto-publish without review
- never trust specific metrics too early
- never tune from one session only
- never allow large automatic weight jumps
- always keep review and tuning auditable
- always evaluate changes against a baseline

These rules should influence both implementation and product behavior.

## What The System Is Not Doing

To avoid confusion, the system is not:

- training a large language model
- doing gradient descent over raw text
- replacing human review
- instantly rewriting its own entire logic

What it is doing is:

- storing repeated structured evidence
- increasing trust in metrics as data grows
- comparing predicted quality with observed quality
- adjusting small tunable weights over time

## Non-LLM Learning Decision

The primary learning loop MUST work without an LLM. Structured session evidence is sufficient for
the engine to become more accurate when it is collected consistently, evaluated across multiple
sessions, and used only through bounded review-assisted tuning.

The primary inputs are:

- BP result points and raw speaker scores
- chair feedback and adjudicator scores
- optional team-dynamics ratings
- proposal approval, override, and regeneration actions
- numeric proposal ratings and structured issue tags
- assignment, repetition, role, motion, and participation history

Verdicts and performance outcomes update participant, pair, role, motion, and adjudication metrics.
They MUST NOT be treated as direct proof that the generated pairing itself was good or bad: debate
outcomes are noisy and can be affected by individual performance, motion fit, and room conditions.
Proposal-quality evidence such as admin ratings, issue tags, overrides, and regenerations remains a
separate tuning signal.

The non-LLM improvement path is:

1. store raw structured evidence as the source of truth;
2. update recomputable learned metrics and observation confidence after completed sessions;
3. aggregate evidence over the documented multi-session tuning window;
4. compare predicted proposal quality with admin review and observed outcomes;
5. produce small bounded tuning suggestions;
6. validate suggestions against historical and synthetic replay baselines; and
7. require human review before applying any adjustment.

An LLM is not required for this path and MUST NOT directly change weights, formulas, hard rules, or
published pairings. A future LLM may be introduced only as an optional semantic extraction layer for
free-text notes. If introduced, it must map text into a predefined structured taxonomy, preserve the
original text, record extraction confidence and version, support human correction, and remain
auditable. Low-confidence or unreviewed extracted signals must not influence tuning.

Any semantic taxonomy, derived semantic metric, or use of extracted feedback in a formula requires
an explicit documented specification before implementation. It must also pass the same replay,
regression, review, and rollback controls as every other tuning change.

## Learning Stages Across Product Maturity

## Early Stage

The system has low confidence and should rely more on broad metrics.

Characteristics:

- more fallback usage
- low trust in highly specific scores
- more conservative metric behavior

## Middle Stage

The system has enough history to begin distinguishing:

- motion-type performance
- role performance
- pair compatibility
- chair quality with more confidence

Characteristics:

- more nuanced pairings
- better objective-mode separation
- more useful replay evaluation

## Mature Stage

The system has enough data to use more specific signals confidently.

Characteristics:

- stronger role-motion understanding
- stronger partner pattern recognition
- better tuning suggestions
- better admin-rating alignment

## Recommended Coding Consequence

Because the system is designed to improve after each use, implementation should preserve three distinct layers:

1. `Runtime generation layer`
2. `Post-session metric update layer`
3. `Periodic tuning and evaluation layer`

If these are mixed together, the system will become hard to maintain and hard to trust.

## Summary

The pairing system becomes better after each use through a structured learning loop:

- generate proposal
- review proposal
- run session
- collect outcomes
- update learned metrics
- increase confidence where evidence grows
- periodically review batches
- tune in bounded ways
- evaluate before trusting changes

This learning loop is not just a feature detail.
It affects the entire backend design, data model, and implementation structure.
