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
              orderBy: [
                { isScored: "desc" }, // Scored candidates first
                { matchScore: "desc" }, // Then by score
              ],
              select: {
                id: true,
                fullName: true,
                headline: true,
                location: true,
                profileUrl: true,
                photoUrl: true,
                currentPosition: true,
                currentCompany: true,
                skills: true,
                matchScore: true,
                skillsScore: true,
                experienceScore: true,
                industryScore: true,
                titleScore: true,
                hasContactInfo: true,
                isDuplicate: true,
                isScored: true,
                batchNumber: true,
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
      totalCandidates: job.totalProfilesFound,
      scrapedCandidates: job.profilesScraped,
      scoredCandidates: job.profilesScored,
      percentage:
        job.totalProfilesFound > 0
          ? Math.round((job.profilesScored / job.totalProfilesFound) * 100)
          : 0,
    };

    return NextResponse.json({
      ...job,
      progress,
    });
  } catch (error: any) {
    console.error("Error fetching sourcing job:", error);
    return NextResponse.json(
      { error: error.message },
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
      include: { _count: { select: { candidates: true } } },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify ownership
    if (job.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete job (candidates will cascade delete)
    await prisma.sourcingJob.delete({
      where: { id: jobId },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted job and ${job._count.candidates} candidates`,
    });
  } catch (error: any) {
    console.error("Error deleting sourcing job:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}