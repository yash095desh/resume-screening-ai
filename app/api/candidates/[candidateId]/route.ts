import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ candidateId: string }> }
) {
  try {
    // Await params because Next.js App Router passes params as a Promise
    const { candidateId } = await context.params;

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId },
      include: {
        job: {
          select: {
            userId: true,
            title: true,
            requiredSkills: true,
            experienceRequired: true,
            qualifications: true,
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Verify the authenticated user owns the job
    if (candidate.job.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(candidate);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch candidate", details: error?.message },
      { status: 500 }
    );
  }
}
