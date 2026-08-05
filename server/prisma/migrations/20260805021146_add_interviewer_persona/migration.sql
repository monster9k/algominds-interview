-- CreateEnum
CREATE TYPE "PersonaTone" AS ENUM ('STRICT', 'FRIENDLY', 'SKEPTICAL', 'LENIENT');

-- CreateTable
CREATE TABLE "interviewer_personas" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tone" "PersonaTone" NOT NULL,
    "systemPromptExtra" TEXT NOT NULL,
    "unlockCost" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interviewer_personas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "interviewer_personas_key_key" ON "interviewer_personas"("key");
