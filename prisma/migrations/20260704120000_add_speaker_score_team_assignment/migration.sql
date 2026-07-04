-- Preserve existing score rows while making future pair-metric aggregation exact.
ALTER TABLE "SpeakerScoreRecord" ADD COLUMN "teamAssignmentId" TEXT;

ALTER TABLE "SpeakerScoreRecord"
  ADD CONSTRAINT "SpeakerScoreRecord_teamAssignmentId_fkey"
  FOREIGN KEY ("teamAssignmentId") REFERENCES "DebateTeamAssignment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "SpeakerScoreRecord_teamAssignmentId_idx" ON "SpeakerScoreRecord"("teamAssignmentId");
