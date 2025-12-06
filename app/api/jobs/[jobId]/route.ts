import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// -------------------------
// GET: Fetch job + candidates
// -------------------------
export async function GET(
  req: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await context.params;

    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const job = await prisma.job.findFirst({
      where: { id: jobId, userId },
      include: {
        candidates: { orderBy: { matchScore: "desc" } },
        _count: { select: { candidates: true } },
      },
    });

    if (!job)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });

    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch job", details: error?.message },
      { status: 500 }
    );
  }
}

// -------------------------
// PATCH: Update job
// -------------------------
export async function PATCH(
  req: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await context.params;
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, description, status } = body;

    const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
    if (!job)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedJob);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update job", details: error?.message },
      { status: 500 }
    );
  }
}

// -------------------------
// DELETE: Delete job
// -------------------------
export async function DELETE(
  req: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await context.params;

    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
    if (!job)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });

    await prisma.job.delete({ where: { id: jobId } });

    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete job", details: error?.message },
      { status: 500 }
    );
  }
}
