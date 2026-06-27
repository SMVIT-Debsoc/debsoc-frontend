# Pairing System — Conceptual UI

> **Status: conceptual design only.** This is a thinking document, not an implementation spec and
> not frontend code. The backend-only scope lock in `AGENTS.md` still holds — nothing here may be
> built until the user lifts the scope to frontend. It exists so the eventual UI is grounded in the
> pairing docs from day one. Authority: `docs/01`–`docs/15`; this doc never overrides them.
>
> Every flow below is **changed from the old app**. The old app treated attendance as a place for
> manual pairing + speaker scores + motion input. The new app treats the session as a **lifecycle
> state machine** with a mandatory admin-review step and a single published source of truth.

---

## 0. The shift in one picture

```
OLD APP                                NEW APP
attendance = manual pairing            attendance = participant pool + session role
+ speaker score + motion               (no pairing, no score, no motion here)
one-shot, immediately "live"           generate → REVIEW → publish (never auto-public)
flat session log                       lifecycle state machine, role-aware everywhere
score lives on attendance              score is a post-session, session-role-gated cycle
no learning                            outcomes + admin ratings feed periodic tuning
```

The UI's job is to make the **lifecycle state visible at all times**, gate every action behind the
right **role × session-state**, and never let a member see a non-published proposal as if it were
official.

`Grounded in: docs/01 §lifecycle, docs/02 §1, docs/06 §1/§11, docs/15 §9/§20.`

---

## 1. Design principles (the rules the UI must encode)

1. **Lifecycle-first.** Every pairing screen shows a persistent **session state badge**:
   `Preparation → Generated → Approved → Published → Active → Completed → Scored`. The available
   actions are a pure function of (state × role). (`docs/15 §9`, `docs/04`)
2. **Role-aware, by *session* role.** What a user sees after publication depends on whether they
   were a *speaker / adjudicator / chair in that session* — not their account role. The same
   account is a speaker one week and a chair the next. (`docs/06 §7`, `docs/08 §3`, `docs/14`)
3. **Review is a first-class screen, not a confirm dialog.** Generation produces a *proposal*; the
   reviewer needs room/team/chair structure, a score breakdown, leftovers, and approve / override /
   regenerate / rate — all in one workspace. (`docs/04 §13`, `docs/06 §3`)
4. **One published source of truth.** The member-visible pairing reads only the official published
   proposal. Draft/regenerated proposals must be visually unmistakable from published ones.
   (`docs/15 §13`, `docs/12 §PublishedPairingView`)
5. **Trust through transparency.** Probabilistic + adaptive engine ⇒ surface *why*: score
   breakdown, top-band rank, objective mode, "this is 1 of 5 strong options." Never a black box.
   (`docs/01 §philosophy`, `docs/15 §11`)
6. **State you can never misread.** Loading vs. working vs. failed vs. published-stale must be
   distinct. Conflicts (another admin acted) get an explicit "refresh — state changed" surface.
   (`docs/15 §20 UI contract`, `docs/15 §8/§10`)
7. **Access is enforced server-side; UI only mirrors it.** Hiding a button is UX, not security.
   (`docs/15 §16`)

---

## 2. Information architecture & navigation

Three audiences, one app. Navigation differs by account role.

```
cabinet / President (admins)            Member                      TechHead / President (ops)
─────────────────────────────          ──────────────────────      ───────────────────────────
• Sessions (list + create)             • My Pairings (published)    • Eval Harness
• Session workspace                    • My Scoring Tasks           • Tuning Review
   ├ Prepare (attendance+roles)        • Leaderboards               • Engine/Rule Versions
   ├ Setup (motion, objective…)        • Session History (read)
   ├ Generate & Review                 • My Stats
   ├ Publish
   └ Post-session (scoring status)
• Members & Cabinet section (existing) → hover a row = progress popover
• Leaderboards
• Session History
• My Scoring Tasks (when they debate)
```

Note: an admin who also debates in a session sees the **member surfaces too** (My Pairings, My
Scoring Tasks) for that session — driven by their session role.

`Grounded in: docs/14 route groups, docs/06 §7, docs/01 §access.`

---

## 3. Admin flow — the session lifecycle workspace

The spine of the new app. One **Session Workspace** with a stepper that mirrors the state machine.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Session · 27 Jun 2026          [ STATE: Preparation ]   ⋯            │
│  ① Prepare ──▶ ② Setup ──▶ ③ Generate & Review ──▶ ④ Publish ──▶ ⑤ Post-session │
└──────────────────────────────────────────────────────────────────────┘
```

Steps lock/unlock by state: you cannot reach ④ Publish without an **Approved** proposal; ⑤ opens
only after Published + session completion window. (`docs/15 §9`)

### Step ① — Prepare (attendance + session role)
Replaces the old attendance screen entirely.

```
Mark Present                         Role split (live counts)
┌───────────────────────────┐       ┌──────────────────────────────┐
│ �»search / filter members  │       │ Speakers: 23   Adjudicators: 6│
│ ☑ A. Sharma   [Speaker ▾] │       │ Rooms possible: floor(23/8)=2 │
│ ☑ R. Iyer     [Adjudic. ▾]│       │ Leftover speakers: 7  ⚠       │
│ ☐ K. Nair                 │       │ Adjudicator coverage: OK      │
└───────────────────────────┘       └──────────────────────────────┘
```
- Each present person tagged **Speaker** or **Adjudicator** (the only two session roles at prep).
- A **live feasibility panel** computes `room_count = floor(speakers/8)`, leftovers, and whether
  adjudicator coverage is enough — *before* generation, so the admin fixes the pool early.
- **Gone from here:** manual pairing, speaker score entry, motion input. (`docs/02 §1`, `docs/06 §1`)

`Grounded in: docs/02 §1, docs/04 §1/§5/§6, docs/05 hard rules, docs/09 Fo7.`

### Step ② — Setup (session-only inputs)
The inputs that affect *only this generation cycle*.

```
Motion type  [ IR ▾ ]      Pairing objective  ( ) Development  (•) Balanced  ( ) Competitive
Motion text  [____________________________________]
Time constraints  [+ add: member leaves early → prefer early role]
Event team-up     [+ lock A & B on same team]   ▸ mark as STRICT? ☐
```
- **Objective** is prominent — it visibly reshapes weighting (dev = rotate roles; competitive =
  raw strength). The UI can preview "what this objective emphasizes."
- Session-only inputs (`time_constraint`, `event_team_up_preference`) offer a **strict vs. soft**
  toggle, because the docs allow either. Strict = hard rule; soft = high-priority preference.
- These are stored with the generation request for audit/regeneration, **not** as member traits.

`Grounded in: docs/05 session-only inputs, docs/04 §2, docs/09 Fo9.`

### Step ③ — Generate & Review (the centerpiece)
Generation is async-aware: a clear "generating… (candidates explored, top band forming)" state,
never a frozen screen. (`docs/15 §5/§20`)

```
┌── Proposal v3  ·  Top-band rank 2 of 5  ·  Objective: Balanced  ·  Score 0.81 ──┐
│  [Approve]  [Override ▾]  [Regenerate]  [Rate ★★★★☆]      Score breakdown ▸     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ROOM 1   balance 0.88            ROOM 2   balance 0.79                          │
│  ┌ OG  Sharma(PM) · Iyer(DPM) ┐  ┌ OG  …                                        │
│  │ OO  Nair(LO)  · Rao(DLO)   │  │ OO  …                                        │
│  │ CG  …                      │  │ CG  …                                        │
│  └ CO  …                      ┘  └ CO  …                                        │
│  Chair: ⭐ Mehta (0.84)          Chair: ⭐ Das (0.77)                            │
│  Panel: Khan, Rao  (harder rm)   Panel: Singh                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Reserve adjudicators: —         ⚠ Leftover (UNASSIGNED): 7 speakers  [Resolve ▾] │
└─────────────────────────────────────────────────────────────────────────────────┘
```
- **Adjudicator panels are difficulty-weighted, not even.** Every room shows its 1 chair plus a
  panel sized by room difficulty (harder rooms get more, down to chair-only), capped at 3
  adjudicators/room (chair + 2 panel); any surplus is listed as **Reserve**, never dropped. The
  admin can drag-reassign panel members, change panel sizes, and override the difficulty ranking.
  E.g. 5 adj / 2 rooms → Room 1 (harder) = chair + 2, Room 2 = chair + 1. (`docs/05 Adjudicator
  And Chair Allocation Logic`, `docs/09 §6/§6b`, `docs/15 §10`)

Key UI ideas:
- **Score breakdown drawer** — per room: balance/strength/experience; per team: team quality;
  flags repetition penalties. Makes the probabilistic engine legible. (`docs/05 §room_balance`,
  `docs/15 §11`)
- **"1 of 5 strong options"** affordance — Regenerate is framed as "explore another top-band
  proposal," not "the last one was wrong." (`docs/04 §11`, `docs/05 top-5`)
- **Override** is structured editing (swap a speaker, reassign a chair, move a team) — and the UI
  promises **the original is preserved** (override never destroys engine output). (`docs/15 §10`)
- **Leftover resolver** — inline actions from the docs: convert speakers→adjudicators, add/remove
  speakers, or accept a revised room count, then **regenerate**. Leftovers are never silently
  dropped. (`docs/05 leftover handling`, `docs/09 Fo7`)
- **Rate** — `overall_pairing_rating 1–5` + optional issue tags (repetitive pairing, weak room
  balance, weak chair allocation, poor development spread, poor tournament fit) + optional note.
  This is a *learning signal*, shown as "helps the engine improve," stored for tuning. (`docs/05
  admin rating`, `docs/13 §proposal-quality`)
- **Concurrency guard surface** — if another admin generated/approved since load, the action bar
  shows "State changed — reload to act on the current proposal." (`docs/15 §9/§10`)

`Grounded in: docs/04 §8–§13, docs/05 §soft metrics/§chair/§leftover/§rating, docs/06 §3,
docs/12 D4–D9, docs/15 §10/§11.`

### Step ④ — Publish
A deliberate, single, atomic-feeling action with consequences spelled out.

```
Publish proposal v3 as the OFFICIAL pairing for this session?
 • Becomes visible to members, cabinet, president
 • Attendance is finalized automatically
 • Room assignments become official; 7 leftovers remain visible
 [ Publish ]   (publish is blocked until a proposal is Approved)
```
- Publish is **forbidden before approval** and guarded so only one official result can win.
  Success transitions the badge to **Published** and the member surfaces light up. (`docs/02 §5`,
  `docs/15 §13`)

### Step ⑤ — Post-session (scoring status)
A dashboard of the scoring cycle: who still owes a submission, completion %, and when it can close.
Drives the `scoring-status` endpoint. (`docs/14 §scoring-status`, `docs/06 §6`)

**Oversight access — completion ≠ content.** This monitoring view is read-only oversight for
**cabinet, president, and TechHead**, so President and TechHead can always watch progress and see
*who* hasn't filled the form for their session role (speakers owing their speaker form, chairs
owing adjudicator scores). It shows completion + identity only — never the *content/scores* a
participant submitted (that stays restricted; the public output is leaderboards). Only cabinet and
president can **Nudge pending** or **Close scoring**; TechHead is read-only. (`docs/14 §scoring-status
/Auth`, `docs/15 §16`, knowledge-graph R5)

---

## 3b. Admin flow — Member Progress (a synthesized verdict, via hover on the existing roster)

This does NOT add a new page. It reuses the **existing member & cabinet section in the cabinet
dashboard** (which already lists everyone). On **hover (or tap/expand on mobile)** over a person's
row, a **progress popover** opens. "Progress" here is a **human-readable verdict synthesized from
the metrics** — not a wall of numbers — with the raw numbers available underneath.

Access: **cabinet + president** can hover any participant (member, cabinet, OR president — pairing is
account-agnostic). A participant sees only their own profile, never others'.

### Hover popover — the verdict, then the evidence
```
hover ▸ A. Sharma
┌── Progress ────────────────────────────────────────────────────────────────┐
│ VERDICT                                                                      │
│ • Strong in IR; weak in Feminism                                            │
│ • Few debates on Finance — needs more data there                           │
│ • Good as PM / DPM; weaker as Whip                                          │
│ • Pairs well with B; friction with C and D on certain motion types         │
│ • Trend: rising over last 6 sessions                                        │
│ ─────────────────────────────────────────────────────────────────────────  │
│ EVIDENCE (numbers behind it)                                    [ details ▾ ]│
│ Speaker total 842 · Strength 0.78 (conf ●●●●○, 12 sess)                     │
│ IR 312 · Policy 280 · Feminism 40(⚠low) · Finance 15(⚠low)                  │
│ Roles: PM 0.81 · DPM 0.77 · MO/OW(whip) 0.52 …                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

Design notes:
- **Verdict-first.** The backend synthesizes short statements from the metrics (strengths,
  weaknesses, coverage gaps, role aptitude, compatibility) — the admin reads an assessment, not raw
  stats. Numbers are evidence shown beneath. (`docs/14 §7` verdict layer)
- **Honest about data.** A verdict is only asserted when confidence is sufficient; thin areas read
  "needs more data" rather than a false judgment (e.g. Feminism/Finance above). (`docs/05 confidence`,
  `docs/09 Fo2`)
- **Hover-driven, no new screen** — the existing roster IS the entry point; the popover fetches the
  per-person profile + verdict on demand (`GET /api/progress/members/:participantId`). A "details"
  expander or full-profile link can go deeper.
- Reuses existing metrics only — no new scoring; the service interprets `MemberMetricSnapshot` +
  `PairMetricSnapshot` + raw records + participation counts into the verdict. (`docs/12`, `docs/14 §7`)
- Surfaces development signals (motion-type gaps, role aptitude, compatibility), so admins can target
  who needs which practice — directly useful for `DEVELOPMENT` sessions.

> Gate 11 RESOLVED (Option B): member, cabinet, AND president rows all work because every
> metric/score record uses a participant reference `(memberId?, cabinetId?, presidentId?)`, so all
> three account types accrue pairing metrics. (`docs/12` Participant Reference Convention)

`Grounded in: docs/14 §7, docs/05 (all per-member metrics + confidence), docs/12 D17/D18,
docs/15 §16; knowledge-graph C4 metrics, C8/A16, Gate 11.`

## 4. Member flow — published, read-only, role-aware

### 4a. "My Pairing" (after publish)
The member's single most important screen. Reads **only** the official published proposal.

```
┌── 27 Jun 2026 · Motion type: IR ───────────────┐
│  You are: SPEAKER                               │
│  Room 1 · Team OG · Role: PM (1st)              │
│  Teammate: R. Iyer (DPM)                        │
│  Chair: K. Mehta                                │
│  Motion: "This House would…"                    │
└─────────────────────────────────────────────────┘
```
- Adapts to session role: a member shown as **Adjudicator** sees their room + chair/panel status;
  a **Chair** sees "You are chairing Room 2."
- Before publication this screen shows **"Pairing not yet published"** — never a draft proposal.
- Leftover/unassigned members see a clear, non-punitive "Not assigned to a room this session" with
  the reason. (`docs/06 §5`, `docs/05 leftovers`, `docs/12 D-PV`)

`Grounded in: docs/06 §5, docs/14 §published read, docs/12 D-PV.`

### 4b. "My Scoring Tasks" (post-session, session-role gated)
The form a user gets is determined by their **session role**, enforced server-side.

```
SPEAKER form (simple):           CHAIR form (two sections):          ADJUDICATOR (non-chair):
• Score your chair  0–10 (req)   1. Score each panel adjudicator     • nothing to submit
• Rate team dynamics 0–10 (opt)     in your room  (0–10)               (informational only)
• notes (opt)                    2. Enter raw speaker scores for
                                    each speaker in your room
```
- **RESOLVED (Gate 4):** the **chair enters the raw speaker scores** — the speaker never scores
  themselves. The speaker form is just chair score + optional team-dynamics. The chair form has two
  sections (adjudicator scores + room speaker scores). (`docs/14 §4`, `docs/02 §6`)
- One account, different forms per session. The UI fetches the role for *that* session, not
  assume. Duplicate submission (double-tap, refresh) is safe/idempotent and the UI says
  "already submitted." (`docs/06 §6`, `docs/15 §10`)

`Grounded in: docs/02 §6, docs/06 §6/§7, docs/14 §4, docs/15 §10.`

### 4c. Leaderboards
Derived views, recomputable from raw scores. (`docs/02 §8`, `docs/14 §5`)
```
Speakers (CUMULATIVE total)           Adjudicators (AVERAGE only — ranked)
[ All ▸ IR ▸ Policy ▸ Moral … ]       • adjudicator average score  ← ranks
• overall = running total (default)   • #adjudicated / #chaired  (context only)
• per-motion = total within motion    • chair-related derived stat
```

**Speaker board is additive, not averaged** — running total of raw speaker scores
(`speaker_total_score`), overall and per motion type. Rewards attendance; a low-attendance member
can't rank high off a small-sample average. **Adjudicator board ranks by average only** — NOT
cumulative, NOT boosted by count — so a member can be a speaker in some sessions and an adjudicator
in others without their adjudicator standing being dragged down. Counts are shown for context only
(and may gate a min-sessions threshold to appear), never as a ranking factor. (`docs/02 §8`,
`docs/05`, `docs/09 §16b`)

**RESOLVED UI DECISION — speaker leaderboard is ONE board with a motion-type toggle.**
- The speaker leaderboard renders from the single `GET /api/leaderboard/speakers` endpoint, which
  returns the overall ranking (`speaker_total_score`) plus the motion-type-specific summary
  (`speaker_motion_type_score`). It is **not** two separate boards. (`docs/14 §5`, `docs/02 §8`,
  `docs/05`)
- Default view = **Overall**. A motion-type **toggle/filter** (All ▸ IR ▸ Policy ▸ Moral ▸ …)
  switches the same board to a per-motion ranking.
- Each motion type carries an **empty / low-confidence state**: until enough motion-specific
  observations exist (confidence-gated by `Fo2`/`Fo3`), that view shows "Not enough data yet for
  this motion type" instead of a misleading sparse ranking. (`docs/05 §confidence`, `docs/13
  §confidence growth`)
- Rationale: two boards mostly duplicate each other early on; one board + toggle is cleaner and
  honest about data maturity. Exact display formatting remains tunable (`docs/08 §4`).

The **adjudicator leaderboard** is a separate board (adjudicator average + chair-derived stats);
it does not share the speaker toggle.

Member stats page reuses these: a member's own trajectory across motion types and roles.

### 4d. Session history (explorable, not a flat log)
```
List row:   27 Jun · IR · attendance 78%        ▸ expand
Expanded:   date · motion type · motion · #rooms · full pairing · chairs · leftovers
```
(`docs/06 §9`)

---

## 5. Ops flow — eval & tuning (TechHead / President)

Internal/admin surfaces; not for members. (`docs/14 §6`, `docs/10`, `docs/13`)

- **Eval Harness** — pick scenario set (historical / synthetic), runs-per-scenario, baseline; run
  replay; see a **scorecard** across dimensions (validity, room balance, repetition control,
  objective behavior, admin-rating alignment, outcome alignment) and a **regression compare vs.
  baseline** (pass / warn / fail). (`docs/10`, `docs/15 §19`)
- **Tuning Review** — after a batch of ~6–7 sessions: a diff view of suggested **bounded** metric
  adjustments (`|Δ| ≤ 0.03`), each with the evidence behind it, and (per Gate 8) an approve flow
  or auto-apply indicator. Always auditable; shows base_weight + learned_adjustment. (`docs/05
  tuning`, `docs/13 §tuning`, `docs/09 Fo1`)

`Grounded in: docs/10, docs/13 §tuning, docs/14 §6, docs/15 §19, docs/09 §17.`

---

## 6. Cross-cutting UI states (doc 15 made visible)

| Situation | UI requirement | Source |
|-----------|----------------|--------|
| Generation running | progress/working state, never frozen; show candidate/top-band progress | `15 §5/§20` |
| No valid proposal | explicit, actionable error (e.g. "not enough adjudicators") + path to fix | `15 §3/§15` |
| Infeasible pool | feasibility panel flags it at Prep, before generate | `04 §5` |
| Stale state / another admin acted | "state changed, reload" conflict surface | `15 §9/§10` |
| Double publish / double submit | idempotent; UI shows "already done", not a second effect | `15 §10` |
| Member viewing pre-publish | "not yet published" — never a draft | `15 §13` |
| Retryable vs terminal failure | distinguish; offer retry only when retryable | `15 §15/§20` |
| Role-appropriate detail | members never see admin review notes / hidden scores | `15 §16` |

---

## 7. Reusable component concepts (vocabulary, not code)

- **SessionStateBadge** — the lifecycle pill, single source of "where are we."
- **LifecycleStepper** — the ①–⑤ workspace nav with state-gated locks.
- **FeasibilityPanel** — live room-count / leftover / coverage math at Prep.
- **ProposalCanvas** — rooms → teams (OG/OO/CG/CO) → speakers (PM…OW) → chair/panel.
- **ScoreBreakdownDrawer** — proposal/room/team score transparency.
- **ReviewActionBar** — approve / override / regenerate / rate, with conflict guard.
- **LeftoverResolver** — the convert/add/remove/regenerate actions.
- **RatingDialog** — 1–5 + issue tags + note (learning signal framing).
- **PublishedPairingCard** — the member's role-aware read view.
- **RoleScopedScoringForm** — the form switches by session role.
- **ConflictBanner / WorkingState / EmptyState** — the doc-15 UX guarantees.

---

## 8. What every screen owes the backend contract

Because the engine is probabilistic, audited, and concurrent, the UI must consume (not invent)
structured fields from the API: lifecycle state, whether an action is retryable, whether the user
is stale, whether a request is accepted-but-processing, and whether a conflict occurred. The UI
renders these; it never guesses them. (`docs/15 §20 UI contract rule`)

---

## 8a. Resolved UI decisions (log)
- **Speaker leaderboard = one board + motion-type toggle** (default Overall; per-motion via
  filter; empty/low-confidence state per motion type). See §4c. Adjudicator board stays separate.
  (`docs/14 §5`, `docs/02 §8`, `docs/05`, `docs/13 §confidence`)
- **Speaker score is CUMULATIVE (additive); adjudicator score is AVERAGE ONLY (ranked)** — speaker
  total rewards attendance (no average loophole); adjudicator ranks by pure average, not cumulative
  and not count-boosted, so a member can split between speaking and adjudicating without penalty.
  Counts are context-only (not a ranking factor). See §4c. (`docs/02 §8`, `docs/05`, `docs/09 §16b`)
- **Post-session forms (Gate 4)** — speaker form = chair score 0–10 (req) + team-dynamics 0–10
  (opt); chair form = two sections (score panel adjudicators + enter room speaker scores); non-chair
  adjudicators submit nothing. **Chair enters raw speaker scores.** See §4b. (`docs/14 §4`, `docs/02 §6`)
- **Scoring monitoring oversight** — completion tracking (who hasn't filled) readable by
  cabinet/president/TechHead; content stays private; only cabinet+president act. See §3 Step ⑤.
  (`docs/14 §scoring-status`, `docs/15 §16`)
- **Member Progress = synthesized VERDICT on hover of the existing roster** (no new page) — hover a
  member/cabinet/president row → popover with a human-readable assessment ("strong in IR, weak in
  Feminism; good PM/DPM not Whip; pairs well with B, friction with C/D…"), numbers as evidence
  beneath; confidence-gated. cabinet+president see any participant; participants see own only. See
  §3b. Account-agnostic — pairing/metrics cover Member + cabinet + President (Gate 11, Option B,
  participant ref `(memberId?, cabinetId?, presidentId?)`). (`docs/14 §7`, `docs/12`)

## 9. Open UI questions (defer to the user, mirror `docs/07`)
- How much score breakdown should a reviewer see by default vs. on demand?
- Should Regenerate keep prior proposals browsable (history of v1…vN) in the UI, or just current?
- Leftover members: shown publicly to all members, or only to admins?
- Objective preview: static explainer vs. live "what changes" diff?
- How surfaced should "this is 1 of 5 top-band options" be without implying randomness = sloppiness?

These are presentation decisions; none change backend behavior. Confirm before building UI.

---

`Grounded in: docs/01, docs/02, docs/04, docs/05, docs/06, docs/09, docs/10, docs/12, docs/13,
docs/14, docs/15; knowledge-graph communities C1 (roles/access), C2 (lifecycle), C3 (engine), C7
(data/D-PV), C8 (API), C10 (eval), C11 (UX rules in §5/§16/§20).`
</content>
