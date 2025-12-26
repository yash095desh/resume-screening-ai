import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createSourcingJobSchema } from "@/lib/validations/sourcing";
import { createSourcingWorkflow } from "@/lib/sourcing/workflow";

/**
 * POST /api/sourcing - Create new sourcing job and start processing
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSourcingJobSchema.parse(body);

    // Create job
    const job = await prisma.sourcingJob.create({
      data: {
        userId,
        title: validatedData.title,
        rawJobDescription: validatedData.jobDescription,
        maxCandidates: validatedData.maxCandidates,
        jobRequirements: validatedData.jobRequirements,
        status: "CREATED",
        lastActivityAt: new Date(),
      },
    });

    console.log(`✨ Created sourcing job ${job.id}`);

    // Create workflow
    const app = await createSourcingWorkflow();

    // Run asynchronously with checkpointing
    app.invoke(
        {
          jobId: job.id,
          userId: userId,
          rawJobDescription: job.rawJobDescription,
          jobRequirements: job.jobRequirements as any,
          maxCandidates: job.maxCandidates,
        },
        {
          configurable: {
            thread_id: job.id, // This enables checkpointing
          },
        }
      )
      .catch(async (error) => {
        console.error(`Job ${job.id} failed:`, error);

        await prisma.sourcingJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            errorMessage: error.message,
            failedAt: new Date(),
          },
        });
      });

    return NextResponse.json(
      {
        id: job.id,
        status: "PROCESSING",
        message: "Job started",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating job:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


/**
 * GET /api/sourcing - Get all sourcing jobs for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = { userId };
    if (status && status !== "ALL") {
      where.status = status;
    }

    // Fetch jobs
    const jobs = await prisma.sourcingJob.findMany({
      where,
      include: {
        _count: {
          select: { candidates: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.sourcingJob.count({ where });

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        maxCandidates: job.maxCandidates,
        totalProfilesFound: job.totalProfilesFound,
        profilesScraped: job.profilesScraped,
        profilesScored: job.profilesScored,
        candidatesCount: job._count.candidates,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        lastActivityAt: job.lastActivityAt,
        progress: calculateProgress(job),
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching sourcing jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch sourcing jobs" },
      { status: 500 }
    );
  }
}



/**
 * Calculate job progress percentage
 */
function calculateProgress(job: any): number {
  if (job.status === "COMPLETED") return 100;
  if (job.status === "FAILED") return 0;
  if (job.status === "RATE_LIMITED") {
    // Return current progress, don't reset to 0
    return calculateProgressFromStage(job);
  }

  return calculateProgressFromStage(job);
}

function calculateProgressFromStage(job: any): number {
  const status = job.status;
  const totalBatches = job.totalBatches || 1;

  // Stage-based progress
  if (status === "CREATED") return 5;
  if (status === "FORMATTING_JD") return 10;
  if (status === "JD_FORMATTED") return 15;
  if (status === "SEARCHING_PROFILES") return 20;
  if (status === "PROFILES_FOUND") return 25;

  // Batch-based progress (stages 3-6)
  if (status === "SCRAPING_PROFILES") {
    const scrapeProgress = (job.lastScrapedBatch / totalBatches) * 15;
    return 25 + scrapeProgress; // 25-40%
  }

  if (status === "PARSING_PROFILES") {
    const parseProgress = (job.lastParsedBatch / totalBatches) * 15;
    return 40 + parseProgress; // 40-55%
  }

  if (status === "SAVING_PROFILES") {
    const saveProgress = (job.lastSavedBatch / totalBatches) * 15;
    return 55 + saveProgress; // 55-70%
  }

  if (status === "SCORING_PROFILES") {
    const scoreProgress = (job.lastScoredBatch / totalBatches) * 25;
    return 70 + scoreProgress; // 70-95%
  }

  return 30; // Default
}
