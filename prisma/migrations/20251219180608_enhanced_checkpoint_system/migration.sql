-- Step 1: Add new enum values
-- Note: In PostgreSQL, enum additions require separate transactions
-- This migration will ONLY add enum values and new columns
-- Data migration will happen in application code on first run

ALTER TYPE "SourcingJobStatus" ADD VALUE IF NOT EXISTS 'JD_FORMATTED';
ALTER TYPE "SourcingJobStatus" ADD VALUE IF NOT EXISTS 'PROFILES_FOUND';
ALTER TYPE "SourcingJobStatus" ADD VALUE IF NOT EXISTS 'PARSING_PROFILES';
ALTER TYPE "SourcingJobStatus" ADD VALUE IF NOT EXISTS 'SAVING_PROFILES';
ALTER TYPE "SourcingJobStatus" ADD VALUE IF NOT EXISTS 'SCORING_PROFILES';
ALTER TYPE "SourcingJobStatus" ADD VALUE IF NOT EXISTS 'RATE_LIMITED';

-- Step 2: Add new checkpoint fields to SourcingJob
ALTER TABLE "SourcingJob" ADD COLUMN "searchFiltersCreatedAt" TIMESTAMP(3);
ALTER TABLE "SourcingJob" ADD COLUMN "discoveredUrlsCreatedAt" TIMESTAMP(3);
ALTER TABLE "SourcingJob" ADD COLUMN "scrapedProfilesData" JSONB;
ALTER TABLE "SourcingJob" ADD COLUMN "lastScrapedBatch" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SourcingJob" ADD COLUMN "parsedProfilesData" JSONB;
ALTER TABLE "SourcingJob" ADD COLUMN "lastParsedBatch" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SourcingJob" ADD COLUMN "lastSavedBatch" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SourcingJob" ADD COLUMN "lastScoredBatch" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Add new progress tracking fields
ALTER TABLE "SourcingJob" ADD COLUMN "currentStage" TEXT;
ALTER TABLE "SourcingJob" ADD COLUMN "profilesParsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SourcingJob" ADD COLUMN "profilesSaved" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Add rate limiting fields
ALTER TABLE "SourcingJob" ADD COLUMN "rateLimitHitAt" TIMESTAMP(3);
ALTER TABLE "SourcingJob" ADD COLUMN "rateLimitResetAt" TIMESTAMP(3);
ALTER TABLE "SourcingJob" ADD COLUMN "rateLimitType" TEXT;

-- AlterTable: Add retry fields
ALTER TABLE "SourcingJob" ADD COLUMN "retryAfter" TIMESTAMP(3);
ALTER TABLE "SourcingJob" ADD COLUMN "maxRetries" INTEGER NOT NULL DEFAULT 3;

-- AlterTable: Set default for totalBatches if not already set
ALTER TABLE "SourcingJob" ALTER COLUMN "totalBatches" SET DEFAULT 0;

-- Note: Data migration for existing jobs will be handled automatically
-- by the application on first run with the new checkpoint system