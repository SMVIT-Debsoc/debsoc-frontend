# Pairing Engine Flow

## Purpose

This document explains how the pairing engine is expected to work from input collection to final publication and historical learning.

It focuses on the engine flow itself rather than on UI details.

## High-Level Flow

The overall engine lifecycle currently looks like this:

1. cabinet or president prepares session participants
2. session-specific information is entered
3. engine loads historical and metric data
4. engine builds valid candidate arrangements
5. engine scores candidates
6. engine selects one proposal from the top band probabilistically
7. cabinet or president reviews the proposal
8. approved proposal is published
9. post-session scoring and proposal feedback update future engine inputs

## 1. Session Preparation

The engine begins from a prepared session pool, not from the full user base.

### Preparation includes

- admin marks present people
- each present person is assigned a session role
- roles currently expected:
  - speaker
  - adjudicator

## 2. Session-Specific Input Stage

Before generation, the admin supplies the live information relevant to that session.

### Current inputs discussed

- motion type
- motion
- time constraints
- event team-up preference
- pairing objective: `DEVELOPMENT`, `BALANCED`, `COMPETITIVE`

These inputs affect the current generation cycle only.

## 3. Data Loading Stage

The engine must combine multiple kinds of information.

### Persistent data

- attendance history
- previous pairings
- speaker performance history
- motion-type-specific speaker history
- role-specific performance history
- pair compatibility history
- adjudicator history
- chair history
- leaderboard data
- session history
- metric definitions and learned adjustments stored in the database

### Session-time data

- current present participants
- current speaker or adjudicator split
- current motion type
- current motion
- current one-session conditions

## 4. Pool Construction Stage

After loading data, the engine divides participants into working pools.

### Typical pools

- speaker pool
- adjudicator pool
- chair candidate pool

## 5. Feasibility And Validity Checks

Before generating pairings, the engine confirms the session can produce a valid output.

### Example checks

- enough speakers exist to form full rooms
- enough adjudicators exist to cover the rooms
- no user is duplicated in conflicting roles
- only valid available participants are included
- strict session-only rules can be satisfied

If the session fails feasibility, the engine should return a useful failure state rather than forcing an invalid proposal.

## 6. Room Count Determination

Room count should be decided from full valid BP rooms.

### Default rule

```text
room_count = floor(number_of_speakers / 8)
leftover_speakers = number_of_speakers % 8
```

### Current assumption

- each room has `8` speakers
- each room has at least `1` adjudicator
- leftover speakers are marked `UNASSIGNED` by default rather than silently dropped

## 7. Metric Loading And Activation

The engine determines which metrics are active for this generation cycle.

Each metric is expected to carry information such as:

- what it measures
- whether it affects speakers, adjudicators, chair allocation, or rooms
- what base weight it has
- what learned adjustment it has
- whether it behaves like a hard or soft rule
- whether it is historical or session-specific

## 8. Candidate Generation

At this stage the engine begins to build many possible arrangements.

### This may involve

- creating candidate speaker teams
- assigning broad BP positions
- assigning exact speaking roles
- grouping teams into rooms
- assigning adjudicators to rooms
- selecting chairs where needed

The engine should not assume the first valid arrangement is the best arrangement.

## 9. Candidate Scoring

Each valid candidate arrangement receives a score.

### Candidate quality reflects

- speaker strength
- motion-type suitability
- pair compatibility
- repetition penalties
- room fairness
- adjudicator quality
- chair suitability
- session-specific special constraints
- active pairing objective

## 10. Confidence And Fallback Handling

Highly specific metrics should not be trusted fully when data is sparse.

### Engine behavior

- broader metrics dominate early
- specific metrics gain more influence as observations grow
- specific metrics blend into fallback metrics through confidence weighting

## 11. Final Proposal Selection

After candidates are scored, the engine should not always choose the single top candidate.

### Current direction

1. score all valid proposals
2. keep the top `5` strongest proposals
3. convert those scores into weighted probabilities
4. select one proposal probabilistically from the top band

This creates exploration without allowing low-quality randomness.

## 12. Proposal Persistence

The chosen arrangement should be stored as a proposal rather than as immediately public truth.

The proposal should include:

- room structure
- speaker assignments
- adjudicator assignments
- chair assignments
- motion linkage
- generation context
- score summary
- reviewable state

## 13. Admin Review Layer

Admin review is a first-class stage of the engine flow.

Only cabinet and president users should be allowed to review, approve, override, regenerate, rate, or publish a proposal.

### Expected actions

- approve
- override
- regenerate
- optionally rate the proposal quality

The engine acts as a proposal generator, not an unchecked publisher.

## 14. Publish Transition

Once approved, the proposal becomes the official pairing.

At that point:

- pairing becomes visible to users
- attendance is finalized
- room assignments become official
- unassigned leftovers are visible
- session state advances

## 16. Post-Session Learning Loop

After the session:

- speakers submit relevant scoring inputs
- speakers rate the chair where applicable
- chairs submit adjudicator scoring
- leaderboard values update
- pair and role histories expand
- admin proposal rating is preserved

This post-session data becomes future input for later engine runs.

## 17. Periodic Tuning Loop

The engine should not retune after every single session.

### Current direction

- collect a small batch such as `6-7` sessions
- compare proposal quality signals with actual outcomes
- apply only bounded weight adjustments
- keep changes auditable and small

## 18. Under The Hood Summary

The engine can be thought of as this pipeline:

`prepared participants -> session inputs -> historical data -> metric activation -> candidate generation -> scoring -> top-band probabilistic selection -> proposal -> admin review -> publish -> post-session learning -> periodic tuning`

## Design Intent

The intended engine is:

- configurable
- metric-driven
- probabilistic
- reviewable
- improvable over time
