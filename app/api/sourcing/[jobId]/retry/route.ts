import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { processSourcingJobWithCheckpoints } from "@/lib/processing/pipeline-processor-v2";

/**
 * POST /api/sourcing/:jobId/retry
 * Retry a failed or rate-limited sourcing job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    // Fetch the job
    const job = await prisma.sourcingJob.findUnique({
      where: { id: jobId, userId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if job is in a retriable state
    const retriableStatuses = [
      "FAILED",
      "RATE_LIMITED",
      "FORMATTING_JD",
      "SEARCHING_PROFILES",
      "SCRAPING_PROFILES",
      "PARSING_PROFILES",
      "SAVING_PROFILES",
      "SCORING_PROFILES",
    ];

    if (!retriableStatuses.includes(job.status)) {
      if (job.status === "COMPLETED") {
        return NextResponse.json(
          { error: "Job already completed" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Cannot retry job with status: ${job.status}` },
        { status: 400 }
      );
    }

    // Check rate limit status
    if (job.status === "RATE_LIMITED") {
      if (job.rateLimitResetAt && new Date() < job.rateLimitResetAt) {
        const secondsLeft = Math.ceil(
          (job.rateLimitResetAt.getTime() - Date.now()) / 1000
        );
        return NextResponse.json(
          {
            error: "Still rate limited",
            rateLimitType: job.rateLimitType,
            resetAt: job.rateLimitResetAt,
            retryAfter: secondsLeft,
            message: `Please wait ${secondsLeft} seconds before retrying`,
          },
          { status: 429 }
        );
      }
    }

    // Check retry cooldown
    if (job.retryAfter && new Date() < job.retryAfter) {
      const secondsLeft = Math.ceil(
        (job.retryAfter.getTime() - Date.now()) / 1000
      );
      return NextResponse.json(
        {
          error: "Retry cooldown active",
          retryAfter: job.retryAfter,
          secondsLeft: secondsLeft,
          message: `Please wait ${secondsLeft} seconds before retrying`,
        },
        { status: 429 }
      );
    }

    // Check max retries
    if (job.retryCount >= job.maxRetries) {
      return NextResponse.json(
        {
          error: "Max retries exceeded",
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
          message: `Job has failed ${job.retryCount} times. Maximum retry limit reached.`,
        },
        { status: 400 }
      );
    }

    // Increment retry count
    await prisma.sourcingJob.update({
      where: { id: jobId },
      data: {
        retryCount: { increment: 1 },
        errorMessage: null, // Clear previous error
        failedAt: null,
        lastActivityAt: new Date(),
      },
    });

    console.log(`🔄 Retrying job ${jobId} (attempt ${job.retryCount + 1}/${job.maxRetries})`);

    // Start processing again (will resume from checkpoint)
    processSourcingJobWithCheckpoints(jobId).catch((error) => {
      console.error(`Failed to retry job ${jobId}:`, error);

      // Update job with error
      prisma.sourcingJob
        .update({
          where: { id: jobId },
          data: {
            status: error.name === "RateLimitError" ? "RATE_LIMITED" : "FAILED",
            errorMessage: error.message,
            failedAt: error.name !== "RateLimitError" ? new Date() : undefined,
            lastActivityAt: new Date(),
          },
        })
        .catch(console.error);
    });

    return NextResponse.json({
      success: true,
      message: "Job retry initiated. Processing will resume from last checkpoint.",
      jobId: job.id,
      status: job.status,
      currentStage: job.currentStage,
      retryCount: job.retryCount + 1,
      progress: {
        totalProfilesFound: job.totalProfilesFound,
        profilesScraped: job.profilesScraped,
        profilesParsed: job.profilesParsed,
        profilesSaved: job.profilesSaved,
        profilesScored: job.profilesScored,
      },
    });
  } catch (error: any) {
    console.error("Error retrying sourcing job:", error);

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sourcing/:jobId/retry
 * Check if a job can be retried and get retry status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    const job = await prisma.sourcingJob.findUnique({
      where: { id: jobId, userId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const retriableStatuses = [
      "FAILED",
      "RATE_LIMITED",
      "FORMATTING_JD",
      "SEARCHING_PROFILES",
      "SCRAPING_PROFILES",
      "PARSING_PROFILES",
      "SAVING_PROFILES",
      "SCORING_PROFILES",
    ];

    const canRetry = retriableStatuses.includes(job.status);
    const isRateLimited = job.status === "RATE_LIMITED";
    const rateLimitActive =
      isRateLimited &&
      job.rateLimitResetAt &&
      new Date() < job.rateLimitResetAt;

    const retryCooldownActive =
      job.retryAfter && new Date() < job.retryAfter;

    const maxRetriesReached = job.retryCount >= job.maxRetries;

    return NextResponse.json({
      canRetry:
        canRetry &&
        !rateLimitActive &&
        !retryCooldownActive &&
        !maxRetriesReached,
      status: job.status,
      currentStage: job.currentStage,
      retryCount: job.retryCount,
      maxRetries: job.maxRetries,
      rateLimited: rateLimitActive,
      rateLimitType: job.rateLimitType,
      rateLimitResetAt: job.rateLimitResetAt,
      retryAfter: job.retryAfter,
      errorMessage: job.errorMessage,
      progress: {
        totalProfilesFound: job.totalProfilesFound,
        profilesScraped: job.profilesScraped,
        profilesParsed: job.profilesParsed,
        profilesSaved: job.profilesSaved,
        profilesScored: job.profilesScored,
        lastScrapedBatch: job.lastScrapedBatch,
        lastParsedBatch: job.lastParsedBatch,
        lastSavedBatch: job.lastSavedBatch,
        lastScoredBatch: job.lastScoredBatch,
        totalBatches: job.totalBatches,
      },
    });
  } catch (error: any) {
    console.error("Error checking retry status:", error);

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}