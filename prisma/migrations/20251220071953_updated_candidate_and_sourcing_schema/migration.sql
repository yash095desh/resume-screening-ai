/*
  Warnings:

  - The values [SCORING] on the enum `SourcingJobStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `lastCompletedBatch` on the `SourcingJob` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `LinkedInCandidate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SourcingJobStatus_new" AS ENUM ('CREATED', 'FORMATTING_JD', 'JD_FORMATTED', 'SEARCHING_PROFILES', 'PROFILES_FOUND', 'SCRAPING_PROFILES', 'PARSING_PROFILES', 'SAVING_PROFILES', 'SCORING_PROFILES', 'COMPLETED', 'RATE_LIMITED', 'FAILED');
ALTER TABLE "public"."SourcingJob" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "SourcingJob" ALTER COLUMN "status" TYPE "SourcingJobStatus_new" USING ("status"::text::"SourcingJobStatus_new");
ALTER TYPE "SourcingJobStatus" RENAME TO "SourcingJobStatus_old";
ALTER TYPE "SourcingJobStatus_new" RENAME TO "SourcingJobStatus";
DROP TYPE "public"."SourcingJobStatus_old";
ALTER TABLE "SourcingJob" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- DropIndex
DROP INDEX "public"."LinkedInCandidate_sourcingJobId_matchScore_idx";

-- AlterTable
ALTER TABLE "LinkedInCandidate" ADD COLUMN     "bonusSkills" JSONB,
ADD COLUMN     "certifications" JSONB,
ADD COLUMN     "connections" INTEGER,
ADD COLUMN     "currentCompanyLogo" TEXT,
ADD COLUMN     "currentJobDuration" TEXT,
ADD COLUMN     "duplicateCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "followers" INTEGER,
ADD COLUMN     "industryMatch" TEXT,
ADD COLUMN     "isOpenToWork" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "languages" JSONB,
ADD COLUMN     "linkedInId" TEXT,
ADD COLUMN     "matchedSkills" JSONB,
ADD COLUMN     "missingSkills" JSONB,
ADD COLUMN     "niceToHaveScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "publicIdentifier" TEXT,
ADD COLUMN     "relevantYears" INTEGER,
ADD COLUMN     "scoringVersion" TEXT,
ADD COLUMN     "seniorityLevel" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SourcingJob" DROP COLUMN "lastCompletedBatch",
ADD COLUMN     "jobRequirements" JSONB;

-- CreateIndex
CREATE INDEX "LinkedInCandidate_sourcingJobId_matchScore_idx" ON "LinkedInCandidate"("sourcingJobId", "matchScore" DESC);

-- CreateIndex
CREATE INDEX "LinkedInCandidate_seniorityLevel_idx" ON "LinkedInCandidate"("seniorityLevel");

-- CreateIndex
CREATE INDEX "LinkedInCandidate_isOpenToWork_idx" ON "LinkedInCandidate"("isOpenToWork");
