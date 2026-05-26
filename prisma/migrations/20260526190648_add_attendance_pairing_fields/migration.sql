-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "debatedAlone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pairingCode" TEXT;
