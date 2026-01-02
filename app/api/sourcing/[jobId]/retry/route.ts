import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createSourcingWorkflow, buildResumeState } from "@/lib/sourcing/workflow";

/**
 * POST /api/sourcing/[jobId]/retry - Retry failed job from last checkpoint
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

    // Verify ownership and check if retryable
    const job = await prisma.sourcingJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        userId: true,
        status: true,
        retryCount: true,
        maxRetries: true,
        lastCompletedStage: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if job can be retried
    const retryableStatuses = ["FAILED", "RATE_LIMITED"];
    if (!retryableStatuses.includes(job.status)) {
      return NextResponse.json(
        { error: `Cannot retry job with status: ${job.status}` },
        { status: 400 }
      );
    }

    // Check retry limit
    if (job.retryCount >= job.maxRetries) {
      return NextResponse.json(
        { error: `Max retries (${job.maxRetries}) exceeded` },
        { status: 400 }
      );
    }

    console.log(`🔄 Retrying job ${jobId} (attempt ${job.retryCount + 1}/${job.maxRetries})`);
    console.log(`📍 Resuming from stage: ${job.lastCompletedStage || "START"}`);

    // Reset job status for retry
    await prisma.sourcingJob.update({
      where: { id: jobId },
      data: {
        status: "CREATED",
        currentStage: "RETRY_INITIATED",
        errorMessage: null,
        failedAt: null,
        retryCount: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });

    // Build resume state from checkpoints
    const resumeState = await buildResumeState(jobId);

    console.log(`📦 Resume state built:`, {
      candidatesWithEmails: resumeState.candidatesWithEmails,
      discoveredUrlsCount: resumeState.discoveredUrls.size,
      scrapedProfilesCount: (resumeState.scrapedProfiles as any[]).length,
      parsedProfilesCount: (resumeState.parsedProfiles as any[]).length,
    });

    // Create workflow and resume
    const app = await createSourcingWorkflow();

    // Run asynchronously with same thread_id for checkpoint continuation
    app.invoke(resumeState as any, {
        configurable: {
          thread_id: jobId, // Same thread_id = continue from checkpoint
        },
      })
      .catch(async (error) => {
        console.error(`Retry of job ${jobId} failed:`, error);

        await prisma.sourcingJob.update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            errorMessage: `Retry failed: ${error.message}`,
            failedAt: new Date(),
          },
        });
      });

    return NextResponse.json({
      success: true,
      message: "Job retry initiated",
      job: {
        id: job.id,
        status: "PROCESSING",
        retryCount: job.retryCount + 1,
        resumingFrom: job.lastCompletedStage || "START",
      },
    });
  } catch (error: any) {
    console.error("Error retrying sourcing job:", error);
    return NextResponse.json(
      { error: "Failed to retry job" },
      { status: 500 }
    );
  }
}