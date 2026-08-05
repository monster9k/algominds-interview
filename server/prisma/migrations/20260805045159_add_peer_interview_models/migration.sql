-- CreateEnum
CREATE TYPE "PeerSessionStatus" AS ENUM ('WAITING_FOR_PEER', 'ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PeerRole" AS ENUM ('CANDIDATE', 'PEER_INTERVIEWER');

-- CreateTable
CREATE TABLE "peer_interview_sessions" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "peerInterviewerId" TEXT,
    "problemId" TEXT NOT NULL,
    "status" "PeerSessionStatus" NOT NULL DEFAULT 'WAITING_FOR_PEER',
    "inviteCode" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "peer_interview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_interview_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "PeerRole" NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peer_interview_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_interview_evaluations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "candidateScore" INTEGER NOT NULL,
    "candidateFeedback" TEXT NOT NULL,
    "peerInterviewerScore" INTEGER NOT NULL,
    "peerInterviewerFeedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peer_interview_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "peer_interview_sessions_inviteCode_key" ON "peer_interview_sessions"("inviteCode");

-- CreateIndex
CREATE INDEX "peer_interview_sessions_candidateId_idx" ON "peer_interview_sessions"("candidateId");

-- CreateIndex
CREATE INDEX "peer_interview_sessions_peerInterviewerId_idx" ON "peer_interview_sessions"("peerInterviewerId");

-- CreateIndex
CREATE INDEX "peer_interview_messages_sessionId_createdAt_idx" ON "peer_interview_messages"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "peer_interview_evaluations_sessionId_key" ON "peer_interview_evaluations"("sessionId");

-- AddForeignKey
ALTER TABLE "peer_interview_sessions" ADD CONSTRAINT "peer_interview_sessions_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_interview_sessions" ADD CONSTRAINT "peer_interview_sessions_peerInterviewerId_fkey" FOREIGN KEY ("peerInterviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_interview_sessions" ADD CONSTRAINT "peer_interview_sessions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_interview_messages" ADD CONSTRAINT "peer_interview_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "peer_interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_interview_evaluations" ADD CONSTRAINT "peer_interview_evaluations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "peer_interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
