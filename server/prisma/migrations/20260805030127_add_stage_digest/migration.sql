-- CreateTable
CREATE TABLE "stage_digests" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceCount" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_digests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stage_digests_stageId_key" ON "stage_digests"("stageId");

-- AddForeignKey
ALTER TABLE "stage_digests" ADD CONSTRAINT "stage_digests_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "career_track_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
