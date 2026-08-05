-- AlterEnum
ALTER TYPE "StageKind" ADD VALUE 'PEER_INTERVIEW';

-- AlterTable
ALTER TABLE "career_tracks" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "journey_stage_progress" ADD COLUMN     "peerInterviewSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "journey_stage_progress_peerInterviewSessionId_key" ON "journey_stage_progress"("peerInterviewSessionId");

-- AddForeignKey
ALTER TABLE "career_tracks" ADD CONSTRAINT "career_tracks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_stage_progress" ADD CONSTRAINT "journey_stage_progress_peerInterviewSessionId_fkey" FOREIGN KEY ("peerInterviewSessionId") REFERENCES "peer_interview_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

