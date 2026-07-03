# Graph Report - .  (2026-07-03)

## Corpus Check
- Large corpus: 531 files · ~1,003,787 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1213 nodes · 2511 edges · 97 communities (54 shown, 43 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 235 edges (avg confidence: 0.81)
- Token cost: 385,184 input · 42,799 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Pairing Publish & Review|Pairing Publish & Review]]
- [[_COMMUNITY_Eval Harness|Eval Harness]]
- [[_COMMUNITY_Session Repository|Session Repository]]
- [[_COMMUNITY_Auth & Legacy Dashboards|Auth & Legacy Dashboards]]
- [[_COMMUNITY_Session Workspace UI|Session Workspace UI]]
- [[_COMMUNITY_Cabinet API Routes|Cabinet API Routes]]
- [[_COMMUNITY_Legacy API Routes|Legacy API Routes]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Pairing Fallback & Objectives|Pairing Fallback & Objectives]]
- [[_COMMUNITY_Metrics & Pairing Repository|Metrics & Pairing Repository]]
- [[_COMMUNITY_Pairing Engine Core|Pairing Engine Core]]
- [[_COMMUNITY_Pairing API Routes|Pairing API Routes]]
- [[_COMMUNITY_Pairing Type Contracts|Pairing Type Contracts]]
- [[_COMMUNITY_User Auth Admin Routes|User Auth Admin Routes]]
- [[_COMMUNITY_Pairing Dashboard Bootstrap|Pairing Dashboard Bootstrap]]
- [[_COMMUNITY_Pairing Internal Types|Pairing Internal Types]]
- [[_COMMUNITY_MyPairing UI|MyPairing UI]]
- [[_COMMUNITY_Scoring Repository & Leaderboards|Scoring Repository & Leaderboards]]
- [[_COMMUNITY_Attendance & Scoring Routes|Attendance & Scoring Routes]]
- [[_COMMUNITY_Admin Dashboard & Roster|Admin Dashboard & Roster]]
- [[_COMMUNITY_Candidate & Chair Assignment|Candidate & Chair Assignment]]
- [[_COMMUNITY_Leaderboards & MyScoring UI|Leaderboards & MyScoring UI]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Layouts & SEO|Layouts & SEO]]
- [[_COMMUNITY_Prisma Seed|Prisma Seed]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]

## God Nodes (most connected - your core abstractions)
1. `error()` - 113 edges
2. `ok()` - 98 edges
3. `requireSessionUser()` - 90 edges
4. `parseJson()` - 38 edges
5. `pairing types` - 26 edges
6. `SessionId` - 20 edges
7. `MemberId` - 19 edges
8. `compilerOptions` - 17 edges
9. `getAppSession()` - 12 edges
10. `DebsocRole` - 12 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getPublishedPairing()`  [INFERRED]
  app/api/pairing/published/[sessionId]/route.ts → lib/server/sessions/services.test.ts
- `POST()` --calls--> `requireSessionUser()`  [INFERRED]
  app/api/attendance/mark/route.ts → lib/server/guards.ts
- `POST()` --calls--> `error()`  [INFERRED]
  app/api/attendance/mark/route.ts → lib/server/http.ts
- `POST()` --calls--> `ok()`  [INFERRED]
  app/api/attendance/mark/route.ts → lib/server/http.ts
- `POST()` --calls--> `error()`  [INFERRED]
  app/api/cabinet/attendance/mark/route.ts → lib/server/http.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Auth Login Flow** — auth_layout, login_page, login_loginclient, debsoc_frontend_auth [INFERRED 0.85]
- **Attendance lifecycle routes** — attendance_prepare_route, attendance_mark_route, cabinet_attendance_mark_route, cabinet_attendance_my_route, member_attendance_route [INFERRED 0.85]
- **Leaderboard endpoints** — leaderboard_route, leaderboard_speakers_route, leaderboard_adjudicators_route [INFERRED 0.85]
- **Cabinet messaging/feedback** — cabinet_feedback_give_route, cabinet_feedback_sent_route, cabinet_messages_president_route, cabinet_messages_sent_route, member_feedback_route [INFERRED 0.75]
- **Pairing proposal lifecycle routes** — generate_route_pairing, proposalid_route_proposal_pairing, approve_route_proposalid_pairing, override_route_proposalid_pairing, rate_route_proposalid_pairing, regenerate_route_proposalid_pairing, sessionid_route_publish_pairing, sessionid_route_published_pairing [INFERRED 0.85]
- **Member auth routes** — login_route_member, register_route_member [INFERRED 0.85]
- **President auth+dashboard routes** — login_route_president, register_route_president, dashboard_route_president [INFERRED 0.85]
- **Techhead delete user routes** — cabinet_delete_route, member_delete_route, president_delete_route [INFERRED 0.85]
- **Techhead unverify user routes** — cabinet_unverify_route, member_unverify_route, president_unverify_route [INFERRED 0.85]
- **Scoring endpoints** — chair_scoring_route, speaker_scoring_route, scoring-status_sessionid_route [INFERRED 0.75]
- **TechHead verification routes** — cabinet_route_verify, member_route_verify, president_route_verify, techhead_dashboard_page [INFERRED 0.85]
- **Role-specific dashboards** — cabinet_dashboard_page, president_dashboard_page, techhead_dashboard_page, pairing_dashboard_page, dashboard_layout [INFERRED 0.80]
- **Landing page composition** — components_home, components_navbar, components_footer, components_gallerysection, components_teamsection, components_whychoosedebsoc [INFERRED 0.75]
- **Admin pairing dashboard flow** — pairing_adminpairingdashboard, pairing_sessions, pairing_roster, pairing_leaderboards, pairing_sessionworkspace [INFERRED 0.75]
- **Participant pairing dashboard flow** — pairing_participantpairingdashboard, pairing_mypairing, pairing_myscoring, pairing_homedashboard [INFERRED 0.75]
- **Pairing System Core Docs** — docs_01_overview, docs_11_backend_implementation_map, docs_14_api_routing_map, docs_15_engineering_quality_standard, docs_16_build_plan [INFERRED 0.85]
- **Metrics & Engine Pipeline** — docs_04_pairing_engine_flow, docs_05_pairing_metrics, docs_09_metric_formulas, docs_13_pairing_learning_loop [INFERRED 0.85]
- **Pre-coding Gate Docs** — docs_07_open_questions, docs_08_pre_coding_decisions, docs_16_build_plan [INFERRED 0.85]
- **Pairing engine pipeline** — pairing_engine, pairing_candidate_generator, pairing_chair_assignment [INFERRED 0.85]
- **Eval harness pipeline** — eval_harness, eval_replay_runner, eval_regression_checker, eval_report_builder, eval_synthetic_scenarios [INFERRED 0.85]
- **Server transport primitives** — server_guards, server_http, server_roles, server_prisma [INFERRED 0.75]
- **Proposal scoring/selection/publish pipeline** — pairing_proposal_scorer, pairing_proposal_selector, pairing_review, pairing_publish [INFERRED 0.85]
- **Engine constraint & fallback helpers** — pairing_hard_rules, pairing_fallback, pairing_leftovers, pairing_objectives [INFERRED 0.75]
- **Realtime websocket stack** — realtime_channel_auth, realtime_event_publisher, realtime_websocket_hub, realtime_types [INFERRED 0.85]
- **Scoring services layer** — scoring_chair_scoring_service, scoring_speaker_scoring_service, scoring_leaderboard_service, scoring_metric_update_service, repositories_scoring_repository [INFERRED 0.85]
- **Sessions services layer** — sessions_attendance_service, sessions_session_role_service, sessions_session_service, repositories_session_repository [INFERRED 0.85]
- **Pairing schema migrations** — migrations_add_attendance_pairing_fields, migrations_add_pairing_v1_schema, migrations_add_eval_tuning_models, migrations_retire_legacy_feedback_and_tasks [INFERRED 0.85]
- **pairing domain types** — types_pairing, types_scoring, types_session, types_eval, types_realtime [INFERRED 0.75]

## Communities (97 total, 43 thin omitted)

### Community 0 - "Pairing Publish & Review"
Cohesion: 0.05
Nodes (56): { generatePairingProposal }, createPairingPublishService(), PairingPublishError, PairingPublishRepositoryContract, { publishApprovedProposal, getPublishedPairing }, PublishPairingResult, createPairingReviewService(), { getProposalView, approveProposal, overrideProposal, regenerateProposal, rateProposal } (+48 more)

### Community 1 - "Eval Harness"
Cohesion: 0.06
Nodes (53): EvalRepositoryContract, runPairingEval(), compareEvalReports(), compareStoredEvalReports(), EvalReportRepositoryContract, buildAggregate(), computeChairAssignmentQualityScore(), computeInternalRoleRepetitionRate() (+45 more)

### Community 2 - "Session Repository"
Cohesion: 0.07
Nodes (48): add_session_rules_json migration, emptySessionRules(), normalizeSessionRules(), normalizeTeamUpPreferences(), normalizeTimeConstraints(), ParticipantType, sessionRepository, SessionRepositoryClient (+40 more)

### Community 3 - "Auth & Legacy Dashboards"
Cohesion: 0.06
Nodes (37): authOptions, Cabinet Dashboard, CabinetDashboardPage(), POST /api/techhead/verify/cabinet, metadata, DashboardPage(), POST /api/techhead/verify/member, handler (+29 more)

### Community 4 - "Session Workspace UI"
Cohesion: 0.05
Nodes (28): approveCurrentProposal(), AttendanceDraft, canAdvance(), computeStepAvailability(), deriveManualOverrideState(), deriveStepFromContext(), deriveStepFromWorkspace(), deriveUiState() (+20 more)

### Community 5 - "Cabinet API Routes"
Cohesion: 0.08
Nodes (25): POST(), POST(), GET(), POST(), GET(), GET(), POST(), GET() (+17 more)

### Community 6 - "Legacy API Routes"
Cohesion: 0.11
Nodes (26): GET(), GET(), GET(), POST(), GET(), POST(), GET(), GET() (+18 more)

### Community 7 - "Package Dependencies"
Cohesion: 0.04
Nodes (44): dependencies, bcryptjs, clsx, dotenv, framer-motion, gsap, @gsap/react, lucide-react (+36 more)

### Community 8 - "Pairing Fallback & Objectives"
Cohesion: 0.11
Nodes (39): blendSpecificWithFallback(), computeConfidence(), resolveMetricWithFallback(), pairing/pairing-internals.test.ts, applyObjectiveMultiplier(), getObjectiveMultipliers(), objectiveMultipliers, average() (+31 more)

### Community 9 - "Metrics & Pairing Repository"
Cohesion: 0.07
Nodes (27): PersistGeneratedProposalInput, buildPairKeyFromRefs(), createMetricsRepository(), MetricsRepositoryClient, ParticipantRef, resolveParticipantId(), BENCH_POSITION_ORDER, buildMotionTypeHistoryMap() (+19 more)

### Community 10 - "Pairing Engine Core"
Cohesion: 0.08
Nodes (20): MetricsLoaderContract, MetricsRepositoryContract, PairingRepositoryContract, pairing/pairing-engine.test.ts, EARLY_SPEAKING_ROLES, isCandidateValid(), SpeakerAssignmentLocation, validateHardRules() (+12 more)

### Community 11 - "Pairing API Routes"
Cohesion: 0.11
Nodes (18): GET(), POST(), POST(), POST(), POST(), GET(), POST(), POST() (+10 more)

### Community 12 - "Pairing Type Contracts"
Cohesion: 0.07
Nodes (27): ApproveProposalRequest, ApproveProposalResponse, benchPositions, GeneratePairingProposalRequest, GeneratePairingProposalResponse, LeftoverReason, leftoverReasons, MetricKey (+19 more)

### Community 13 - "User Auth Admin Routes"
Cohesion: 0.13
Nodes (16): POST(), POST(), POST(), POST(), POST(), POST(), DELETE(), DELETE() (+8 more)

### Community 14 - "Pairing Dashboard Bootstrap"
Cohesion: 0.10
Nodes (24): ApiAdjudicatorLeaderboardEntry, ApiAdminSession, ApiAttendanceHistory, ApiCabinet, ApiMember, ApiPresident, ApiProgressSummary, ApiSpeakerLeaderboardEntry (+16 more)

### Community 15 - "Pairing Internal Types"
Cohesion: 0.10
Nodes (25): ProposalOverrideResult, AdjudicatorCandidate, ChairAllocationContext, GeneratedProposalAuditRecord, HardRuleViolation, PairingGenerationSuccess, PairingInternalContext, PairingInternalMotionTypeHistoryMap (+17 more)

### Community 16 - "MyPairing UI"
Cohesion: 0.09
Nodes (10): MyPairingProps, ParticipantRoomView, PublishedPairingResponse, PARTICIPANT_TABS, ParticipantPairingDashboardProps, ParticipantTab, SessionsProps, AttendanceHistoryItem (+2 more)

### Community 17 - "Scoring Repository & Leaderboards"
Cohesion: 0.14
Nodes (21): ParticipantType, ScoringRepositoryClient, createLeaderboardService(), LeaderboardRepositoryContract, {
  recomputeSpeakerLeaderboard,
  recomputeAdjudicatorLeaderboard,
  recomputeChairDerivedStats,
  getParticipantProgressSummaries,
  getParticipantProgressProfile,
  getParticipantProgressSummary,
}, MemberId, AdjudicatorLeaderboardEntry, AdjudicatorLeaderboardResponse (+13 more)

### Community 18 - "Attendance & Scoring Routes"
Cohesion: 0.12
Nodes (17): POST(), POST(), GET(), POST(), parseJson(), POST(), POST(), pairingObjectives (+9 more)

### Community 19 - "Admin Dashboard & Roster"
Cohesion: 0.11
Nodes (16): ADMIN_TABS, AdminPairingDashboardProps, AdminTab, getInitials(), Roster(), RosterProps, AccountType, AdjudicatorLeaderboardRow (+8 more)

### Community 20 - "Candidate & Chair Assignment"
Cohesion: 0.17
Nodes (17): benchPositions, buildPrioritizedSpeakerOrder(), generateCandidateProposals(), rotateArray(), speakingRoles, assignChairsToRooms(), computeChairAssignmentScore(), getAdjudicatorScore() (+9 more)

### Community 21 - "Leaderboards & MyScoring UI"
Cohesion: 0.13
Nodes (12): LeaderboardsProps, MyScoringProps, PublishedPairingResponse, ScoringTaskView, TaskStatusResponse, pairing types, Card(), EmptyState() (+4 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 23 - "Layouts & SEO"
Cohesion: 0.13
Nodes (7): metadata, metadata, metadata, buildPublicPageMetadata(), noIndexMetadata, PublicPageInput, metadata

### Community 24 - "Prisma Seed"
Cohesion: 0.17
Nodes (18): average(), bucket(), clearDemoData(), createRoles(), main(), nested(), NumericBucket, pairKey() (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (6): fadeUpVariants, timelineData, cn(), PairingBackdrop(), ElegantShape(), HeroGeometric()

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (12): PairingEngineDependencies, buildContext(), buildMemberSnapshots(), buildPairSnapshots(), createSeededRandom(), rankProbabilities, selectProposalFromTopBand(), PairingCandidate (+4 more)

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (7): AlumniSection(), AlumniSectionProps, fallbackData, socialIcons, NavItem, Review, reviews

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (8): AdjudicatorScoreRow, ChairFeedbackRow, createMetricUpdateService(), MetricRepositoryContract, ParticipantType, SpeakerScoreRow, TeamDynamicsRow, {
  updateLearnedMetricsFromSession,
  updatePairMetricSnapshotsFromSession,
  updateRolePerformanceFromSession,
}

### Community 30 - "Community 30"
Cohesion: 0.17
Nodes (4): metadata, organizationJsonLd, websiteJsonLd, indexedRoutes

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (13): Pairing System Overview, Pairing Engine Flow, Pairing Metrics, Metric Formulas, Backend Implementation Map, Backend Data Model Map, API Routing Map, Engineering Quality Standard (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (8): ChairScoringError, ChairScoringRepositoryContract, createChairScoringService(), ParticipantType, { submitChairAdjudicatorScore }, SubmitChairAdjudicatorScoreInput, ChairScoringRequest, ScoreSubmissionResponse

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (7): Achievement, ACHIEVEMENTS, CARD_ACCENTS, GALLERY_ITEMS, GalleryItem, GallerySection(), GallerySectionProps

### Community 34 - "Community 34"
Cohesion: 0.20
Nodes (7): deriveLastSessionDetails(), HomeDashboard(), HomeDashboardProps, LastSessionDetails, MotionPerformance, resolveParticipantName(), PrimaryButton()

### Community 35 - "Community 35"
Cohesion: 0.20
Nodes (8): scoringRepository, createSpeakerScoringService(), ParticipantType, SpeakerScoringError, SpeakerScoringRepositoryContract, { submitSpeakerScore, submitSpeakerChairRating }, SubmitSpeakerScoreInput, SpeakerScoringRequest

### Community 36 - "Community 36"
Cohesion: 0.20
Nodes (3): Department, DEPARTMENTS, Member

### Community 37 - "Community 37"
Cohesion: 0.25
Nodes (4): metadata, NavLink, navLinks, Providers()

### Community 39 - "Community 39"
Cohesion: 0.43
Nodes (4): POST(), POST(), POST(), verifyEntity()

### Community 40 - "Community 40"
Cohesion: 0.33
Nodes (5): ClockType, DebateTimerPanel(), formatClock(), Debate Timer Layout, Debate Timer Page

### Community 44 - "Community 44"
Cohesion: 0.60
Nodes (4): Leaderboard aggregation, GET /api/leaderboard/adjudicators, GET(), GET /api/leaderboard/speakers

### Community 45 - "Community 45"
Cohesion: 0.40
Nodes (5): AGENTS Protocol, Backend Documentation, CLAUDE Instructions, Pairing System Protocol, Transport-Only Route Pattern

### Community 46 - "Community 46"
Cohesion: 0.83
Nodes (4): POST /api/attendance/mark, POST /api/attendance/prepare, POST /api/cabinet/attendance/mark, Attendance marking flow

### Community 47 - "Community 47"
Cohesion: 0.50
Nodes (4): GET /api/cabinet/dashboard, POST /api/cabinet/session/create, GET /api/cabinet/sessions, GET /api/cabinet/tasks

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (3): pairing/proposal/[proposalId]/approve route, pairing/proposal/[proposalId]/override route, pairing/proposal/[proposalId] route

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (3): NextAuth handler, POST /api/cabinet/login, POST /api/cabinet/register

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (3): techhead/delete/cabinet/route.ts, techhead/delete/member/route.ts, techhead/delete/president/route.ts

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (3): POST /api/cabinet/feedback/give, GET /api/cabinet/feedback/sent, GET /api/member/feedback

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (3): techhead/unverify/cabinet/route.ts, techhead/unverify/member/route.ts, techhead/unverify/president/route.ts

### Community 54 - "Community 54"
Cohesion: 1.00
Nodes (3): Pairing eval harness, POST /api/eval/compare, POST /api/eval/replay

### Community 55 - "Community 55"
Cohesion: 0.67
Nodes (3): president/messages route, member/messages/president route, member/messages/sent route

### Community 56 - "Community 56"
Cohesion: 0.67
Nodes (3): add_attendance_pairing_fields migration, add_eval_tuning_models migration, add_pairing_v1_schema migration

### Community 57 - "Community 57"
Cohesion: 0.67
Nodes (3): sessions/[sessionId]/scoring-status/route.ts, sessions/[sessionId]/route.ts, sessions/route.ts

## Knowledge Gaps
- **353 isolated node(s):** `metadata`, `handler`, `AttendanceItem`, `AttendancePeer`, `AttendanceItem` (+348 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pairing types` connect `Leaderboards & MyScoring UI` to `Pairing Publish & Review`, `Eval Harness`, `Community 34`, `Session Workspace UI`, `Pairing Fallback & Objectives`, `Metrics & Pairing Repository`, `Pairing Engine Core`, `Pairing Dashboard Bootstrap`, `MyPairing UI`, `Admin Dashboard & Roster`, `Candidate & Chair Assignment`, `Community 27`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `error()` connect `Cabinet API Routes` to `Legacy API Routes`, `Community 39`, `Pairing API Routes`, `Community 44`, `User Auth Admin Routes`, `Attendance & Scoring Routes`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `adapter` connect `Legacy API Routes` to `Package Dependencies`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Are the 35 inferred relationships involving `error()` (e.g. with `POST()` and `POST()`) actually correct?**
  _`error()` has 35 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `ok()` (e.g. with `POST()` and `GET()`) actually correct?**
  _`ok()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `requireSessionUser()` (e.g. with `POST()` and `GET()`) actually correct?**
  _`requireSessionUser()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `parseJson()` (e.g. with `POST()` and `PATCH()`) actually correct?**
  _`parseJson()` has 3 INFERRED edges - model-reasoned connections that need verification._