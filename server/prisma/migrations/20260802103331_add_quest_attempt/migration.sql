-- CreateTable
CREATE TABLE "quest_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "score" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "wrongCount" INTEGER NOT NULL,
    "bestCombo" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quest_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quest_attempts_userId_createdAt_idx" ON "quest_attempts"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "quest_attempts" ADD CONSTRAINT "quest_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
