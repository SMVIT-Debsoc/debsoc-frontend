-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "memberId" TEXT,
    "cabinetId" TEXT,
    "presidentId" TEXT,
    "leaderboardType" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricAdjustmentHistory" (
    "id" TEXT NOT NULL,
    "metricDefinitionId" TEXT NOT NULL,
    "oldAdjustment" DOUBLE PRECISION NOT NULL,
    "newAdjustment" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "tuningWindowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricAdjustmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalScenario" (
    "id" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inputJson" JSONB NOT NULL,
    "expectedSignalsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvalScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalRun" (
    "id" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "ruleVersion" TEXT NOT NULL,
    "runType" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "summaryJson" JSONB NOT NULL,
    "resultStatus" TEXT NOT NULL,

    CONSTRAINT "EvalRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalScenarioResult" (
    "id" TEXT NOT NULL,
    "evalRunId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "validityJson" JSONB NOT NULL,
    "qualityJson" JSONB NOT NULL,
    "recommendation" TEXT NOT NULL,

    CONSTRAINT "EvalScenarioResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TuningReviewWindow" (
    "id" TEXT NOT NULL,
    "windowStartSessionId" TEXT NOT NULL,
    "windowEndSessionId" TEXT NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "analysisJson" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "TuningReviewWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_memberId_cabinetId_presidentId_idx" ON "LeaderboardSnapshot"("memberId", "cabinetId", "presidentId");

-- CreateIndex
CREATE INDEX "MetricAdjustmentHistory_metricDefinitionId_idx" ON "MetricAdjustmentHistory"("metricDefinitionId");

-- CreateIndex
CREATE INDEX "MetricAdjustmentHistory_tuningWindowId_idx" ON "MetricAdjustmentHistory"("tuningWindowId");

-- CreateIndex
CREATE UNIQUE INDEX "EvalScenario_name_key" ON "EvalScenario"("name");

-- CreateIndex
CREATE INDEX "EvalScenarioResult_evalRunId_idx" ON "EvalScenarioResult"("evalRunId");

-- CreateIndex
CREATE INDEX "EvalScenarioResult_scenarioId_idx" ON "EvalScenarioResult"("scenarioId");

-- AddForeignKey
ALTER TABLE "MetricAdjustmentHistory" ADD CONSTRAINT "MetricAdjustmentHistory_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "PairingMetricDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
