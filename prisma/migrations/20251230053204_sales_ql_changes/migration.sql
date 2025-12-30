-- CreateEnum
CREATE TYPE "CandidateEnrichmentStatus" AS ENUM ('PENDING', 'ENRICHED', 'NO_EMAIL_FOUND', 'SKIPPED');

-- AlterTable
ALTER TABLE "LinkedInCandidate" ADD COLUMN     "emailSource" TEXT,
ADD COLUMN     "enrichedAt" TIMESTAMP(3),
ADD COLUMN     "enrichmentStatus" "CandidateEnrichmentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "scrapingStatus" TEXT,
ALTER COLUMN "scrapedAt" DROP NOT NULL,
ALTER COLUMN "scrapedAt" DROP DEFAULT;
