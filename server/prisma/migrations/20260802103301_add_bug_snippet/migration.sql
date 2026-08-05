-- CreateTable
CREATE TABLE "bug_snippets" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "code" TEXT NOT NULL,
    "buggyLine" INTEGER NOT NULL,
    "explanation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bug_snippets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bug_snippets_language_difficulty_isActive_idx" ON "bug_snippets"("language", "difficulty", "isActive");
