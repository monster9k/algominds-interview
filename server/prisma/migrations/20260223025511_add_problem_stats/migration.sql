-- AlterTable
ALTER TABLE "problems" ADD COLUMN     "acceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "functionName" TEXT NOT NULL DEFAULT 'solution',
ADD COLUMN     "inputSignature" JSONB,
ADD COLUMN     "passCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "submitCount" INTEGER NOT NULL DEFAULT 0;
