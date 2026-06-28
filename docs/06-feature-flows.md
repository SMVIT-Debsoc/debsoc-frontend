# Feature Flows

## Purpose

This document explains the product flow across the major areas affected by the debate pairing system. It focuses on how the whole experience fits together rather than on backend implementation details alone.

## 1. Attendance Flow

The attendance flow becomes the starting point of pairing generation.

### Intended flow

- cabinet or president opens the session preparation area
- cabinet or president marks present participants
- cabinet or president chooses whether each present participant is:
  - speaker
  - adjudicator

### Important changes from the old system

- attendance no longer handles manual pairing logic
- attendance no longer carries speaker scoring
- attendance no longer owns motion input

## 2. Session Setup Flow

After attendance preparation, session setup continues with session-specific inputs.

### Inputs currently discussed

- motion type
- motion
- time constraints
- event team-up preference
- pairing objective

These inputs are used by the pairing engine only for the current generation cycle.

## 3. Pairing Generation Flow

Once attendance and session inputs are ready:

- engine loads metrics and historical data
- engine generates many valid proposals
- engine scores them
- engine picks one proposal from the top band probabilistically
- cabinet or president reviews the proposal

### Cabinet/president actions

- approve
- override
- regenerate
- rate proposal quality

Members are not allowed to generate, review, override, regenerate, rate, or publish pairings.

## 4. Pairing Publication Flow

After approval:

- pairing becomes visible to users
- attendance is finalized
- room assignments become official
- leftover unassigned participants are visible if any exist
- a member-safe realtime publication event may notify connected users to refresh or reconcile

## 5. User Visibility Flow

Once published, users should be able to see their pairing information.

The official published pairing should be visible to:

- members
- cabinet
- president

### Information expected to matter

- assigned room
- assigned role
- assigned BP position and speaking role where relevant
- motion or session information
- whether they are speaker, adjudicator, or chair

## 6. Post-Session Scoring Flow

After the debate session:

- speakers submit session follow-up inputs
- speakers score the assigned chair where applicable
- regular adjudicators do not score others
- chairs score the adjudicators of that room

This creates a session-role-specific scoring cycle.

Connected participants and admins may also receive websocket scoring-status updates, but the HTTP scoring state remains authoritative.

## 7. Dashboard Role Flow

Dashboard behavior depends on the user's session role.

### The system must determine

- whether the current user is a speaker
- whether the current user is an adjudicator
- whether the current user is chair
- what form or actions should be shown

This matters because a single account can take different roles in different sessions.

## 8. Leaderboard Update Flow

After post-session scoring completes:

- speaker leaderboard updates
- adjudicator leaderboard updates
- chair history updates
- motion-type performance records update
- role-specific records update
- session history becomes richer

## 9. Session History Flow

Completed sessions should become explorable records rather than flat logs.

### Summary view should include

- date
- motion type
- attendance percentage

### Expanded detail should include

- date
- motion type
- motion
- number of rooms
- pairing details
- chair assignments
- leftover participants if any

## 10. Learning Flow

The system should learn from two kinds of signals:

- debate outcomes and post-session scoring
- admin evaluation of generated proposal quality

That means the engine improves not only from who won or scored well, but also from whether the proposal looked sensible before the session began.

## 11. Full Lifecycle Summary

1. cabinet or president marks attendance
2. cabinet or president assigns speaker or adjudicator roles
3. cabinet or president enters motion and live session inputs
4. engine generates and scores candidate proposals
5. engine selects one top-band proposal probabilistically
6. cabinet or president approves, overrides, regenerates, or rates the proposal
7. approved pairing is published
8. websocket publication event notifies authorized listeners
9. attendance is finalized automatically
10. session runs
11. post-session scoring happens by session role
12. websocket scoring and leaderboard updates notify authorized listeners
13. leaderboard and session history update
14. periodic tuning uses batched evidence from multiple sessions

## Summary

The system is not just a pairing tool. It is a full session workflow that starts before debate begins, continues after the session ends, and gradually improves through repeated evidence.
