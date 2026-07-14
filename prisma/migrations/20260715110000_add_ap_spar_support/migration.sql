-- Add AP spar support without altering existing BP spar records.
ALTER TABLE "SparRecord" ADD COLUMN "debateFormat" TEXT NOT NULL DEFAULT 'BP';
ALTER TABLE "SparRecord" ADD COLUMN "apSide" TEXT;
ALTER TABLE "SparRecord" ALTER COLUMN "bpPosition" DROP NOT NULL;

CREATE TABLE "SparTeammate" (
    "id" TEXT NOT NULL,
    "sparRecordId" TEXT NOT NULL,
    "memberId" TEXT,
    "cabinetId" TEXT,
    "presidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SparTeammate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SparTeammate_sparRecordId_idx" ON "SparTeammate"("sparRecordId");
CREATE INDEX "SparTeammate_memberId_cabinetId_presidentId_idx" ON "SparTeammate"("memberId", "cabinetId", "presidentId");

ALTER TABLE "SparTeammate" ADD CONSTRAINT "SparTeammate_sparRecordId_fkey" FOREIGN KEY ("sparRecordId") REFERENCES "SparRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SparTeammate" ADD CONSTRAINT "SparTeammate_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SparTeammate" ADD CONSTRAINT "SparTeammate_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SparTeammate" ADD CONSTRAINT "SparTeammate_presidentId_fkey" FOREIGN KEY ("presidentId") REFERENCES "President"("id") ON DELETE SET NULL ON UPDATE CASCADE;