-- One-time backfill for legacy Session.motiontype values that drifted from
-- the pairing-era Session.motionType field. Safe to re-run because it only
-- updates rows whose values currently differ.
UPDATE "Session"
SET "motiontype" = "motionType"
WHERE "motionType" IS NOT NULL
  AND "motiontype" IS DISTINCT FROM "motionType";
