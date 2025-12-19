-- CreateEnum
CREATE TYPE "SourcingJobStatus" AS ENUM ('CREATED', 'FORMATTING_JD', 'SEARCHING_PROFILES', 'SCRAPING_PROFILES', 'SCORING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "SourcingJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rawJobDescription" TEXT NOT NULL,
    "maxCandidates" INTEGER NOT NULL DEFAULT 50,
    "searchFilters" JSONB,
    "discoveredUrls" JSONB,
    "lastCompletedBatch" INTEGER NOT NULL DEFAULT 0,
    "totalBatches" INTEGER NOT NULL DEFAULT 2,
    "status" "SourcingJobStatus" NOT NULL DEFAULT 'CREATED',
    "totalProfilesFound" INTEGER NOT NULL DEFAULT 0,
    "profilesScraped" INTEGER NOT NULL DEFAULT 0,
    "profilesScored" INTEGER NOT NULL DEFAULT 0,
    "processingStartedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SourcingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedInCandidate" (
    "id" TEXT NOT NULL,
    "sourcingJobId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "headline" TEXT,
    "location" TEXT,
    "profileUrl" TEXT NOT NULL,
    "photoUrl" TEXT,
    "currentPosition" TEXT,
    "currentCompany" TEXT,
    "experienceYears" INTEGER,
    "skills" JSONB,
    "experience" JSONB,
    "education" JSONB,
    "email" TEXT,
    "phone" TEXT,
    "hasContactInfo" BOOLEAN NOT NULL DEFAULT false,
    "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skillsScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "experienceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "industryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "titleScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "matchReason" TEXT,
    "isScored" BOOLEAN NOT NULL DEFAULT false,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "firstSeenJobId" TEXT,
    "batchNumber" INTEGER NOT NULL DEFAULT 0,
    "rawData" JSONB,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scoredAt" TIMESTAMP(3),

    CONSTRAINT "LinkedInCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourcingJob_userId_status_idx" ON "SourcingJob"("userId", "status");

-- CreateIndex
CREATE INDEX "SourcingJob_lastActivityAt_idx" ON "SourcingJob"("lastActivityAt");

-- CreateIndex
CREATE INDEX "SourcingJob_status_lastActivityAt_idx" ON "SourcingJob"("status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "LinkedInCandidate_sourcingJobId_matchScore_idx" ON "LinkedInCandidate"("sourcingJobId", "matchScore");

-- CreateIndex
CREATE INDEX "LinkedInCandidate_profileUrl_idx" ON "LinkedInCandidate"("profileUrl");

-- CreateIndex
CREATE INDEX "LinkedInCandidate_batchNumber_idx" ON "LinkedInCandidate"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInCandidate_sourcingJobId_profileUrl_key" ON "LinkedInCandidate"("sourcingJobId", "profileUrl");

-- AddForeignKey
ALTER TABLE "SourcingJob" ADD CONSTRAINT "SourcingJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInCandidate" ADD CONSTRAINT "LinkedInCandidate_sourcingJobId_fkey" FOREIGN KEY ("sourcingJobId") REFERENCES "SourcingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
