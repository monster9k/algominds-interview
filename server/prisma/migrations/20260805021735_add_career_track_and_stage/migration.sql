-- CreateEnum
CREATE TYPE "StageKind" AS ENUM ('PROBLEM', 'QUEST');

-- CreateTable
CREATE TABLE "career_tracks" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_track_stages" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "StageKind" NOT NULL,
    "problemId" TEXT,
    "personaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_track_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "career_tracks_key_key" ON "career_tracks"("key");

-- CreateIndex
CREATE UNIQUE INDEX "career_track_stages_trackId_order_key" ON "career_track_stages"("trackId", "order");

-- AddForeignKey
ALTER TABLE "career_track_stages" ADD CONSTRAINT "career_track_stages_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "career_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_track_stages" ADD CONSTRAINT "career_track_stages_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_track_stages" ADD CONSTRAINT "career_track_stages_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "interviewer_personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
