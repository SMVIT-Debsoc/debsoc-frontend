# Debate Pairing System Overview

## Purpose

The debate pairing system is being designed as a major structural change to the DebSoc platform. It is not just a feature that creates pairings. It is intended to become the central coordination layer for:

- attendance selection
- session-role assignment
- pairing generation
- session setup
- admin review
- publication
- published pairing visibility
- post-session scoring
- leaderboard updates
- long-term learning from debate history

## Core Product Philosophy

The pairing engine is not meant to be a simple deterministic draw tool.

It is being designed as:

- rule-driven
- metric-aware
- history-aware
- admin-reviewed
- probabilistic
- progressively improvable

The engine should generate strong proposals, not act as an unquestionable black box.

## Probabilistic And Adaptive Behavior

The intended behavior is closer to a probabilistic weighted system than a rigid deterministic one.

That means:

- the engine evaluates many valid arrangements
- each arrangement is scored using active metrics
- the engine keeps a top band of strong proposals
- the final proposal is selected from that top band with controlled randomness

The system should also improve over time by:

- trusting broad metrics early
- trusting specific metrics more as more data is collected
- using admin proposal ratings and post-session outcomes in periodic tuning
- adjusting weights slightly after small batches of sessions rather than after every session

## What The System Is Trying To Optimize

The system is being designed to optimize for a combination of:

- fair speaking opportunities
- room balance across multiple rooms
- meaningful use of historical performance
- better role allocation between speaker, adjudicator, and chair
- adaptation to session-specific conditions
- better future pairing quality through more collected data
- exploration without excessive repetition

## Main Feature Areas Affected

This system changes:

- attendance logic
- session logic
- pairing generation
- proposal review
- publishing flow
- dashboards
- scoring flow
- leaderboards
- database design
- historical learning flow

Because of this, the pairing engine should be treated as a platform-level redesign rather than a small isolated feature.

## Human Review As A Core Rule

The pairing result should never go public immediately after generation.

The expected workflow is:

1. engine generates proposal
2. admin reviews proposal
3. admin approves, overrides, or regenerates
4. only then does the pairing become public

This review step keeps trust in the system and prevents bad automated outcomes from being published without oversight.

## Access Control Direction

The pairing workflow is not open to every user role.

Current direction:

- only `cabinet` and `president` can generate pairings
- only `cabinet` and `president` can review, approve, override, regenerate, rate, and publish proposals
- `members` cannot generate or review proposals
- once a pairing is published, `member`, `cabinet`, and `president` should all be able to view the official published pairing

This means generation access and published visibility are intentionally different.

## Published Pairing Visibility

Once a proposal is approved and published, it becomes the official pairing for that session.

That official published pairing should be readable by:

- members
- cabinet
- president

The system therefore needs a clear published source of truth, not just a list of generated proposals.

## Data Strategy Direction

The current direction is to keep the pairing system data-driven.

At a high level:

- the database stores historical and operational data
- metric definitions and tunable values are first-class data
- the engine uses both stored history and session-only inputs
- proposal-review and post-session outcomes both become learning signals
- publication state and published pairing ownership are stored explicitly

## Current Assumptions

At this stage, the following assumptions guide the design:

- admins mark attendance before pairing
- each present person is marked as either speaker or adjudicator
- motion type is important enough to affect pairing
- motion is entered as part of the session generation flow
- session-only inputs such as time constraints can affect one generation cycle only
- published pairing updates attendance automatically
- post-session score collection updates leaderboards
- leaderboard and historical records become part of future pairing input
- admin proposal ratings should be stored for later tuning
- only cabinet and president can control the pairing lifecycle
- published pairings should be visible across society roles after publication

## Why This Documentation Exists

The purpose of these docs is to keep product and engineering thinking organized while decisions are being refined.

We want a documentation structure that:

- separates concerns clearly
- makes open questions visible
- can be edited incrementally
- gives us a reliable foundation before code changes begin
