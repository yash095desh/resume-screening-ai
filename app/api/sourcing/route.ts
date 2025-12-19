import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createSourcingJobSchema } from "@/lib/validations/sourcing";
import { processSourcingJobWithCheckpoints } from "@/lib/processing/pipeline-processor";

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
      jobs: jobs.map(job => ({
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
 * POST /api/sourcing - Create new sourcing job and start processing
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = createSourcingJobSchema.parse(body);

    // Create job with proper initial state
    const job = await prisma.sourcingJob.create({
      data: {
        userId,
        title: validatedData.title,
        rawJobDescription: validatedData.jobDescription,
        maxCandidates: validatedData.maxCandidates,
        status: "CREATED",
        lastActivityAt: new Date(), // Initialize activity timestamp
        retryCount: 0,
        lastCompletedBatch: 0,
      },
    });

    console.log(`✨ Created sourcing job ${job.id}`);

    //working fine 

    // Start processing asynchronously (don't await)
    processSourcingJobWithCheckpoints(job.id).catch((error) => {
      console.error(`Failed to process job ${job.id}:`, error);
      
      // Update job status on catastrophic failure
      prisma.sourcingJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          failedAt: new Date(),
          lastActivityAt: new Date(),
        },
      }).catch(console.error);
    });

    return NextResponse.json(
      {
        id: job.id,
        status: job.status,
        message: "Sourcing job created. Processing started.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating sourcing job:", error);

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
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
  if (job.status === "CREATED") return 5;
  if (job.status === "FORMATTING_JD") return 10;
  if (job.status === "SEARCHING_PROFILES") return 20;
  
  // Calculate based on batch progress
  if (job.totalBatches > 0) {
    const batchProgress = (job.lastCompletedBatch / job.totalBatches) * 60; // 60% for scraping
    const scoringProgress = job.profilesScored > 0 ? 
      (job.profilesScored / job.maxCandidates) * 20 : 0; // 20% for scoring
    return Math.min(20 + batchProgress + scoringProgress, 95);
  }
  
  return 25; // Default for in-progress
}