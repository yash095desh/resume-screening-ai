-- CreateEnum
CREATE TYPE "InterviewReadinessStatus" AS ENUM ('NOT_ASSESSED', 'READY_TO_INTERVIEW', 'INTERVIEW_WITH_VALIDATION', 'NOT_RECOMMENDED');

-- AlterTable
ALTER TABLE "LinkedInCandidate" ADD COLUMN     "aiAnalysisVersion" TEXT DEFAULT 'v3.0',
ADD COLUMN     "analysisGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "candidateSummary" TEXT,
ADD COLUMN     "criticalGaps" JSONB,
ADD COLUMN     "experienceAnalysisSummary" TEXT,
ADD COLUMN     "experienceHighlights" JSONB,
ADD COLUMN     "experienceRelevanceScore" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "fullAnalysisGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gapsAndTradeoffs" JSONB,
ADD COLUMN     "gapsOverallImpact" TEXT,
ADD COLUMN     "gapsSummary" TEXT,
ADD COLUMN     "hasSignificantGaps" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "industryAlignment" TEXT,
ADD COLUMN     "interviewConfidenceScore" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "interviewFocusAreas" JSONB,
ADD COLUMN     "interviewFocusSummary" TEXT,
ADD COLUMN     "interviewReadiness" "InterviewReadinessStatus" NOT NULL DEFAULT 'NOT_ASSESSED',
ADD COLUMN     "interviewReadinessReason" TEXT,
ADD COLUMN     "keyStrengths" JSONB,
ADD COLUMN     "redFlags" JSONB,
ADD COLUMN     "seniorityAlignment" TEXT,
ADD COLUMN     "skillGapImpact" TEXT,
ADD COLUMN     "skillsAnalysisSummary" TEXT,
ADD COLUMN     "skillsProficiency" JSONB,
ADD COLUMN     "suggestedQuestions" JSONB;
