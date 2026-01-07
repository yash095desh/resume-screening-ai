import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sourcing/[jobId] - Get job details with optional candidates
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
    const { searchParams } = new URL(request.url);
    const includeCandidates = searchParams.get("include") === "candidates";

    const job = await prisma.sourcingJob.findUnique({
      where: {
        id: jobId,
      },
      include: {
        candidates: includeCandidates
          ? {
              where: {
                isScored: true, // Only return scored candidates
              },
              orderBy: [
                { matchScore: "desc" }, // Highest score first
              ],
              select: {
                id: true,
                fullName: true,
                headline: true,
                location: true,
                profileUrl: true,
                photoUrl: true,
                
                // Current role
                currentPosition: true,
                currentCompany: true,
                currentCompanyLogo: true,
                experienceYears: true,
                seniorityLevel: true,
                
                // Skills matching
                matchedSkills: true,
                missingSkills: true,
                bonusSkills: true,
                
                // Scores
                matchScore: true,
                skillsScore: true,
                experienceScore: true,
                industryScore: true,
                titleScore: true,
                niceToHaveScore: true,
                matchReason: true,
                
                // Contact info
                email: true,
                phone: true,
                hasContactInfo: true,
                
                // Status
                isOpenToWork: true,
                isDuplicate: true,
                isScored: true,
                
                // Metadata (hidden from UI)
                scrapedAt: true,
              },
            }
          : false,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify ownership
    if (job.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Calculate progress percentage
    const progress = {
      percentage:
        job.totalProfilesFound > 0
          ? Math.round((job.profilesScored / job.totalProfilesFound) * 100)
          : 0,
    };

    // Clean response structure
    return NextResponse.json({
      id: job.id,
      title: job.title,
      status: job.status,
      currentStage: job.currentStage,
      
      // Progress metrics
      totalProfilesFound: job.totalProfilesFound,
      profilesScored: job.profilesScored,
      progress,
      
      // Timestamps
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      
      // Error handling
      errorMessage: job.errorMessage,
      
      // Candidates (if requested)
      candidates: job.candidates || [],
    });
  } catch (error: any) {
    console.error("Error fetching sourcing job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job details" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sourcing/[jobId] - Delete job and all candidates
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    // Verify ownership before deleting
    const job = await prisma.sourcingJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        userId: true,
        _count: { 
          select: { candidates: true } 
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete job (candidates will cascade delete)
    await prisma.sourcingJob.delete({
      where: { id: jobId },
    });

    return NextResponse.json({
      success: true,
      message: `Job deleted successfully`,
      deletedCandidates: job._count.candidates,
    });
  } catch (error: any) {
    console.error("Error deleting sourcing job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sourcing/[jobId] - Update job status (for retry/resume)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    // Verify ownership
    const job = await prisma.sourcingJob.findUnique({
      where: { id: jobId },
      select: { userId: true, status: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only allow updating failed jobs
    if (job.status !== "FAILED") {
      return NextResponse.json(
        { error: "Can only retry failed jobs" },
        { status: 400 }
      );
    }

    // Reset job for retry
    const updatedJob = await prisma.sourcingJob.update({
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

    return NextResponse.json({
      success: true,
      message: "Job queued for retry",
      job: {
        id: updatedJob.id,
        status: updatedJob.status,
        retryCount: updatedJob.retryCount,
      },
    });
  } catch (error: any) {
    console.error("Error updating sourcing job:", error);
    return NextResponse.json(
      { error: "Failed to retry job" },
      { status: 500 }
    );
  }
}