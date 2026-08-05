-- AlterTable
ALTER TABLE "career_journeys" ADD COLUMN     "eventId" TEXT;

-- CreateTable
CREATE TABLE "hiring_events" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hiring_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "career_journeys_eventId_idx" ON "career_journeys"("eventId");

-- AddForeignKey
ALTER TABLE "hiring_events" ADD CONSTRAINT "hiring_events_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "career_tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_journeys" ADD CONSTRAINT "career_journeys_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "hiring_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
