-- CreateTable
CREATE TABLE "journey_readiness_reports" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_readiness_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "journey_readiness_reports_journeyId_key" ON "journey_readiness_reports"("journeyId");

-- AddForeignKey
ALTER TABLE "journey_readiness_reports" ADD CONSTRAINT "journey_readiness_reports_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "career_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

