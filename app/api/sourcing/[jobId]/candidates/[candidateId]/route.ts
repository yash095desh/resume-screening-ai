import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sourcing/[jobId]/candidates/[candidateId] - Get full candidate details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; candidateId: string }> }
) {
  try {
    const { userId } = await auth();

    console.log("userId",userId)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, candidateId } = await params;

    console.log("jobId and candidateId",jobId,candidateId)

    // Verify job ownership
    const job = await prisma.sourcingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify ownership
    if (job.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch candidate
    const candidate = await prisma.linkedInCandidate.findUnique({
      where: {
        id: candidateId,
        sourcingJobId: jobId,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(candidate);
  } catch (error: any) {
    console.error("Error fetching candidate:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}