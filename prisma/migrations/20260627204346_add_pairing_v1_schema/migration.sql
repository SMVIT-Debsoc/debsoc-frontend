-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "acceptedProposalId" TEXT,
ADD COLUMN     "motionText" TEXT,
ADD COLUMN     "motionType" TEXT,
ADD COLUMN     "pairingObjective" TEXT,
ADD COLUMN     "pairingStatus" TEXT,
ADD COLUMN     "publicationStatus" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedProposalId" TEXT,
ADD COLUMN     "scoringStatus" TEXT,
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "isFinalized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPresent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "presidentId" TEXT,
ADD COLUMN     "unassignedReason" TEXT,
ADD COLUMN     "wasAssigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wasUnassigned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SessionRoleAssignment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "memberId" TEXT,
    "cabinetId" TEXT,
    "presidentId" TEXT,
    "role" TEXT NOT NULL,
    "isChair" BOOLEAN NOT NULL DEFAULT false,
    "roleAssignedAt" TIMESTAMP(3),

    CONSTRAINT "SessionRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairingProposal" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "proposalVersion" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "ruleVersion" TEXT NOT NULL,
    "topBandRank" INTEGER,
    "proposalScore" DOUBLE PRECISION NOT NULL,
    "scoreBreakdownJson" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "isPublishedOfficially" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PairingProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebateRoomAssignment" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "roomIndex" INTEGER NOT NULL,
    "roomScore" DOUBLE PRECISION,
    "roomBalanceScore" DOUBLE PRECISION,
    "roomDifficultyScore" DOUBLE PRECISION,

    CONSTRAINT "DebateRoomAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebateTeamAssignment" (
    "id" TEXT NOT NULL,
    "roomAssignmentId" TEXT NOT NULL,
    "bpPosition" TEXT NOT NULL,
    "teamScore" DOUBLE PRECISION,

    CONSTRAINT "DebateTeamAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSpeakerAssignment" (
    "id" TEXT NOT NULL,
    "teamAssignmentId" TEXT NOT NULL,
    "memberId" TEXT,
    "cabinetId" TEXT,
    "presidentId" TEXT,
    "speakingRole" TEXT NOT NULL,
    "speakerOrder" INTEGER NOT NULL,

    CONSTRAINT "TeamSpeakerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomAdjudicatorAssignment" (
    "id" TEXT NOT NULL,
    "roomAssignmentId" TEXT NOT NULL,
    "memberId" TEXT,
    "cabinetId" TEXT,
    "presidentId" TEXT,
    "isChair" BOOLEAN NOT NULL DEFAULT false,
    "chairAssignmentScore" DOUBLE PRECISION,

    CONSTRAINT "RoomAdjudicatorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnassignedParticipant" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "memberId" TEXT,
    "cabinetId" TEXT,
    "presidentId" TEXT,
    "reason" TEXT NOT NULL,

    CONSTRAINT "UnassignedParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalReviewLog" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalRating" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "issueTagsJson" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakerScoreRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "memberId" TEXT,
    "cabinetId" TEXT,
    "presidentId" TEXT,
    "bpPosition" TEXT NOT NULL,
    "speakingRole" TEXT NOT NULL,
    "rawScore" DOUBLE PRECISION NOT NULL,
    "teamResultPoints" INTEGER NOT NULL,
    "scoredByMemberId" TEXT,
    "scoredByCabinetId" TEXT,
    "scoredByPresidentId" TEXT,

    CONSTRAINT "SpeakerScoreRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChairFeedbackRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "speakerMemberId" TEXT,
    "speakerCabinetId" TEXT,
    "speakerPresidentId" TEXT,
    "chairMemberId" TEXT,
    "chairCabinetId" TEXT,
    "chairPresidentId" TEXT,
    "rating" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ChairFeedbackRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdjudicatorScoreRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "chairMemberId" TEXT,
    "chairCabinetId" TEXT,
    "chairPresidentId" TEXT,
    "adjudicatorMemberId" TEXT,
    "adjudicatorCabinetId" TEXT,
    "adjudicatorPresidentId" TEXT,
    "rating" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AdjudicatorScoreRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairingMetricDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "baseWeight" DOUBLE PRECISION NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isHardRule" BOOLEAN NOT NULL DEFAULT false,
    "isSoftRule" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL,
    "fallbackConfigJson" JSONB,

    CONSTRAINT "PairingMetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairingMetricAdjustment" (
    "id" TEXT NOT NULL,
    "metricDefinitionId" TEXT NOT NULL,
    "currentAdjustment" DOUBLE PRECISION NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceWindowId" TEXT,

    CONSTRAINT "PairingMetricAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberMetricSnapshot" (
    "id" TEXT NOT NULL,
    "memberId" TEXT,
    "cabinetId" TEXT,
    "presidentId" TEXT,
    "metricKey" TEXT NOT NULL,
    "contextKey" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "observationCount" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairMetricSnapshot" (
    "id" TEXT NOT NULL,
    "memberAId" TEXT,
    "cabinetAId" TEXT,
    "presidentAId" TEXT,
    "memberBId" TEXT,
    "cabinetBId" TEXT,
    "presidentBId" TEXT,
    "metricKey" TEXT NOT NULL,
    "contextKey" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "observationCount" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PairMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamDynamicsRating" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "raterMemberId" TEXT,
    "raterCabinetId" TEXT,
    "raterPresidentId" TEXT,
    "teammateMemberId" TEXT,
    "teammateCabinetId" TEXT,
    "teammatePresidentId" TEXT,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamDynamicsRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionRoleAssignment_sessionId_idx" ON "SessionRoleAssignment"("sessionId");

-- CreateIndex
CREATE INDEX "SessionRoleAssignment_sessionId_memberId_cabinetId_presiden_idx" ON "SessionRoleAssignment"("sessionId", "memberId", "cabinetId", "presidentId");

-- CreateIndex
CREATE INDEX "PairingProposal_sessionId_idx" ON "PairingProposal"("sessionId");

-- CreateIndex
CREATE INDEX "PairingProposal_status_idx" ON "PairingProposal"("status");

-- CreateIndex
CREATE INDEX "PairingProposal_sessionId_status_idx" ON "PairingProposal"("sessionId", "status");

-- CreateIndex
CREATE INDEX "PairingProposal_publishedAt_idx" ON "PairingProposal"("publishedAt");

-- CreateIndex
CREATE INDEX "DebateRoomAssignment_proposalId_idx" ON "DebateRoomAssignment"("proposalId");

-- CreateIndex
CREATE INDEX "DebateRoomAssignment_proposalId_roomIndex_idx" ON "DebateRoomAssignment"("proposalId", "roomIndex");

-- CreateIndex
CREATE INDEX "DebateTeamAssignment_roomAssignmentId_idx" ON "DebateTeamAssignment"("roomAssignmentId");

-- CreateIndex
CREATE INDEX "TeamSpeakerAssignment_teamAssignmentId_idx" ON "TeamSpeakerAssignment"("teamAssignmentId");

-- CreateIndex
CREATE INDEX "TeamSpeakerAssignment_memberId_cabinetId_presidentId_idx" ON "TeamSpeakerAssignment"("memberId", "cabinetId", "presidentId");

-- CreateIndex
CREATE INDEX "RoomAdjudicatorAssignment_roomAssignmentId_idx" ON "RoomAdjudicatorAssignment"("roomAssignmentId");

-- CreateIndex
CREATE INDEX "RoomAdjudicatorAssignment_memberId_cabinetId_presidentId_idx" ON "RoomAdjudicatorAssignment"("memberId", "cabinetId", "presidentId");

-- CreateIndex
CREATE INDEX "UnassignedParticipant_proposalId_idx" ON "UnassignedParticipant"("proposalId");

-- CreateIndex
CREATE INDEX "UnassignedParticipant_memberId_cabinetId_presidentId_idx" ON "UnassignedParticipant"("memberId", "cabinetId", "presidentId");

-- CreateIndex
CREATE INDEX "ProposalReviewLog_proposalId_createdAt_idx" ON "ProposalReviewLog"("proposalId", "createdAt");

-- CreateIndex
CREATE INDEX "ProposalReviewLog_reviewerId_idx" ON "ProposalReviewLog"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalRating_proposalId_key" ON "ProposalRating"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalRating_reviewerId_idx" ON "ProposalRating"("reviewerId");

-- CreateIndex
CREATE INDEX "SpeakerScoreRecord_sessionId_idx" ON "SpeakerScoreRecord"("sessionId");

-- CreateIndex
CREATE INDEX "SpeakerScoreRecord_proposalId_idx" ON "SpeakerScoreRecord"("proposalId");

-- CreateIndex
CREATE INDEX "SpeakerScoreRecord_memberId_cabinetId_presidentId_idx" ON "SpeakerScoreRecord"("memberId", "cabinetId", "presidentId");

-- CreateIndex
CREATE INDEX "SpeakerScoreRecord_scoredByMemberId_scoredByCabinetId_score_idx" ON "SpeakerScoreRecord"("scoredByMemberId", "scoredByCabinetId", "scoredByPresidentId");

-- CreateIndex
CREATE INDEX "ChairFeedbackRecord_sessionId_idx" ON "ChairFeedbackRecord"("sessionId");

-- CreateIndex
CREATE INDEX "ChairFeedbackRecord_proposalId_idx" ON "ChairFeedbackRecord"("proposalId");

-- CreateIndex
CREATE INDEX "ChairFeedbackRecord_speakerMemberId_speakerCabinetId_speake_idx" ON "ChairFeedbackRecord"("speakerMemberId", "speakerCabinetId", "speakerPresidentId");

-- CreateIndex
CREATE INDEX "ChairFeedbackRecord_chairMemberId_chairCabinetId_chairPresi_idx" ON "ChairFeedbackRecord"("chairMemberId", "chairCabinetId", "chairPresidentId");

-- CreateIndex
CREATE INDEX "AdjudicatorScoreRecord_sessionId_idx" ON "AdjudicatorScoreRecord"("sessionId");

-- CreateIndex
CREATE INDEX "AdjudicatorScoreRecord_proposalId_idx" ON "AdjudicatorScoreRecord"("proposalId");

-- CreateIndex
CREATE INDEX "AdjudicatorScoreRecord_chairMemberId_chairCabinetId_chairPr_idx" ON "AdjudicatorScoreRecord"("chairMemberId", "chairCabinetId", "chairPresidentId");

-- CreateIndex
CREATE INDEX "AdjudicatorScoreRecord_adjudicatorMemberId_adjudicatorCabin_idx" ON "AdjudicatorScoreRecord"("adjudicatorMemberId", "adjudicatorCabinetId", "adjudicatorPresidentId");

-- CreateIndex
CREATE UNIQUE INDEX "PairingMetricDefinition_key_key" ON "PairingMetricDefinition"("key");

-- CreateIndex
CREATE INDEX "PairingMetricDefinition_category_idx" ON "PairingMetricDefinition"("category");

-- CreateIndex
CREATE INDEX "PairingMetricAdjustment_metricDefinitionId_idx" ON "PairingMetricAdjustment"("metricDefinitionId");

-- CreateIndex
CREATE INDEX "MemberMetricSnapshot_metricKey_contextKey_idx" ON "MemberMetricSnapshot"("metricKey", "contextKey");

-- CreateIndex
CREATE INDEX "MemberMetricSnapshot_memberId_cabinetId_presidentId_idx" ON "MemberMetricSnapshot"("memberId", "cabinetId", "presidentId");

-- CreateIndex
CREATE INDEX "PairMetricSnapshot_metricKey_contextKey_idx" ON "PairMetricSnapshot"("metricKey", "contextKey");

-- CreateIndex
CREATE INDEX "PairMetricSnapshot_memberAId_cabinetAId_presidentAId_member_idx" ON "PairMetricSnapshot"("memberAId", "cabinetAId", "presidentAId", "memberBId", "cabinetBId", "presidentBId");

-- CreateIndex
CREATE INDEX "TeamDynamicsRating_sessionId_idx" ON "TeamDynamicsRating"("sessionId");

-- CreateIndex
CREATE INDEX "TeamDynamicsRating_raterMemberId_raterCabinetId_raterPresid_idx" ON "TeamDynamicsRating"("raterMemberId", "raterCabinetId", "raterPresidentId");

-- CreateIndex
CREATE INDEX "TeamDynamicsRating_teammateMemberId_teammateCabinetId_teamm_idx" ON "TeamDynamicsRating"("teammateMemberId", "teammateCabinetId", "teammatePresidentId");

-- CreateIndex
CREATE INDEX "Session_publishedProposalId_idx" ON "Session"("publishedProposalId");

-- CreateIndex
CREATE INDEX "Session_acceptedProposalId_idx" ON "Session"("acceptedProposalId");

-- CreateIndex
CREATE INDEX "Attendance_sessionId_idx" ON "Attendance"("sessionId");

-- CreateIndex
CREATE INDEX "Attendance_sessionId_memberId_cabinetId_presidentId_idx" ON "Attendance"("sessionId", "memberId", "cabinetId", "presidentId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_acceptedProposalId_fkey" FOREIGN KEY ("acceptedProposalId") REFERENCES "PairingProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_publishedProposalId_fkey" FOREIGN KEY ("publishedProposalId") REFERENCES "PairingProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_presidentId_fkey" FOREIGN KEY ("presidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRoleAssignment" ADD CONSTRAINT "SessionRoleAssignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRoleAssignment" ADD CONSTRAINT "SessionRoleAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRoleAssignment" ADD CONSTRAINT "SessionRoleAssignment_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRoleAssignment" ADD CONSTRAINT "SessionRoleAssignment_presidentId_fkey" FOREIGN KEY ("presidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairingProposal" ADD CONSTRAINT "PairingProposal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateRoomAssignment" ADD CONSTRAINT "DebateRoomAssignment_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "PairingProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateTeamAssignment" ADD CONSTRAINT "DebateTeamAssignment_roomAssignmentId_fkey" FOREIGN KEY ("roomAssignmentId") REFERENCES "DebateRoomAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSpeakerAssignment" ADD CONSTRAINT "TeamSpeakerAssignment_teamAssignmentId_fkey" FOREIGN KEY ("teamAssignmentId") REFERENCES "DebateTeamAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSpeakerAssignment" ADD CONSTRAINT "TeamSpeakerAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSpeakerAssignment" ADD CONSTRAINT "TeamSpeakerAssignment_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSpeakerAssignment" ADD CONSTRAINT "TeamSpeakerAssignment_presidentId_fkey" FOREIGN KEY ("presidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAdjudicatorAssignment" ADD CONSTRAINT "RoomAdjudicatorAssignment_roomAssignmentId_fkey" FOREIGN KEY ("roomAssignmentId") REFERENCES "DebateRoomAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAdjudicatorAssignment" ADD CONSTRAINT "RoomAdjudicatorAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAdjudicatorAssignment" ADD CONSTRAINT "RoomAdjudicatorAssignment_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAdjudicatorAssignment" ADD CONSTRAINT "RoomAdjudicatorAssignment_presidentId_fkey" FOREIGN KEY ("presidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnassignedParticipant" ADD CONSTRAINT "UnassignedParticipant_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "PairingProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnassignedParticipant" ADD CONSTRAINT "UnassignedParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnassignedParticipant" ADD CONSTRAINT "UnassignedParticipant_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnassignedParticipant" ADD CONSTRAINT "UnassignedParticipant_presidentId_fkey" FOREIGN KEY ("presidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalReviewLog" ADD CONSTRAINT "ProposalReviewLog_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "PairingProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalRating" ADD CONSTRAINT "ProposalRating_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "PairingProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakerScoreRecord" ADD CONSTRAINT "SpeakerScoreRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakerScoreRecord" ADD CONSTRAINT "SpeakerScoreRecord_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "PairingProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakerScoreRecord" ADD CONSTRAINT "SpeakerScoreRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakerScoreRecord" ADD CONSTRAINT "SpeakerScoreRecord_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakerScoreRecord" ADD CONSTRAINT "SpeakerScoreRecord_presidentId_fkey" FOREIGN KEY ("presidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakerScoreRecord" ADD CONSTRAINT "SpeakerScoreRecord_scoredByMemberId_fkey" FOREIGN KEY ("scoredByMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakerScoreRecord" ADD CONSTRAINT "SpeakerScoreRecord_scoredByCabinetId_fkey" FOREIGN KEY ("scoredByCabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakerScoreRecord" ADD CONSTRAINT "SpeakerScoreRecord_scoredByPresidentId_fkey" FOREIGN KEY ("scoredByPresidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChairFeedbackRecord" ADD CONSTRAINT "ChairFeedbackRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChairFeedbackRecord" ADD CONSTRAINT "ChairFeedbackRecord_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "PairingProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChairFeedbackRecord" ADD CONSTRAINT "ChairFeedbackRecord_speakerMemberId_fkey" FOREIGN KEY ("speakerMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChairFeedbackRecord" ADD CONSTRAINT "ChairFeedbackRecord_speakerCabinetId_fkey" FOREIGN KEY ("speakerCabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChairFeedbackRecord" ADD CONSTRAINT "ChairFeedbackRecord_speakerPresidentId_fkey" FOREIGN KEY ("speakerPresidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChairFeedbackRecord" ADD CONSTRAINT "ChairFeedbackRecord_chairMemberId_fkey" FOREIGN KEY ("chairMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChairFeedbackRecord" ADD CONSTRAINT "ChairFeedbackRecord_chairCabinetId_fkey" FOREIGN KEY ("chairCabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChairFeedbackRecord" ADD CONSTRAINT "ChairFeedbackRecord_chairPresidentId_fkey" FOREIGN KEY ("chairPresidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjudicatorScoreRecord" ADD CONSTRAINT "AdjudicatorScoreRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjudicatorScoreRecord" ADD CONSTRAINT "AdjudicatorScoreRecord_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "PairingProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjudicatorScoreRecord" ADD CONSTRAINT "AdjudicatorScoreRecord_chairMemberId_fkey" FOREIGN KEY ("chairMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjudicatorScoreRecord" ADD CONSTRAINT "AdjudicatorScoreRecord_chairCabinetId_fkey" FOREIGN KEY ("chairCabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjudicatorScoreRecord" ADD CONSTRAINT "AdjudicatorScoreRecord_chairPresidentId_fkey" FOREIGN KEY ("chairPresidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjudicatorScoreRecord" ADD CONSTRAINT "AdjudicatorScoreRecord_adjudicatorMemberId_fkey" FOREIGN KEY ("adjudicatorMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjudicatorScoreRecord" ADD CONSTRAINT "AdjudicatorScoreRecord_adjudicatorCabinetId_fkey" FOREIGN KEY ("adjudicatorCabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjudicatorScoreRecord" ADD CONSTRAINT "AdjudicatorScoreRecord_adjudicatorPresidentId_fkey" FOREIGN KEY ("adjudicatorPresidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairingMetricAdjustment" ADD CONSTRAINT "PairingMetricAdjustment_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "PairingMetricDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberMetricSnapshot" ADD CONSTRAINT "MemberMetricSnapshot_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberMetricSnapshot" ADD CONSTRAINT "MemberMetricSnapshot_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberMetricSnapshot" ADD CONSTRAINT "MemberMetricSnapshot_presidentId_fkey" FOREIGN KEY ("presidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairMetricSnapshot" ADD CONSTRAINT "PairMetricSnapshot_memberAId_fkey" FOREIGN KEY ("memberAId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairMetricSnapshot" ADD CONSTRAINT "PairMetricSnapshot_cabinetAId_fkey" FOREIGN KEY ("cabinetAId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairMetricSnapshot" ADD CONSTRAINT "PairMetricSnapshot_presidentAId_fkey" FOREIGN KEY ("presidentAId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairMetricSnapshot" ADD CONSTRAINT "PairMetricSnapshot_memberBId_fkey" FOREIGN KEY ("memberBId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairMetricSnapshot" ADD CONSTRAINT "PairMetricSnapshot_cabinetBId_fkey" FOREIGN KEY ("cabinetBId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairMetricSnapshot" ADD CONSTRAINT "PairMetricSnapshot_presidentBId_fkey" FOREIGN KEY ("presidentBId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDynamicsRating" ADD CONSTRAINT "TeamDynamicsRating_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDynamicsRating" ADD CONSTRAINT "TeamDynamicsRating_raterMemberId_fkey" FOREIGN KEY ("raterMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDynamicsRating" ADD CONSTRAINT "TeamDynamicsRating_raterCabinetId_fkey" FOREIGN KEY ("raterCabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDynamicsRating" ADD CONSTRAINT "TeamDynamicsRating_raterPresidentId_fkey" FOREIGN KEY ("raterPresidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDynamicsRating" ADD CONSTRAINT "TeamDynamicsRating_teammateMemberId_fkey" FOREIGN KEY ("teammateMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDynamicsRating" ADD CONSTRAINT "TeamDynamicsRating_teammateCabinetId_fkey" FOREIGN KEY ("teammateCabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDynamicsRating" ADD CONSTRAINT "TeamDynamicsRating_teammatePresidentId_fkey" FOREIGN KEY ("teammatePresidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;

