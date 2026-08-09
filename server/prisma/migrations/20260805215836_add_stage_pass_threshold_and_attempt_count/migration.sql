-- AlterTable
ALTER TABLE "career_track_stages" ADD COLUMN     "passThreshold" INTEGER NOT NULL DEFAULT 70;

-- AlterTable
ALTER TABLE "journey_stage_progress" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0;
