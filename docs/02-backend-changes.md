# Backend Changes

## Purpose

This document describes the backend-level changes required to support the debate pairing system. It focuses on system behavior, data flow, and backend responsibilities rather than frontend presentation.

The pairing system will require major changes to the current backend because the pairing lifecycle touches attendance, session state, scoring, leaderboard updates, review workflows, and adaptive tuning.

## Overall Backend Direction

The backend will move from a simpler session-and-attendance model to a lifecycle-driven workflow:

1. admin prepares the session
2. engine generates pairing proposals
3. admin reviews and rates a proposal
4. approved proposal becomes public
5. session runs
6. post-session scoring is submitted
7. leaderboard and history data update
8. tuning inputs are stored for later learning

## Access-Control Direction

Pairing lifecycle control must be restricted at the backend level.

### Cabinet and president only

The following actions should only be available to cabinet and president roles:

- prepare pairing generation inputs
- generate pairing proposals
- review proposals
- approve proposals
- override proposals
- regenerate proposals
- rate proposal quality
- publish the approved proposal

### Member visibility after publication

Members should not be allowed to generate or control pairings, but once a pairing is officially published, members should be able to view the official published pairing for that session.

The same published view should be readable by:

- member
- cabinet
- president

This means the backend needs two access paths:

- restricted write/control routes for cabinet and president
- published read route for all society roles after publication

## 1. Attendance Flow Changes

The attendance area becomes the entry point for pairing generation.

### New backend behavior

- attendance determines who is available for the current session
- each present person must be tagged with a session role
- valid roles currently discussed are:
  - speaker
  - adjudicator
- the old idea of attendance as a place for manual pairing state should be removed

### Operational changes

- admin marks users as present
- admin identifies how each present user is participating
- the pairing engine uses that as the starting pool
- once pairing is published, attendance becomes finalized automatically

### Old behavior to remove

- manual paired status in attendance
- speaker score handling inside attendance
- motion input inside attendance

## 2. Session Flow Changes

The session system needs to become pairing-aware and lifecycle-aware.

### New session lifecycle

- session starts with attendance preparation
- roles are assigned to present participants
- session-level inputs are captured
- pairing proposal is generated
- proposal is reviewed and published
- post-session scoring is collected
- session is marked complete

### Required backend capabilities

- session stores motion type and motion
- session stores pairing objective
- session tracks pairing state
- session tracks whether scoring is complete
- session tracks whether the final pairing has been published

## 3. Pairing Generation Service

The pairing engine should live as a dedicated backend service module rather than being scattered across route handlers.

### Service responsibilities

- load active metrics and generation rules
- read relevant historical data
- read current attendance and role assignment
- read current motion and session-specific inputs
- compute many candidate arrangements
- score them
- select one proposal probabilistically from the top band
- build and persist the proposal

## 4. Admin Review Workflow

The backend must support a review-first publication model.

### Required actions

- generate proposal
- approve proposal
- override proposal
- regenerate proposal
- rate proposal quality
- publish approved proposal

### Key rule

The pairing should never become public immediately after generation. Generation creates a proposal. Publication happens only after explicit review.

## 5. Pairing Publish Flow

When a proposal is approved and published, the backend needs to trigger several downstream effects.

### On publication

- pairing becomes available to users
- attendance becomes finalized
- room assignments become official
- leftover unassigned participants remain visible
- session state changes from preparation to active or published

## 6. Post-Session Scoring Flow

Once the debate session ends, the backend must open a scoring phase.

### Expected roles

- speakers submit chair-related scoring and any future pairing input questions
- regular adjudicators do not score others
- chairs score the adjudicators in that room

### Backend responsibilities

- validate who is allowed to submit which score
- ensure a user only sees relevant forms
- prevent unrelated scoring submissions
- store the score data cleanly for leaderboard and history use

## 7. Role-Aware Dashboard Backend

The dashboard data layer needs to become role-aware.

The same user may appear in different contexts across sessions. For one session a user may be a speaker. For another session they may be an adjudicator. In some situations they may be a chair.

### The backend must be able to answer

- what role is this user assigned for the current session
- what scoring form should they receive
- what data should be writable by them
- what history should be shown to them

## 8. Leaderboard Update Logic

The leaderboard system will need to update from post-session scoring rather than being loosely tied to current attendance or session records.

### Speaker leaderboard should eventually account for

- total speaker score
- motion-type-specific speaker score
- role-specific score later where useful

### Adjudicator leaderboard should eventually account for

- adjudicator scoring average
- chair-related score inputs
- number of times serving as adjudicator
- number of times serving as chair where needed

The backend should be designed so leaderboard values are derived from raw scoring data and can be recalculated safely.

## 9. Metrics And Configuration Handling

The pairing engine will depend on a set of metrics that need to be configurable and persisted.

Current direction:

- important pairing metrics should be stored in the database
- each metric should have metadata such as type, base weight, learned adjustment, enabled state, and scope
- generation logic may still reference external structural configuration, but metric records themselves should be first-class data

## 10. Adaptive Tuning Support

The backend should store the data needed for periodic tuning.

### This includes

- proposal score summaries
- admin proposal ratings
- post-session outcomes
- issue tags where applicable
- metric version or weight snapshot used during generation

This makes periodic tuning auditable instead of opaque.

## 11. API Surface Implications

Although exact routes are still to be finalized, the backend will likely need endpoints or service actions for:

- attendance preparation
- role assignment in a session
- pairing generation
- pairing proposal retrieval
- proposal review actions
- proposal rating submission
- publication
- speaker scoring submission
- chair scoring submission
- leaderboard retrieval
- session detail retrieval

## 12. Removal And Deprecation Impact

Some existing backend flows are expected to be removed or replaced as part of this redesign.

### Expected removals

- anonymous feedback message flow
- task assignment flow
- attendance-linked speaker scoring flow
- attendance-linked manual pairing behavior

## Summary

At the backend level, the pairing system is not one isolated feature. It is a coordinated state machine for debate sessions with proposal review, role-based scoring, and adaptive learning inputs.
