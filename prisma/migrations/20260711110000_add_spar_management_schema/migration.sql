-- Add spar management tables without mutating existing data tables.
CREATE TABLE "SparRecord" (
    "id" TEXT NOT NULL,
    "sparDate" TIMESTAMP(3) NOT NULL,
    "motionType" TEXT NOT NULL,
    "motionText" TEXT,
    "bpPosition" TEXT NOT NULL,
    "isIronMan" BOOLEAN NOT NULL DEFAULT false,
    "teamRank" INTEGER NOT NULL,
    "teamResultPoints" INTEGER NOT NULL,
    "memberId" TEXT,
    "cabinetId" TEXT,
    "presidentId" TEXT,
    "teammateMemberId" TEXT,
    "teammateCabinetId" TEXT,
    "teammatePresidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SparRecord_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SparRecord_submitter_exactly_one_check" CHECK (
        (("memberId" IS NOT NULL)::int + ("cabinetId" IS NOT NULL)::int + ("presidentId" IS NOT NULL)::int) = 1
    ),
    CONSTRAINT "SparRecord_teammate_shape_check" CHECK (
        (
            "isIronMan" = true
            AND "teammateMemberId" IS NULL
            AND "teammateCabinetId" IS NULL
            AND "teammatePresidentId" IS NULL
        )
        OR
        (
            "isIronMan" = false
            AND (("teammateMemberId" IS NOT NULL)::int + ("teammateCabinetId" IS NOT NULL)::int + ("teammatePresidentId" IS NOT NULL)::int) = 1
        )
    ),
    CONSTRAINT "SparRecord_teamRank_check" CHECK ("teamRank" BETWEEN 1 AND 4),
    CONSTRAINT "SparRecord_teamResultPoints_check" CHECK ("teamResultPoints" BETWEEN 0 AND 3)
);

CREATE TABLE "SparSpeakerScore" (
    "id" TEXT NOT NULL,
    "sparRecordId" TEXT NOT NULL,
    "speakingRole" TEXT NOT NULL,
    "speakerScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SparSpeakerScore_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SparRecord_memberId_cabinetId_presidentId_idx" ON "SparRecord"("memberId", "cabinetId", "presidentId");
CREATE INDEX "SparRecord_teammateMemberId_teammateCabinetId_teammatePresidentId_idx" ON "SparRecord"("teammateMemberId", "teammateCabinetId", "teammatePresidentId");
CREATE INDEX "SparRecord_sparDate_idx" ON "SparRecord"("sparDate");
CREATE INDEX "SparSpeakerScore_sparRecordId_idx" ON "SparSpeakerScore"("sparRecordId");

ALTER TABLE "SparRecord" ADD CONSTRAINT "SparRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SparRecord" ADD CONSTRAINT "SparRecord_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SparRecord" ADD CONSTRAINT "SparRecord_presidentId_fkey" FOREIGN KEY ("presidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SparRecord" ADD CONSTRAINT "SparRecord_teammateMemberId_fkey" FOREIGN KEY ("teammateMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SparRecord" ADD CONSTRAINT "SparRecord_teammateCabinetId_fkey" FOREIGN KEY ("teammateCabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SparRecord" ADD CONSTRAINT "SparRecord_teammatePresidentId_fkey" FOREIGN KEY ("teammatePresidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SparSpeakerScore" ADD CONSTRAINT "SparSpeakerScore_sparRecordId_fkey" FOREIGN KEY ("sparRecordId") REFERENCES "SparRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;