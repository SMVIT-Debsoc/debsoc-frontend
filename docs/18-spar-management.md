# Spar Management System

## Purpose

This document is the complete specification for the Spar Management feature.

It defines:

- what spars are and why they matter
- what data we collect from each spar
- how the data model is structured
- how the form flow works for submission
- how spar data feeds into the pairing engine
- how the spar leaderboard works
- API route contracts
- backend service boundaries
- engineering rules specific to this feature
- the phased build plan

This is the single source of truth for all spar-related work.

---

## 1. What Is a Spar

A spar is a practice debate that members do outside official club sessions. It is informal, self-organized, and not managed by cabinet or president.

Spars follow the same British Parliamentary (BP) format as club sessions: 4 teams, 2 speakers per team, 8 speakers total per round. A member may spar with a teammate (normal) or speak both positions alone (iron-man).

### Why Spars Matter

**For the pairing engine:** The club runs ~1 session per week. That gives the pairing engine limited data points per member. Spar submissions multiply the available data — position history, speaker scores, motion-type exposure, team result points — so the engine's learned metrics converge faster and fallback logic is needed less often.

**For member engagement:** A spar leaderboard creates healthy competition and makes practice effort visible. Members who spar frequently are recognized via ranking without exposing raw point values.

---

## 2. Data Collection — What We Collect Per Spar

Each member submits their own spar record independently. If A and B spar together, both A and B submit separately. There is no cross-linking, no verification, and no approval workflow.

### Fields collected from the form

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Spar date | `DateTime` | Yes | When the spar happened |
| Motion type | `String` (enum-like) | Yes | Same categories as `DebateSession.motionType` |
| Motion text | `String` | No | The actual motion debated |
| BP position | `String` (enum) | Yes | `OG` / `OO` / `CG` / `CO` |
| Teammate | Participant reference OR `"iron-man"` | Yes | Select a debsoc member, or choose iron-man |
| Team rank | `Int` (1–4) | Yes | Where their team placed |
| Speaking role(s) | `String` (enum) | Auto | Derived from position + iron-man status |
| Speaker score(s) | `Float` | Yes | 1 score if partnered, 2 if iron-man |

### Fields derived automatically

| Field | Type | Derivation |
|-------|------|------------|
| `teamResultPoints` | `Int` | Rank 1→3, 2→2, 3→1, 4→0 (same as session pipeline) |
| `isIronMan` | `Boolean` | `true` if teammate is null / iron-man selected |
| `submittedById` / `submittedByRole` | Participant ref | The logged-in user |

### Speaking Role Mapping

Each BP position has exactly two speaking roles:

| Position | Role 1 | Role 2 |
|----------|--------|--------|
| OG | PM | DPM |
| OO | LO | DLO |
| CG | MG | GW |
| CO | MO | OW |

- **Normal spar (with teammate):** User picks ONE of the two roles. One speaker score entered.
- **Iron-man spar:** BOTH roles are auto-selected. Two speaker scores entered (one per role).

---

## 3. Data Model

### 3.1 `SparRecord`

One row per member per spar submission. This is the core entity.

```text
SparRecord
  id                String    @id @default(uuid())
  sparDate          DateTime
  motionType        String
  motionText        String?
  bpPosition        String                          // OG | OO | CG | CO
  isIronMan         Boolean   @default(false)
  teamRank          Int                             // 1–4
  teamResultPoints  Int                             // 3/2/1/0 derived from rank

  // Submitter — participant reference (exactly one non-null)
  memberId          String?
  cabinetId         String?
  presidentId       String?

  // Teammate — participant reference (all null if iron-man)
  teammateMemberId    String?
  teammateCabinetId   String?
  teammatePresidentId String?

  sparSpeakerScores SparSpeakerScore[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([memberId, cabinetId, presidentId])
  @@index([sparDate])
```

### 3.2 `SparSpeakerScore`

One or two rows per spar — stores the speaker score for each speaking role.

```text
SparSpeakerScore
  id              String      @id @default(uuid())
  sparRecordId    String
  sparRecord      SparRecord  @relation(fields: [sparRecordId], references: [id], onDelete: Cascade)
  speakingRole    String                            // PM | DPM | LO | DLO | MG | GW | MO | OW
  speakerScore    Float

  @@index([sparRecordId])
```

### 3.3 Relationship Summary

```text
SparRecord  1───*  SparSpeakerScore    (1 if normal, 2 if iron-man)
SparRecord  *───1  Member              (submitter, via memberId)
SparRecord  *───1  cabinet             (submitter, via cabinetId)
SparRecord  *───1  President           (submitter, via presidentId)
SparRecord  *───1  Member              (teammate, via teammateMemberId)
SparRecord  *───1  cabinet             (teammate, via teammateCabinetId)
SparRecord  *───1  President           (teammate, via teammatePresidentId)
```

### 3.4 Design Decisions

- **No cross-linking between A and B's submissions.** If A and B spar together and both submit, we get two independent `SparRecord` rows. Each feeds only its submitter's metrics. This is intentional — it avoids matching logic and keeps the model simple.
- **Follows the participant reference convention** from `docs/12`. Exactly one of `memberId`/`cabinetId`/`presidentId` is non-null per participant slot.
- **`teamResultPoints` is stored, not computed at read time.** Derived on write from `teamRank` using the same 3/2/1/0 scale as `SpeakerScoreRecord.teamResultPoints`. This ensures the pairing engine reads the same field shape from both sources.
- **`onDelete: Cascade` on speaker scores.** If a spar record is deleted, its scores go with it.

---

## 4. Form Flow — UI Specification

### 4.1 Who Can Submit

Any authenticated user (Member, cabinet, President) can submit their own spar. A user can only submit for themselves — never for someone else.

### 4.2 Form Steps

The form is a single page with conditional fields:

```text
Step 1: Basic Info
  ├── Spar date (date picker, defaults to today)
  ├── Motion type (dropdown, same options as session motion types)
  └── Motion text (optional text input)

Step 2: Position & Teammate
  ├── BP Position (radio: OG / OO / CG / CO)
  └── Teammate (searchable member dropdown + "Iron Man" option)
       │
       ├── If teammate selected:
       │     ├── Speaking role (radio: the two roles for chosen position)
       │     └── Speaker score (number input, one field)
       │
       └── If Iron Man selected:
             ├── Speaking roles (both auto-displayed, not editable)
             ├── Speaker score for Role 1 (number input)
             └── Speaker score for Role 2 (number input)

Step 3: Result
  └── Team rank (radio: 1st / 2nd / 3rd / 4th)

Submit → stores SparRecord + SparSpeakerScore(s)
```

### 4.3 Validation Rules

- Spar date cannot be in the future
- BP position must be one of: `OG`, `OO`, `CG`, `CO`
- If not iron-man, exactly one speaking role must be selected
- Speaker score(s) must be within valid range (to be defined, likely 50–100 matching session convention)
- Team rank must be 1–4
- Teammate (if selected) must be a valid, verified member/cabinet/president
- Teammate cannot be the submitter themselves
- A user cannot submit more than one spar for the same date + same position + same teammate combination (duplicate guard)

---

## 5. Pairing Engine Integration

### 5.1 Source Discriminator

The pairing engine's metric updater currently reads from session-based tables (`SpeakerScoreRecord`, `SessionRoleAssignment`, etc.). Spar data introduces a second source.

To keep these distinct:

- Metric computation services receive a `source` tag: `"session"` or `"spar"`
- Spar data is weighted lower than session data in learned metric calculations
- The exact weight discount is configurable (start with `0.6x` for spar vs `1.0x` for session)

### 5.2 What Spar Data Feeds

| Pairing Metric | What Spar Provides |
|----------------|--------------------|
| `speaker_total_score` | Speaker scores from `SparSpeakerScore` |
| `position_history` | BP position from `SparRecord.bpPosition` |
| `role_history` | Speaking roles from `SparSpeakerScore.speakingRole` |
| `motion_type_exposure` | Motion type from `SparRecord.motionType` |
| `team_result_history` | Team result points from `SparRecord.teamResultPoints` |
| `pair_history` | Teammate reference from `SparRecord` (if not iron-man) |

### 5.3 What Spar Data Does NOT Feed

- Chair/adjudicator metrics (spars have no adjudicators)
- Room balance scores
- Proposal quality scores
- Chair feedback
- Adjudicator scores
- Team dynamics ratings

### 5.4 Metric Update Trigger

Spar data updates metric snapshots on successful spar submission.

The spar service creates the `SparRecord`, then triggers the spar metric update functions before the submit route returns success. This keeps `MemberMetricSnapshot` and `PairMetricSnapshot` current without requiring a separate scheduled batch job.

This is **not** a WebSocket/live UI update. The leaderboard remains read-on-demand, and spar submissions do not emit realtime events.

---

## 6. Spar Leaderboard

### 6.1 Scoring Model

Points are accumulated per spar and are **never visible to users**. Only the ranking (position on the leaderboard) is shown.

**Base points per spar:**
- Normal spar (with teammate): `10 points`
- Iron-man spar: `15 points`

**Frequency multiplier:**
- If a member spars in consecutive weeks (no gap > 7 days between any two spars), they earn a streak bonus
- Streak multiplier: `1.0x` (week 1), `1.1x` (week 2), `1.2x` (week 3), capped at `1.5x`
- A gap of more than 7 days resets the streak to `1.0x`

**Examples:**
- Week 1: 1 normal spar = 10 × 1.0 = 10 points
- Week 2: 1 iron-man spar = 15 × 1.1 = 16.5 points
- Week 3: 2 normal spars = (10 + 10) × 1.2 = 24 points
- Week 5 (skipped week 4): 1 normal spar = 10 × 1.0 = 10 points (streak reset)

### 6.2 Leaderboard Rules

- **All-time accumulation.** No resets. Points accumulate forever.
- **Ranking only.** Users see their rank (1st, 2nd, 3rd...) but NOT their point total.
- **All roles participate.** Members, cabinet, and president all appear on the same leaderboard.
- **Minimum activity threshold.** A user must have at least 1 spar to appear on the leaderboard (no zero-spar entries).

### 6.3 Leaderboard Computation

The leaderboard is **computed on read, not stored**. Since the total user count is small (debating society scale, likely <200), computing ranks from aggregated spar data on each request is acceptable. No precomputed `LeaderboardSnapshot` table is needed for this.

If performance becomes an issue later, we can add a materialized view or cache layer.

---

## 7. API Route Contracts

### 7.1 Route Family: `spar`

All routes live under `app/api/spar/`.

---

### `POST /api/spar/submit`

**Purpose:** Submit a new spar record.

**Access:** Any authenticated user (Member, cabinet, President). Submits for self only.

**Request body:**
```json
{
  "sparDate": "2026-07-10T00:00:00Z",
  "motionType": "string",
  "motionText": "string | null",
  "bpPosition": "OG | OO | CG | CO",
  "isIronMan": false,
  "teammateId": "string | null",
  "teammateRole": "Member | cabinet | President | null",
  "teamRank": 1,
  "speakerScores": [
    { "speakingRole": "PM", "speakerScore": 76.5 }
  ]
}
```

**Validation:**
- `sparDate` not in future
- `bpPosition` valid enum
- `teamRank` 1–4
- If `isIronMan` is `false`: exactly 1 speaker score entry, `teammateId` required
- If `isIronMan` is `true`: exactly 2 speaker score entries, `teammateId` must be null
- Speaking roles must match the position (e.g., OG → PM/DPM only)
- Duplicate guard: no existing record with same submitter + sparDate + bpPosition + teammateId

**Response:** Created `SparRecord` with nested `SparSpeakerScore` entries.

**Should call:** `submitSpar()` from `lib/server/spar/spar-service.ts`

---

### `GET /api/spar/history`

**Purpose:** Get the authenticated user's own spar history.

**Access:** Any authenticated user.

**Query params:**
- `page` (default 1)
- `limit` (default 20, max 50)
- `sortBy` (default `sparDate`, options: `sparDate`, `createdAt`)
- `sortOrder` (default `desc`)

**Response:** Paginated list of `SparRecord` with nested `SparSpeakerScore` entries.

**Should call:** `getSparHistory()` from `lib/server/spar/spar-service.ts`

---

### `GET /api/spar/leaderboard`

**Purpose:** Get the spar leaderboard rankings.

**Access:** Any authenticated user.

**Query params:**
- `page` (default 1)
- `limit` (default 20, max 50)

**Response:**
```json
{
  "rankings": [
    {
      "rank": 1,
      "userId": "string",
      "userRole": "Member | cabinet | President",
      "userName": "string",
      "totalSpars": 24,
      "currentStreak": 3
    }
  ],
  "myRank": {
    "rank": 5,
    "totalSpars": 12,
    "currentStreak": 2
  },
  "totalParticipants": 45,
  "pagination": { "page": 1, "limit": 20, "totalPages": 3 }
}
```

Note: `points` are NOT included in the response. Only rank, spar count, and streak.

**Should call:** `getSparLeaderboard()` from `lib/server/spar/spar-service.ts`

---

### `DELETE /api/spar/[sparId]`

**Purpose:** Delete a spar record. Users can only delete their own records.

**Access:** Any authenticated user (own records only). Cabinet and President can delete any record (moderation).

**Should call:** `deleteSpar()` from `lib/server/spar/spar-service.ts`

---

## 8. Backend Service Structure

### 8.1 Folder Layout

```text
lib/
  server/
    spar/
      spar-service.ts           // Business logic: submit, history, delete
      spar-repository.ts        // All Prisma access for spar tables
      spar-leaderboard.ts       // Leaderboard computation logic
      spar-validation.ts        // Zod schemas + business validation rules
      spar-types.ts             // TypeScript types for spar domain

app/
  api/
    spar/
      submit/route.ts           // POST /api/spar/submit
      history/route.ts          // GET /api/spar/history
      leaderboard/route.ts      // GET /api/spar/leaderboard
      [sparId]/route.ts         // DELETE /api/spar/:sparId
```

### 8.2 Service Boundaries

- **Routes** (`app/api/spar/`): Auth guard → zod validate → call service → shape response. No Prisma, no formulas, no orchestration.
- **Service** (`spar-service.ts`): Business logic. Computes `teamResultPoints` from rank. Validates teammate exists. Checks duplicate guard. Calls repository.
- **Repository** (`spar-repository.ts`): All Prisma queries. Create spar with nested speaker scores. Query history with pagination. Aggregate for leaderboard.
- **Leaderboard** (`spar-leaderboard.ts`): Streak calculation, point computation, ranking. Pure functions that take aggregated data, not Prisma queries.
- **Validation** (`spar-validation.ts`): Zod v4 schemas for request bodies and query params.

### 8.3 Database Access Discipline

- All Prisma access goes through `spar-repository.ts`. No Prisma calls in routes or service.
- Spar submission is a single `prisma.sparRecord.create()` with nested `sparSpeakerScores: { create: [...] }`. One DB round-trip.
- Leaderboard query should use a single aggregation query, not N+1. Aggregate spar counts and compute points in one pass.
- History queries use cursor-based or offset pagination with proper `take`/`skip` and index coverage.

---

## 9. Engineering Rules — Spar-Specific

These rules apply to all spar-related code and are additive to the general quality standard in `docs/15`.

### Rule S1 — No mutation of existing models
Spar tables are new additions. No existing model (`DebateSession`, `Attendance`, `SpeakerScoreRecord`, etc.) is modified. No existing migration is altered. No existing field is renamed or repurposed.

### Rule S2 — No existing feature breakage
Spar code must not affect any existing feature. No changes to existing routes, services, repositories, components, or pages. The spar system is a parallel addition, not a modification.

### Rule S3 — Participant reference convention
Follow `docs/12` participant reference convention exactly. Submitter and teammate both use the `(memberId?, cabinetId?, presidentId?)` triple. Exactly one non-null per slot. Enforce in validation.

### Rule S4 — Same score scale
`teamResultPoints` uses the same 3/2/1/0 scale as `SpeakerScoreRecord.teamResultPoints`. Speaker score ranges follow the same convention as session speaker scores. No separate scale.

### Rule S5 — Type safety
All spar types are defined in `spar-types.ts`. No `any`. No type assertions unless genuinely necessary. Zod schemas are the source of truth for request/response shapes, with TypeScript types inferred from them.

### Rule S6 — Minimal DB hits
- Spar submission: 1 write (create with nested scores)
- History: 1 read (paginated query)
- Leaderboard: 1 aggregation query + in-memory ranking
- Delete: 1 read (ownership check) + 1 delete (cascade handles scores)

### Rule S7 — Clean imports
Spar code imports from `lib/server/spar/` only. It does not import from pairing engine internals, session services, or scoring services. The only shared imports are guards (`lib/server/guards.ts`), HTTP helpers (`lib/server/http.ts`), and Prisma client.

### Rule S8 — Leaderboard points are server-only
Point values and the scoring formula are never sent to the client. The API returns ranks, spar counts, and streaks — never point totals. This prevents gaming and allows formula tuning without client changes.

### Rule S9 — No real-time / WebSocket
Spar submission does not trigger WebSocket events. The leaderboard is not live-updated. This is a simple CRUD feature with read-on-demand leaderboard computation.

### Rule S10 — No overriding existing functions
When adding spar metric functions to existing files (`metric-update-service.ts`, `scoring-repository.ts`), all new code must be **additive only**. Do NOT rename, refactor, rewrite, move, or change the signature of any existing function. Do NOT modify the body of existing functions. Do NOT change existing return types or interface contracts. The new spar functions are added as new exports alongside the existing ones. If the existing `MetricRepositoryContract` interface needs new methods, extend it — do not remove or rename existing methods. The existing session pipeline must remain byte-for-byte identical before and after the spar integration.

### Rule S11 — Mobile-first, theme-consistent UI
All spar UI (submission form, history page, leaderboard page) must be:

- **Mobile-first.** Design for mobile viewport first, then scale up to tablet and desktop. Use responsive breakpoints, not fixed widths. Touch targets must be minimum 44×44px. Form fields must be comfortable to use on phone screens.
- **Same theme, same style.** Follow the exact same design language, color palette, typography, spacing, component patterns, and layout conventions as the existing dashboard pages. Do not introduce new colors, fonts, card styles, button variants, or spacing scales. If the dashboard uses a specific card component, table style, or navigation pattern — use it. The spar pages must feel like they were always part of the dashboard, not bolted on.
- **Same component library.** Use the same UI components already used across the dashboard (buttons, inputs, selects, cards, tables, modals, toast notifications). Do not introduce new component libraries or custom components where an existing one already handles the same pattern.
- **Same layout structure.** Follow the same page layout (sidebar, header, content area) and navigation patterns as other dashboard pages. Spar pages should be reachable from the same navigation structure.

---

## 10. Existing System Integration — What Changes and Where

This section documents every existing file that Phase S7 will touch, what changes, and why. No existing file is touched in Phases S0–S6 — those phases only create new files.

### 10.1 Files That Change

#### `lib/server/scoring/metric-update-service.ts`
**Current behavior:** Exports three functions — `updateLearnedMetricsFromSession`, `updatePairMetricSnapshotsFromSession`, `updateRolePerformanceFromSession`. All three are triggered after a session is scored. They read from `SpeakerScoreRecord`, `ChairFeedbackRecord`, `AdjudicatorScoreRecord`, and `TeamDynamicsRating` via the `MetricRepositoryContract` interface. They compute per-participant metrics and write to `MemberMetricSnapshot` and `PairMetricSnapshot`.

**What changes:**
1. **New function: `updateLearnedMetricsFromSpar(sparRecordId: string)`** — Reads from `SparRecord` + `SparSpeakerScore` for a single spar submission. Computes the same metric keys as the session pipeline (`speaker_total_score`, `speaker_strength`, `speaker_motion_type_score`, `role_score`, `motion_type_x_role_score`) but applies a `0.6x` confidence discount to all spar observations. Writes to the same `MemberMetricSnapshot` table.

2. **New function: `updatePairMetricFromSpar(sparRecordId: string)`** — For non-iron-man spars only. Reads the submitter + teammate from `SparRecord` and the `teamResultPoints`. Updates `PairMetricSnapshot` with metric key `partner_dynamics_overall` and `partner_dynamics_by_motion_type`, applying the same `0.6x` confidence discount.

3. **`updateRolePerformanceFromSession` is NOT touched.** Spars have no chairs or adjudicators, so `chair_score` and `adjudicator_average_score` metrics are never fed by spar data.

4. **The existing `updateLearnedMetricsFromSession` and `updatePairMetricSnapshotsFromSession` are NOT modified.** The spar functions are additive — new exports alongside the existing ones. The existing session pipeline continues to work exactly as before.

**Key design detail — how spar data merges with session data:**
The metric snapshot table (`MemberMetricSnapshot`) stores one row per `(participant, metricKey, contextKey)`. When computing a metric, the spar function must:
- Read ALL existing data for that participant (both session-sourced and spar-sourced scores)
- Combine them with spar observations weighted at `0.6x`
- Write a single merged snapshot value

This means the spar update function must query `SpeakerScoreRecord` (session data) AND `SparSpeakerScore` (spar data) together, apply differential weights, and produce one merged metric. It does NOT write a separate spar-only snapshot.

**Implementation approach — weighted merge:**
```text
For each participant:
  session_scores = all SpeakerScoreRecord rows for this participant
  spar_scores = all SparSpeakerScore rows for this participant (via SparRecord)

  weighted_observations = session_scores.count * 1.0 + spar_scores.count * 0.6
  weighted_total = sum(session_scores.rawScore) * 1.0 + sum(spar_scores.speakerScore) * 0.6
  weighted_mean = weighted_total / weighted_observations

  confidence = computeConfidence(weighted_observations, target_count)
  → upsert MemberMetricSnapshot with merged values
```

#### `lib/server/scoring/metric-update-service.ts` — `MetricRepositoryContract` interface
**What changes:** Add two new methods to the contract interface:
```text
getSparSpeakerScoresForParticipants(participantIds: string[]): Promise<SparScoreRow[]>
getSparRecordForMetricUpdate(sparRecordId: string): Promise<SparRecordWithScores | null>
```
These are implemented in the existing `scoring-repository.ts` (see below).

#### `lib/server/repositories/scoring-repository.ts`
**Current behavior:** All Prisma queries for session scoring data — speaker scores, chair feedback, adjudicator scores, team dynamics, metric snapshots, leaderboards, progress profiles.

**What changes:**
1. **New query: `getSparSpeakerScoresForParticipants(participantIds)`** — Queries `SparSpeakerScore` joined with `SparRecord` for a set of participant IDs. Returns rows in a shape compatible with the metric computation (speakerScore, speakingRole, motionType, teamResultPoints, bpPosition, sparDate). This is the spar equivalent of `getSpeakerScoreRecordsForParticipants`.

2. **New query: `getSparRecordForMetricUpdate(sparRecordId)`** — Single spar record with nested speaker scores, used by the spar metric update trigger. Returns the submitter participant ref, motionType, bpPosition, teamResultPoints, isIronMan, teammate ref, and all speaker scores.

3. **New query: `getSparRecordsByTeammate(participantIdA, participantIdB)`** — For pair metric updates. Returns all spars where A submitted and listed B as teammate (or vice versa). Used to compute `partner_dynamics_overall` from spar data.

4. **Existing `getParticipantProgressProfile` — OPTIONAL enrichment:** The progress profile could show spar activity count alongside session data. This is a minor additive read — add a count query against `SparRecord` for the participant. If we do this, the `ParticipantProgressProfile` type in `types/scoring.ts` gains an optional `sparCount` field.

**What does NOT change:** All existing queries remain identical. No existing function signature changes. No existing return type changes. The new queries are added alongside the existing exports.

#### `types/scoring.ts`
**What changes (optional):** If we enrich the progress profile with spar data:
- `ParticipantProgressSummary` gains optional `sparCount?: number`
- `ParticipantProgressProfile` gains optional `sparActivity?: { totalSpars: number; ironManSpars: number; lastSparDate: string | null }`

These are optional fields — existing consumers that don't read them are unaffected.

### 10.2 Files That Do NOT Change

These files are explicitly confirmed as untouched:

| File | Why it stays unchanged |
|------|----------------------|
| `lib/server/pairing/engine.ts` | Engine reads from `MemberMetricSnapshot` / `PairMetricSnapshot`. Spar data lands in those same tables via the metric updater. The engine never queries raw score tables directly — it consumes pre-computed snapshots. So the engine sees richer data automatically without any code change. |
| `lib/server/pairing/metrics-loader.ts` | Loads metric definitions and session inputs. Spar has no metric definitions of its own — it feeds the same metrics. No change needed. |
| `lib/server/pairing/candidate-generator.ts` | Generates candidate pairings from the `PairingGenerationContext`. Consumes snapshots, not raw data. Unaffected. |
| `lib/server/pairing/proposal-scorer.ts` | Scores proposals using metric snapshots. Same reason as engine — consumes pre-computed data. |
| `lib/server/pairing/hard-rules.ts` | Hard rules operate on session-level constraints. Spars don't create sessions. Unaffected. |
| `lib/server/pairing/fallback.ts` | Fallback logic for insufficient data. Spar data reduces fallback usage by increasing observation counts, but the fallback code itself doesn't change. |
| `lib/server/pairing/tuning.ts` | Tuning reads from metric snapshots and eval results. Unaffected. |
| `lib/server/repositories/metrics-repository.ts` | Reads `MemberMetricSnapshot` and `PairMetricSnapshot` for the engine. These tables are the single source of truth — the metric updater writes to them from both session and spar sources. The repository reads are unchanged. |
| `lib/server/repositories/pairing-repository.ts` | Builds `PairingGenerationContext` from sessions. Spars are not sessions. Unaffected. |
| `lib/server/scoring/leaderboard-service.ts` | Session speaker leaderboard. Spar has its own separate leaderboard. No cross-contamination. |
| `lib/server/scoring/speaker-scoring-service.ts` | Session speaker score submission. Spar submission is a separate flow. |
| `lib/server/scoring/chair-scoring-service.ts` | Chair scoring. Spars have no chairs. |
| `lib/server/sessions/*` | Session lifecycle, attendance. Spars are not sessions. |
| `lib/server/realtime/*` | WebSocket events. Spars don't emit events. |
| `lib/server/eval/*` | Eval harness. Evaluates pairing proposals, not spar data. |
| `prisma/schema.prisma` (existing models) | All existing models are untouched. Only new models (`SparRecord`, `SparSpeakerScore`) are added. New relations added to `Member`, `cabinet`, `President` for spar references. |

### 10.3 Why the Engine Benefits Without Code Changes

This is the key architectural insight:

```text
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│ Session      │────▶│ metric-update-service │────▶│ MemberMetricSnapshot│
│ SpeakerScore │     │ (weight: 1.0x)       │     │ PairMetricSnapshot  │
└─────────────┘     └──────────────────────┘     └─────────┬───────────┘
                                                           │
┌─────────────┐     ┌──────────────────────┐               │
│ Spar         │────▶│ metric-update-service │───────────────┘
│ SpeakerScore │     │ (weight: 0.6x)       │     ┌─────────────────────┐
└─────────────┘     └──────────────────────┘     │ Pairing Engine      │
                                                  │ (reads snapshots    │
                                                  │  — no code change)  │
                                                  └─────────────────────┘
```

The snapshot tables are the **single integration point**. Both session and spar data converge into the same snapshot rows. The engine downstream reads those snapshots and never knows or cares whether the data came from a session or a spar. More data → higher observation counts → higher confidence → fewer fallbacks → better pairings.

### 10.4 When Spar Metrics Are Updated

Spar metric updates are triggered **on spar submission**, not in a batch. When a user submits a spar:

1. `POST /api/spar/submit` → `spar-service.submitSpar()` → creates the `SparRecord`
2. After successful creation, `spar-service` awaits `updateLearnedMetricsFromSpar(sparRecordId)` and (if not iron-man) `updatePairMetricFromSpar(sparRecordId)`
3. These read all historical data (session + spar) for the affected participant(s) and recompute the merged snapshots

This is acceptable because:
- It's a single-participant update (or two participants for pair metrics), not a batch
- The total data volume per participant is small (dozens to low hundreds of records)
- The route returns success only after the spar record and affected metric snapshots are both updated

### 10.5 Relation Additions to Existing Models

The `Member`, `cabinet`, and `President` models in `prisma/schema.prisma` each gain new relation fields pointing to `SparRecord` (as submitter and as teammate) and `SparSpeakerScore` (none directly — scores are accessed through the spar record). These are **relation fields only** — no new columns are added to existing tables. The foreign keys live on `SparRecord`.

```text
Member gains:
  sparRecords            SparRecord[]   @relation("SparRecordMember")
  sparRecordsAsTeammate  SparRecord[]   @relation("SparTeammateMember")

cabinet gains:
  sparRecords            SparRecord[]   @relation("SparRecordCabinet")
  sparRecordsAsTeammate  SparRecord[]   @relation("SparTeammateCabinet")

President gains:
  sparRecords            SparRecord[]   @relation("SparRecordPresident")
  sparRecordsAsTeammate  SparRecord[]   @relation("SparTeammatePresident")
```

These are back-references only. They add no columns to the `Member`/`cabinet`/`President` tables. The migration creates only the `SparRecord` and `SparSpeakerScore` tables.

---

## 11. Build Plan — Phases

### Phase S0: Schema & Migration
**What:** Add `SparRecord` and `SparSpeakerScore` models to `prisma/schema.prisma`. Run migration.
**Deliverables:**
- Updated schema with both models, all indexes, all relations
- Clean migration that does not touch existing tables
- Verified with `prisma generate` and `prisma migrate dev`

**Done when:** Schema compiles, migration applies cleanly, existing tables unaffected.

---

### Phase S1: Types & Validation
**What:** Create `spar-types.ts` and `spar-validation.ts`.
**Deliverables:**
- TypeScript types for spar domain objects
- Zod v4 schemas for submit request, history query params, leaderboard query params
- Position-to-role mapping utility
- Team rank-to-points mapping utility

**Done when:** Types compile, Zod schemas validate correct inputs and reject invalid ones.

---

### Phase S2: Repository
**What:** Create `spar-repository.ts` with all Prisma access.
**Deliverables:**
- `createSpar()` — single create with nested scores
- `getSparsByUser()` — paginated history query
- `deleteSpar()` — delete with ownership check
- `getSparAggregates()` — aggregation for leaderboard (counts, dates per user)
- `checkDuplicate()` — duplicate guard query

**Done when:** All repository functions work against the real schema.

---

### Phase S3: Service & Leaderboard Logic
**What:** Create `spar-service.ts` and `spar-leaderboard.ts`.
**Deliverables:**
- `submitSpar()` — validate, compute derived fields, check duplicate, call repo
- `getSparHistory()` — call repo with pagination
- `deleteSpar()` — ownership check, call repo
- `getSparLeaderboard()` — call repo for aggregates, compute streaks + points + ranks in memory
- Streak calculation as a pure function
- Point calculation as a pure function

**Done when:** Service functions correctly orchestrate validation → repo → response shaping.

---

### Phase S4: API Routes
**What:** Create route handlers under `app/api/spar/`.
**Deliverables:**
- `POST /api/spar/submit` — auth guard, zod validate, call service, return created record
- `GET /api/spar/history` — auth guard, parse query, call service, return paginated list
- `GET /api/spar/leaderboard` — auth guard, parse query, call service, return rankings
- `DELETE /api/spar/[sparId]` — auth guard, call service, return success

**Done when:** All routes respond correctly for valid and invalid inputs. Auth enforced.

---

### Phase S5: Frontend — Spar Submission Form
**What:** Build the spar submission form UI.
**Deliverables:**
- Spar submission page/component
- Form with conditional fields (teammate vs iron-man flow)
- Client-side validation matching server Zod schemas
- Success/error feedback
- Accessible, responsive

**Done when:** A user can submit a spar through the form and see it in their history.

---

### Phase S6: Frontend — Spar History & Leaderboard
**What:** Build history view and leaderboard UI.
**Deliverables:**
- Spar history page showing user's own past spars with pagination
- Leaderboard page showing rankings, spar counts, streaks
- "My rank" highlight
- Delete spar action (from history view)

**Done when:** Users can view their history, browse the leaderboard, and delete their own spars.

---

### Phase S7: Pairing Engine Integration
**What:** Wire spar data into the pairing engine's metric pipeline.
**Deliverables:**
- Metric update service reads from both `SpeakerScoreRecord` and `SparSpeakerScore`
- Source discriminator (`"session"` vs `"spar"`) applied to metric weight
- Spar weight discount configurable (default `0.6x`)
- `MemberMetricSnapshot` updates reflect spar data with discounted confidence

**Done when:** A member with spar history has different (richer) metric snapshots than one without.

---

## 12. Out of Scope (V1)

These are explicitly NOT part of V1:

- Spar approval/verification workflow
- Cross-linking A and B's submissions for the same spar
- Spar-based team dynamics ratings
- Spar adjudicator or chair tracking
- Spar-specific WebSocket events
- Leaderboard time-window filtering (monthly/semester views)
- Spar statistics dashboard
- Export spar data
- Notification on leaderboard rank changes

These may be added in future versions if needed.

---

## 13. Dependency Map

```text
Phase S0 (Schema)
  └── Phase S1 (Types & Validation)
       └── Phase S2 (Repository)
            └── Phase S3 (Service & Leaderboard Logic)
                 └── Phase S4 (API Routes)
                      ├── Phase S5 (Frontend — Form)
                      └── Phase S6 (Frontend — History & Leaderboard)

Phase S7 (Pairing Integration) depends on S2 + the existing metric pipeline
```

S5 and S6 can run in parallel once S4 is complete.
S7 can start once S2 is complete, independent of frontend work.
