-- AlterTable
ALTER TABLE "career_track_stages" ADD COLUMN     "adaptive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "journey_stage_progress" ADD COLUMN     "pickedReasonTag" TEXT;

-- CreateTable
CREATE TABLE "career_track_stage_problem_pool" (
    "stageId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,

    CONSTRAINT "career_track_stage_problem_pool_pkey" PRIMARY KEY ("stageId","problemId")
);

-- AddForeignKey
ALTER TABLE "career_track_stage_problem_pool" ADD CONSTRAINT "career_track_stage_problem_pool_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "career_track_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_track_stage_problem_pool" ADD CONSTRAINT "career_track_stage_problem_pool_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
