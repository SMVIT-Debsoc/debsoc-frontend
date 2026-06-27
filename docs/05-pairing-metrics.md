# Pairing Metrics

## Purpose

This document is the current source of truth for the metric system behind the debate pairing engine.

It explains:

- what kinds of metrics the engine uses
- which metrics are learned over time
- which inputs are entered only for the current session
- which rules are hard constraints and which are soft preferences
- what each metric means
- how each metric affects pairing quality
- what fallback logic the engine should use when data is limited

This is intentionally more detailed than the other planning docs because the pairing engine depends heavily on precise metric definitions.

## Why This Matters

The pairing engine is not a simple random team generator.

It is a multi-layer decision system that tries to create:

- valid BP rooms
- fair teams
- balanced rooms
- non-repetitive partner combinations
- useful developmental exposure
- strong tournament-practice sessions when needed
- sensible adjudicator and chair allocation

That means the engine cannot rely on one generic score. It must evaluate several dimensions at once.

## Metric System Layers

The engine should use four layers of logic.

### 1. Hard Rules

These are non-negotiable constraints. If a proposal violates any hard rule, it is invalid.

### 2. Session-Only Inputs

These are entered by admin just before generation. They affect only the current session and should not become permanent truth about a member.

### 3. Learned Metrics

These are stored in the database and updated over time from session outcomes, scores, and history.

### 4. Soft Optimization Metrics

These are weighted signals used to compare valid candidate proposals and select stronger ones.

## Core Design Philosophy

The engine should be probabilistic, not purely deterministic.

That means it should:

- generate multiple valid candidate proposals
- score them using the metric system
- keep a top band of strong options
- choose from that top band with controlled randomness

This prevents repetitive results and gives the system room to learn over time instead of always locking onto one pattern.

## Learned Metrics

These are long-term metrics stored in the database and improved after each session.

## `speaker_total_score`

### Purpose

Represents the overall accumulated speaker performance of a member across past sessions.

### Type

Learned DB metric

### Aggregation (cumulative — NOT averaged)

`speaker_total_score` is a **cumulative sum** of the chair-entered raw speaker scores across all of
the member's speaking sessions. It is NOT an average.

```text
speaker_total_score(member) = sum(raw_speaker_score over the member's speaking sessions)
```

This is also the **speaker leaderboard** value (and the same applies per motion type for the
motion-type leaderboard view). It is deliberately additive: a member who attends and performs
repeatedly should rank higher. Averaging is rejected here because a member who attends very few
sessions could otherwise rank unfairly high — non-attendance must not be rewarded.

> Engine-balance note (RESOLVED): the interpreted ability signal `speaker_strength` is built on
> this cumulative total (plus consistency + confidence) and is **intentionally attendance/data-
> sensitive** — irregular members get a lower, less-trusted strength because less practice + less
> data genuinely means a weaker, less-proven speaker. We do NOT make balancing attendance-neutral.
> See `speaker_strength` → "Regularity / Data Sensitivity".

### Why It Exists

This is the broadest and most direct speaker output signal. It gives the engine a baseline
understanding of a member's accumulated speaking record.

### How The Engine Uses It

- estimates broad speaker ability
- supports fair team construction
- contributes strongly to overall team quality

### Rough Weight Priority

High

### Recommended Weight Zone

`0.20 - 0.24`

### Fallback Logic

No fallback needed because this is already a broad metric.

## `speaker_motion_type_score`

### Purpose

Represents how well a speaker performs in a specific motion type such as `IR`, `Policy`, `Moral`, and so on.

### Type

Learned DB metric

### Why It Exists

A speaker may be strong overall but weaker in a specific motion category. The engine should understand that difference.

### How The Engine Uses It

- adjusts teams for the current motion type
- prevents the engine from treating all strengths as universal
- helps create more context-aware pairings

### Rough Weight Priority

High

### Recommended Weight Zone

`0.16 - 0.20`

### Fallback Logic

`speaker_motion_type_score -> speaker_total_score`

## `speaker_strength`

### Purpose

Represents the engine's interpreted understanding of a speaker's true strength, not just their raw score.

### Type

Learned DB metric

### Meaning

This should include:

- overall speaker score
- consistency
- confidence from enough observations
- recent form later if needed

### Why It Exists

Raw totals alone can be misleading. A member may have a good score with low reliability, or a moderate score with very strong consistency.

### How The Engine Uses It

- estimates dependable speaker quality
- helps separate raw results from interpreted strength
- contributes to stronger team balancing decisions

### Proposed Formula

```text
speaker_strength =
  0.70 * normalized_speaker_total_score +
  0.20 * consistency_score +
  0.10 * confidence_score
```

### Regularity / Data Sensitivity (RESOLVED — do NOT make this attendance-neutral)

`speaker_strength` is intentionally lower and less trusted for irregular / low-attendance members.
The reasoning: not being regular to sessions generally means less practice (a genuinely weaker
speaker), and it also means we simply have less data to trust. Both effects must pull strength
down — so this metric is deliberately attendance/data-sensitive, not normalized away.

This is already encoded in the formula:

- `normalized_speaker_total_score` is built on the **cumulative** `speaker_total_score`, so a
  low-attendance member has a low total → low normalized base → lower strength.
- `confidence_score` reflects how much evidence exists (direction: `min(sessions / target, 1.0)`),
  so thin data lowers strength and keeps it close to the broad fallback.
- `consistency_score` needs enough sessions to be meaningful; sparse data should not produce a
  falsely high consistency.

Net effect: a member who rarely attends cannot present as a strong, dependable speaker. Regular,
proven speakers rank higher for team balancing — which is the intended behavior.

### Rough Weight Priority

Medium-high

### Recommended Weight Zone

`0.10 - 0.14`

### Fallback Logic

`speaker_strength -> speaker_total_score`

## `partner_dynamics_overall`

### Purpose

Represents the overall compatibility of two members as a team.

### Type

Learned DB metric

### Meaning

This should be based primarily on actual results together, not mainly on subjective teammate opinion.

> Note (Gate 4): the speaker post-session form has an OPTIONAL `teamDynamicsRating` (0–10), stored
> in its own `TeamDynamicsRating` record alongside this pair-dynamics data (not on the chair
> record). It is a secondary/auxiliary subjective input only — `partner_dynamics_*` stays primarily
> results-based (BP result points / pair win record) as below. Do not let the subjective rating
> dominate the metric. (`docs/12 TeamDynamicsRating`, `docs/14 §4`)

The current preferred measurement direction is pair performance in BP using team outcome points:

- `1st place = 3`
- `2nd place = 2`
- `3rd place = 1`
- `4th place = 0`

### Why It Exists

If two people repeatedly perform well together, the engine should treat that as meaningful evidence of compatibility.

### How The Engine Uses It

- identifies successful pair combinations
- supports stronger team construction
- helps the engine discover good long-term team matches

### Rough Weight Priority

Medium-high

### Recommended Weight Zone

`0.10 - 0.14`

### Fallback Logic

No fallback needed because this is already the broader pair metric.

## `partner_dynamics_by_motion_type`

### Purpose

Represents compatibility of two members in a specific motion type.

### Type

Learned DB metric

### Why It Exists

A pair may work very well in one kind of debate and not as well in another. The engine should be able to recognize that.

### How The Engine Uses It

- improves context-aware pairing for the current motion type
- distinguishes general compatibility from conditional compatibility

### Rough Weight Priority

Medium-high

### Recommended Weight Zone

`0.08 - 0.12`

### Fallback Logic

`partner_dynamics_by_motion_type -> partner_dynamics_overall`

## `repeat_partner_penalty`

### Purpose

Discourages pairing the same people together too often.

### Type

Learned DB metric used as a soft penalty

### Why It Exists

Without a repetition penalty, the engine may repeatedly reuse successful teams and create stagnation.

### How The Engine Uses It

- reduces repetitive partner reuse
- increases exposure to different teammate combinations
- supports development and broader learning

### Rough Weight Priority

Medium

### Recommended Weight Zone

Penalty around `-0.06 to -0.10`

### Fallback Logic

No fallback needed.

## `bp_position_history`

### Purpose

Discourages assigning a speaker to the same broad BP bench too often.

### Type

Learned DB metric used as a diversity signal

### Tracks

- `OG`
- `OO`
- `CG`
- `CO`

### Why It Exists

One of the core goals of the system is to stop people from being repeatedly fixed into the same position pattern.

### How The Engine Uses It

- rotates speakers across broad BP benches
- supports development across different debate contexts
- reduces repetitive exposure such as always being `OG`

### Rough Weight Priority

Medium-low

### Recommended Weight Zone

`0.06 - 0.09`

### Fallback Logic

No fallback needed.

## `internal_speaking_role_history`

### Purpose

Discourages assigning a speaker the same exact speaking role too often.

### Type

Learned DB metric used as a diversity signal

### Tracks

- `PM`
- `DPM`
- `LO`
- `DLO`
- `MG`
- `GW`
- `MO`
- `OW`

### Why It Exists

`bp_position_history` alone is too broad. A member may rotate benches but still repeatedly receive the same style of speaking duty.

### How The Engine Uses It

- rotates exact speaking responsibility
- helps the engine avoid over-specialization
- supports the goal of making members better across all roles

### Rough Weight Priority

Medium-low

### Recommended Weight Zone

`0.06 - 0.10`

### Fallback Logic

No fallback needed.

## `role_score`

### Purpose

Represents performance quality in an exact internal speaking role.

### Type

Learned DB metric

### Tracks

- `PM`
- `DPM`
- `LO`
- `DLO`
- `MG`
- `GW`
- `MO`
- `OW`

### Why It Exists

Role history alone tells the engine where someone has spoken often. Role score tells the engine how well they have actually performed in that role.

### How The Engine Uses It

- supports stronger competitive allocation when needed
- supports development by identifying weak and strong exact roles
- improves role-specific pairing accuracy

### Fallback Logic

`role_score -> speaker_total_score`

## `motion_type_x_role_score`

### Purpose

Represents how well a member performs in a specific motion type and a specific speaking role together.

### Type

Learned DB metric

### Example

- `PM in IR`
- `OW in Policy`

### Why It Exists

This is the most specific role-performance metric and should help the engine become more nuanced as enough data is collected.

### How The Engine Uses It

- stored from the beginning
- used lightly at first
- trusted more once enough observations exist

### Fallback Logic

`motion_type_x_role_score -> role_score -> speaker_motion_type_score -> speaker_total_score`

## `academic_year`

### Purpose

Supports experience balance inside teams and rooms.

### Type

Profile attribute used as a learned pairing input

### Meaning

This is not a direct indicator of raw debate strength.

It exists mainly to support experience exposure, such as pairing a more experienced speaker with a newer speaker when appropriate.

### Why It Exists

Balanced experience pairing can help learning, preparation, and mentorship.

### How The Engine Uses It

- helps avoid rooms that are heavily skewed by seniority
- helps create some senior-junior learning opportunities
- contributes lightly to overall fairness

### Rough Weight Priority

Low

### Recommended Weight Zone

`0.04 - 0.07`

### Fallback Logic

No fallback needed.

## `adjudicator_average_score`

### Purpose

Represents overall adjudicator quality.

### Type

Learned DB metric

### Aggregation (average only — NOT cumulative)

The chair scores each adjudicator in the room **individually** — one rating per adjudicator per
session (no within-session multi-rater averaging). The metric is the mean across sessions:

```text
adjudicator_average_score(adj) = mean(chair rating for that adjudicator over their sessions)
```

The **adjudicator leaderboard ranks by this average only** — deliberately NOT cumulative and NOT
boosted by adjudication count. Reason: a member may be a speaker in some sessions and an
adjudicator in others. A pure average gives them the leverage to split roles freely — adjudicating
fewer times does not drag down their adjudicator standing, and it does not distort the leaderboard.
This is the opposite of `speaker_total_score`, which is cumulative on purpose.

Participation counts (#sessions adjudicated, #sessions chaired) are shown as **context/transparency
only** (and may gate a minimum-sessions threshold to appear), but they are NOT a ranking multiplier.

### Why It Exists

Adjudicator quality should be evaluated separately from speaker quality.

### How The Engine Uses It

- distributes stronger adjudicators across rooms
- helps avoid adjudication imbalance
- supports better room quality

### Rough Weight Priority

High for adjudication allocation

### Recommended Weight Zone

`0.16 - 0.22`

### Fallback Logic

If motion-specific adjudicator scoring is added later:

`motion-specific adjudicator score -> adjudicator_average_score`

## `chair_score`

### Purpose

Represents the quality of a chair based on speaker feedback from previous sessions.

### Type

Learned DB metric

### Meaning

This is the metric previously discussed under the name `CAP score`. The preferred terminology now is `chair_score`.

### Aggregation (multiple raters per session)

A chair is rated by every speaker in their room — up to `8` speakers in a full BP room. These are
stored as individual `ChairFeedbackRecord` rows (one per speaker). `chair_score` is a **derived
average**, never a single rating, so the leaderboard stays stable regardless of how many speakers
rated:

```text
session_chair_rating(chair, session) = mean(speaker chair ratings for that chair in that session)
chair_score(chair) = mean(session_chair_rating over the chair's sessions)
```

Two-stage mean (average within a session first, then across sessions) so a room with 8 raters does
not outweigh a room with 6. Confidence uses the standard formula with the chair-score target count
(`4` sessions):

```text
confidence = min(sessions_chaired / 4, 1.0)
```

`chair_score` is a **derived/recomputable** value — the raw `ChairFeedbackRecord` rows remain the
source of truth (`docs/15 §6 snapshot rule`).

Within-session multi-rater averaging like this applies ONLY to `chair_score` (many speakers rate
one chair). The other feedback metrics aggregate differently:

- `adjudicator_average_score` — the chair scores each adjudicator **individually** (one rating per
  adjudicator per session), so it is a mean **across sessions**, paired on the leaderboard with
  participation counts (#adjudicated, #chaired).
- `speaker_total_score` — a **cumulative sum** across sessions, NOT an average (see its section
  above); this is the additive speaker leaderboard value.

### Why It Exists

Chair quality matters independently from simply being present as an adjudicator. A strong chair should have better chances of being assigned to important or difficult rooms.

### How The Engine Uses It

- improves chair assignment quality
- helps place stronger chairs where they are most needed
- supports more reliable session outcomes

### Rough Weight Priority

High for chair allocation

### Recommended Weight Zone

`0.16 - 0.22`

### Fallback Logic

`chair_score -> adjudicator_average_score`

## Session-Only Inputs

These are entered by admin at generation time and apply only to the current session.

They should be stored with the generation request or session record for audit and regeneration support, but they should not be treated as permanent learned member metrics.

## `time_constraint`

### Purpose

Handles members who need to leave early.

### Why It Exists

Some members may be available only for part of the session. The engine should adapt to that practical constraint without treating it as a permanent trait.

### How The Engine Uses It

If a member needs to leave early, the engine should prefer placing them in an earlier speaking role where possible.

Examples discussed:

- `OG` with `PM`
- `OO` with `LO`

### Rule Behavior

This can act as either:

- a strict rule
- a high-priority soft preference

## `event_team_up_preference`

### Purpose

Allows admin to request that specific members be paired together for tournament preparation or practice.

### Why It Exists

Sometimes the goal of a session is not only fair internal pairing but also targeted preparation for an external event.

### How The Engine Uses It

If `A` and `B` are going to a tournament together, the engine should keep them on the same team for that session.

Their exact BP bench or speaking role may still vary unless admin separately locks those.

### Rule Behavior

This can act as either:

- a strict rule
- a very high-priority soft preference

## `motion_type`

### Purpose

Represents the category of debate being run in the current session.

### Why It Exists

Motion type activates motion-aware pairing metrics.

### How The Engine Uses It

- triggers `speaker_motion_type_score`
- triggers `partner_dynamics_by_motion_type`
- allows the engine to adapt pairings to the context of the debate

## `motion`

### Purpose

Represents the exact motion text of the session.

### Why It Exists

This is mainly useful for recordkeeping, session context, and future analytics.

### How The Engine Uses It

- stored for session history
- may support future analysis if the system later becomes more motion-granular

## `pairing_objective`

### Purpose

Controls whether the engine is optimizing more for growth, balance, or strongest immediate performance.

### Allowed Values

- `DEVELOPMENT`
- `BALANCED`
- `COMPETITIVE`

### Why It Exists

The system has two major goals that can conflict:

- helping members become good in all positions and motion types
- finding strongest partner and strongest likely competitive combinations

That tradeoff should be chosen deliberately at generation time.

### Weight Shift Model

Use `mode multipliers` on top of the base metric weights.

### Proposed Behavior

#### `DEVELOPMENT`

- increase weight of `bp_position_history`
- increase weight of `internal_speaking_role_history`
- increase weak-area exploration
- increase new pair exploration
- slightly reduce pure raw-strength optimization

#### `BALANCED`

- keep base weights close to default
- mix fair quality with development
- avoid heavy specialization in either direction

#### `COMPETITIVE`

- increase weight of `speaker_total_score`
- increase weight of `speaker_motion_type_score`
- increase weight of `speaker_strength`
- increase weight of proven `partner_dynamics`
- increase weight of stronger `chair_score`
- reduce forced experimentation

## Hard Rules

These rules must be satisfied or the proposal is invalid.

## Core Validity Rules

- only marked-present participants can be considered
- each present participant must be marked as `speaker` or `adjudicator`
- one participant cannot be assigned to multiple places
- each BP room must have exactly `8 speakers`
- each room must have `4 teams`
- each team must have `2 speakers`
- benches must be valid: `OG`, `OO`, `CG`, `CO`
- each room must have at least `1 adjudicator`
- each room must have exactly `1 chair`
- pairing cannot be published without admin approval

## Session-Specific Hard Rules When Marked Strict

- forced team-up
- forced separation
- strict time-constraint handling
- forced chair
- forced participant role
- forced room-count decision when admin overrides

## Soft Optimization Metrics

These metrics compare valid proposals and decide which candidates are better.

## Speaker And Team-Level Soft Metrics

- `speaker_total_score`
- `speaker_motion_type_score`
- `speaker_strength`
- `partner_dynamics_overall`
- `partner_dynamics_by_motion_type`
- `repeat_partner_penalty`
- `bp_position_history`
- `internal_speaking_role_history`
- `role_score`
- `motion_type_x_role_score`
- `academic_year`

## Room And Adjudication-Level Soft Metrics

- `room_balance_score`
- `adjudicator_average_score`
- `chair_score`

## Important Composite Metric Definitions

## `room_balance_score`

### Meaning

If there is more than one room, the engine should not place all top speakers in one room and all weak or inexperienced speakers in another.

### Applies When

Only when room count is greater than `1`

### What It Tries To Achieve

- room strength should be reasonably distributed
- room experience should be reasonably distributed
- each room should feel fair and useful

### Type

Proposal-level soft metric

### Proposed Formula

For each room:

```text
room_strength = average(speaker_strength of all 8 speakers)
room_experience = average(experience_index of all 8 speakers)
```

Across all rooms:

```text
strength_balance_penalty = variance(room_strengths)
experience_balance_penalty = variance(room_experiences)
```

Final score:

```text
room_balance_score = 1.0 - (
  0.75 * normalized_strength_variance +
  0.25 * normalized_experience_variance
)
```

If there is only one room:

```text
room_balance_score = 1.0
```

### Recommended Weight Zone

`0.35 - 0.45`

### Why It Matters

This is one of the most important fairness signals in multi-room sessions.

## Fallback Logic And Confidence Handling

The engine should not overfit to highly specific metrics when there is too little data.

Specific metrics should become more trusted only after enough observations exist.

### Recommended Fallback Chain

#### Speaker Metric Fallback

`speaker_motion_type_score -> speaker_total_score`

#### Pair Metric Fallback

`partner_dynamics_by_motion_type -> partner_dynamics_overall`

#### Chair Metric Fallback

`chair_score -> adjudicator_average_score`

#### Strength Metric Fallback

`speaker_strength -> speaker_total_score`

#### Role Metric Fallback

`role_score -> speaker_total_score`

#### Motion And Role Metric Fallback

`motion_type_x_role_score -> role_score -> speaker_motion_type_score -> speaker_total_score`

### Confidence Blending Formula

```text
EffectiveMetric = confidence * specific_metric + (1 - confidence) * fallback_metric
```

Where:

```text
confidence = min(observation_count / target_count, 1.0)
```

Suggested target counts:

- motion-type speaker score: `5`
- partner by motion type score: `4`
- role score: `5`
- motion type x role score: `5`
- chair score: `4`

### Why This Is Needed

This prevents the system from making strong assumptions based on one or two highly specific outcomes.

## Leftover Speaker Handling

The engine should generate only full valid BP rooms by default.

### Formula

```text
room_count = floor(number_of_speakers / 8)
leftover_speakers = number_of_speakers % 8
```

### Default Rule

- generate only complete rooms
- do not automatically create incomplete BP rooms
- do not silently drop leftover speakers

### If Leftovers Exist

- mark leftover speakers as `UNASSIGNED`
- show them clearly to admin
- allow admin to adjust attendance or roles and regenerate

### Allowed Admin Resolutions

- convert some present speakers to adjudicators
- add more speakers
- remove some speakers
- approve a revised valid room count and regenerate

## Adjudicator And Chair Allocation Logic

This covers two things: which adjudicator chairs each room (chair allocation), and how the
remaining adjudicators are spread across rooms as panel members (panel distribution).

### Chair Allocation

Each room must have exactly one chair.

If multiple adjudicators are available, compute:

```text
chair_assignment_score =
  0.60 * chair_score +
  0.25 * adjudicator_average_score +
  0.15 * chair_confidence_score
```

Chair allocation rule:

1. rank rooms by difficulty or importance
2. rank available adjudicators by `chair_assignment_score`
3. assign the stronger chairs to the stronger or more sensitive rooms first
4. the adjudicators not chosen as chairs become the surplus pool for panel distribution below

### Panel Distribution (surplus adjudicators)

> **Hard invariant — never broken.** Every room has **exactly one chair**: not zero, not two.
> Panel distribution operates ONLY on adjudicators that are not chairs and can never add, remove,
> or duplicate a chair. A proposal with any room holding ≠1 chair is invalid regardless of panel
> sizing, and no admin override or distribution step may produce that state.

After every room has its one chair, the leftover adjudicators are distributed as **panel**
members weighted by room difficulty/importance, so harder rooms get larger panels and easier
rooms get fewer (down to just the chair). This keeps adjudication quality balanced toward the
rooms that need it most instead of stacking one room.

```text
surplus = total_adjudicators - room_count        # adjudicators beyond one chair per room
```

Distribution rule:

1. start every room at panel size 0 (chair only)
2. take the difficulty/importance ranking already used for chair allocation
3. hand out surplus adjudicators one at a time, hardest room first, looping through the ranked
   rooms, until the surplus runs out
   - this makes panels differ by at most 1 between adjacent difficulty ranks
4. cap each room at `MAX_ADJUDICATORS_PER_ROOM = 3` total (1 chair + up to 2 panel)
5. any adjudicators left after every room hits the cap become `RESERVE`, shown to admin, not
   silently dropped

Worked example (5 adjudicators, 2 rooms):

```text
2 chairs (1 per room) + 3 surplus
Room 1 (harder): chair + 2 panel = 3 adjudicators
Room 2 (easier): chair + 1 panel = 2 adjudicators
```

### Rule Status

- chair allocation is `FINALIZED ENOUGH` (uses the locked `chair_assignment_score`)
- panel distribution + the `MAX_ADJUDICATORS_PER_ROOM = 3` cap are `PROPOSED V1`
- panel distribution is a **soft allocation**: the engine proposes it, and the only hard rules
  remain "each room has at least 1 adjudicator" and "each room has exactly 1 chair"

### Admin Control

- admin may force a specific chair before generation
- admin may override chair assignment during review
- admin may override panel sizes and reserve assignments during review
- admin may override the room difficulty/importance ranking that drives both chair and panel
  allocation

## Adaptive Learning And Probabilistic Behavior

The intended behavior of this engine is similar to a learning system, even though it is not literally training a transformer model.

It should become better as more data comes in, stay probabilistic instead of rigid, and adjust itself slowly based on repeated evidence rather than one-off noise.

The best description for this is:

- confidence-weighted
- probabilistic
- feedback-driven
- periodically tuned

## Learning Philosophy

The engine should improve through accumulated session data.

That means:

- early on, broad metrics should dominate
- later, more specific metrics should be trusted more
- the system should not overreact to one session
- the system should not lock itself forever into one repeated output

This creates a practical learning loop without pretending the system is a fully trained AI model.

## Confidence-Based Learning

As the database grows, specific metrics should gain more influence.

Examples:

- early stage: `speaker_total_score` is more trustworthy than `speaker_motion_type_score`
- later stage: if enough `IR` data exists, `speaker_motion_type_score` for `IR` should matter more
- early stage: `partner_dynamics_overall` is more trustworthy than `partner_dynamics_by_motion_type`
- later stage: if enough same-motion pair history exists, the motion-type-specific pair metric should matter more

This is how the engine gets more nuanced over time.

## Probabilistic Proposal Selection

The engine should not always choose the single top-scoring proposal.

Instead it should:

1. generate many valid candidate proposals
2. score all proposals
3. sort them by total score
4. keep the top `5` strongest proposals
5. convert those top `5` scores into weighted probabilities
6. randomly select one proposal from that top `5`

This creates controlled randomness.

It means:

- better proposals are more likely
- weaker valid proposals are less likely
- the engine does not become repetitive
- the engine still explores other good arrangements

## Recommended Top-5 Probability Pattern

The exact percentages can be decided later, but a healthy direction is:

- rank 1 proposal: around `30%`
- rank 2 proposal: around `24%`
- rank 3 proposal: around `18%`
- rank 4 proposal: around `15%`
- rank 5 proposal: around `13%`

The exact values do not matter as much as the principle:

- pick only from strong proposals
- do not always pick the top one

## Why Top-5 Randomness Matters

This is important for three reasons:

- it reduces repetitive pairing patterns
- it creates exploration so the engine can discover new successful combinations
- it behaves more like an adaptive system instead of a fixed formula sorter

## Periodic Weight Tuning

The engine should not retune itself after every session.

Instead, tuning should happen only after a batch such as `6-7 sessions`.

This is important because one session may be noisy, but a batch gives better evidence about whether a metric is actually helping.

## What Should Be Reviewed In Each Tuning Cycle

After each batch of `6-7 sessions`, the system should compare:

- engine proposal score
- admin rating of pairing quality
- actual debate outcomes
- speaker scores
- chair feedback
- adjudicator scores
- repetition patterns
- session objective used: `DEVELOPMENT`, `BALANCED`, or `COMPETITIVE`

The system should then ask questions such as:

- did high `partner_dynamics` actually lead to better outcomes
- did `motion_type_score` improve quality enough
- was `room_balance_score` too weak or too strong
- were development sessions rotating people too aggressively or too weakly
- were competitive sessions actually producing stronger rooms

## Weight Adjustment Model

Weights should not be rewritten completely.

Instead, the engine should keep:

- `base_weight`
- `learned_adjustment`

Then use:

```text
effective_weight = base_weight + learned_adjustment
```

This keeps the system stable while still letting it improve.

## Safety Bound On Auto-Tuning

Adjustments should be very small and bounded.

Recommended bound:

```text
max learned adjustment per metric = +/- 0.03
```

This prevents the system from becoming unstable or overreacting to short-term results.

## What Admin Rating Adds

Admin rating of the generated pairing should be included as a learning signal.

This matters because it captures something different from debate outcomes.

Post-session result tells us:

- how the debate actually went

Admin rating tells us:

- whether the generated proposal looked sensible before the debate even happened

That makes admin rating useful for proposal-quality feedback.

## Proposed Admin Pairing Rating Fields

The system should allow admin to rate a proposal with:

- `overall_pairing_rating` such as `1-5`
- optional note
- optional issue tags

Suggested issue tags:

- repetitive pairing
- weak room balance
- weak chair allocation
- poor development spread
- poor tournament preparation fit

## Recommended Tuning Use Of Admin Ratings

Admin ratings should not instantly rewrite weights after one session.

Instead they should:

- be stored with the proposal
- be reviewed in the `6-7` session tuning cycle
- be combined with post-session outcomes
- influence only slight bounded adjustment

This creates a safer fine-tuning loop.

## Exploration Versus Stability

The engine should learn, but it should not become chaotic.

That means:

- randomness should happen only inside the top-quality band
- specific metrics should gain influence only with enough evidence
- weight tuning should happen periodically, not constantly
- weight tuning should be bounded
- admin can still override any generated proposal

This gives the system adaptive behavior without losing product stability.

## Recommended Final Interpretation

The pairing engine should be treated as:

- a confidence-weighted engine
- a probabilistic engine
- a feedback-driven engine
- a periodically tuned engine

It should not be marketed internally as a fully autonomous self-training AI model.

A more accurate description is:

- adaptive pairing engine
- probabilistic weighted engine
- feedback-tuned pairing system

## Recommended Weighting Approach

The engine should not use one flat formula across all metrics.

It should use layered scoring.

## Team And Speaker Assignment Layer

Suggested rough starting distribution:

- `speaker_total_score -> 0.22`
- `speaker_motion_type_score -> 0.18`
- `speaker_strength -> 0.12`
- `partner_dynamics_overall -> 0.12`
- `partner_dynamics_by_motion_type -> 0.10`
- `bp_position_history -> 0.07`
- `internal_speaking_role_history -> 0.07`
- `role_score -> 0.04`
- `motion_type_x_role_score -> 0.03`
- `academic_year -> 0.05`
- `repeat_partner_penalty -> -0.09`

## Proposal And Room Layer

Suggested rough starting distribution:

- `room_balance_score -> 0.40`
- `adjudicator_average_score -> 0.20`
- `chair_score -> 0.20`
- `team_quality_aggregate -> 0.12`
- `experience_distribution_aggregate -> 0.08`

These are not final-decimal locked. They are strong starting directions based on current discussion.

## What The Engine Is Actually Optimizing

The engine is trying to do all of the following at the same time:

- create valid BP rooms
- create fair teams
- avoid repetitive teammate pairings
- avoid repetitive BP benches
- avoid repetitive internal speaking roles
- use motion-type performance intelligently
- identify strong partnerships
- support development across all positions
- support tournament-practice sessions when explicitly requested
- distribute room quality fairly when multiple rooms exist
- place stronger chairs in stronger or more sensitive rooms
- preserve admin control through review, override, and regeneration

This is why the system should be viewed as a multi-layer pairing and allocation engine rather than a simple matchmaker.

## What Is Finalized Enough Right Now

The following points are stable enough to treat as current design assumptions:

- the engine needs both learned metrics and session-only inputs
- partner dynamics should be based primarily on performance together
- partner dynamics can also be motion-type-specific
- `speaker_strength` now has a proposed V1 formula
- `role_score` should be tracked
- `motion_type_x_role_score` should be tracked and trusted slowly
- academic year is used for experience balance
- `bp_position_history` is for broad repetition avoidance
- `internal_speaking_role_history` is for exact role repetition avoidance
- `room_balance_score` now has a proposed V1 formula
- `room_balance_score` applies only when there is more than one room
- `chair_score` is the renamed and preferred term instead of `CAP score`
- `pairing_objective` should exist as a session-time control
- fallback logic now has a proposed confidence-blending formula
- leftover handling now has a proposed default rule
- chair assignment now has a proposed default rule
- probabilistic top-band proposal selection should be used
- periodic tuning after a small batch of sessions should be used
- admin pairing rating should be part of the learning loop

## What Is Still Not Fully Finalized

The main things still open are now much smaller and more practical:

- whether the proposed formulas should be accepted exactly as written or adjusted slightly before coding
- exact numeric target counts for confidence in every metric category
- exact probability distribution used across the top `5` proposals
- whether admin rating should be a single score only or also require issue tags
- whether tuning after `6-7` sessions should be manual-review assisted or partially automatic

## Summary

The metric system is now strong enough to serve as the planning foundation for the pairing engine.

It already defines:

- the main metric taxonomy
- the difference between hard and soft logic
- the difference between learned data and session-time input
- the broad weighting direction
- the fallback philosophy for sparse data
- the adaptive learning direction
- the probabilistic proposal-selection behavior
- the periodic tuning loop

The next design step should be to convert these metric definitions into explicit scoring formulas and generation rules.
