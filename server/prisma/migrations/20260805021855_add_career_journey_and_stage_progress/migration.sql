-- CreateEnum
CREATE TYPE "JourneyStatus" AS ENUM ('IN_PROGRESS', 'PASSED', 'FAILED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'ACTIVE', 'PASSED', 'FAILED');

-- CreateTable
CREATE TABLE "career_journeys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "status" "JourneyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "career_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_stage_progress" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "sessionId" TEXT,
    "questAttemptId" TEXT,
    "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "journey_stage_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "career_journeys_userId_status_idx" ON "career_journeys"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "journey_stage_progress_sessionId_key" ON "journey_stage_progress"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "journey_stage_progress_questAttemptId_key" ON "journey_stage_progress"("questAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "journey_stage_progress_journeyId_stageId_key" ON "journey_stage_progress"("journeyId", "stageId");

-- AddForeignKey
ALTER TABLE "career_journeys" ADD CONSTRAINT "career_journeys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_journeys" ADD CONSTRAINT "career_journeys_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "career_tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_stage_progress" ADD CONSTRAINT "journey_stage_progress_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "career_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_stage_progress" ADD CONSTRAINT "journey_stage_progress_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "career_track_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_stage_progress" ADD CONSTRAINT "journey_stage_progress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_stage_progress" ADD CONSTRAINT "journey_stage_progress_questAttemptId_fkey" FOREIGN KEY ("questAttemptId") REFERENCES "quest_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
