import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseResume } from "@/lib/utils/file-parser";
import { extractResumeInfo } from "@/lib/ai/parser";
import { calculateMatchScore } from "@/lib/ai/matcher";
import { generateCandidateSummary } from "@/lib/ai/scorer";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseFile } from "@/lib/storage/supabase";

// -------------------------
// POST: PROCESS RESUMES
// -------------------------
export async function POST(
  req: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    // Next.js 15/16: params is a Promise
    const { jobId } = await context.params;

    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch job
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId },
    });
    if (!job)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });

    // Fetch pending candidates
    const candidates = await prisma.candidate.findMany({
      where: { jobId, processingStatus: "pending" },
    });
    if (!candidates.length)
      return NextResponse.json({
        message: "No pending candidates to process",
      });

    // Update job status → processing
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "processing" },
    });

    // Create processing log
    const processingLog = await prisma.processingLog.create({
      data: {
        jobId,
        status: "started",
        totalResumes: candidates.length,
      },
    });

    let processedCount = 0;
    let failedCount = 0;
    const BATCH_SIZE = 5;

    // Batch processing
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (candidate) => {
          try {
            // Update candidate to processing state
            await prisma.candidate.update({
              where: { id: candidate.id },
              data: { processingStatus: "processing" },
            });

            // Download resume from Supabase
            const resumeBuffer = await getSupabaseFile(candidate.resumePath!);

            const fileType = candidate.resumePath!.endsWith(".pdf")
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

            // Parse resume
            const resumeText = await parseResume(resumeBuffer, fileType);

            // Extract info using AI
            const candidateInfo = await extractResumeInfo(resumeText);

            // Calculate match score
            const matchResult = calculateMatchScore(
              candidateInfo.skills,
              job.requiredSkills,
              candidateInfo.totalExperienceYears || 0,
              job.experienceRequired || "0"
            );

            // Generate summary with LLM
            const summary = await generateCandidateSummary(
              candidateInfo,
              {
                requiredSkills: job.requiredSkills,
                experienceRequired: job.experienceRequired,
                qualifications: job.qualifications,
              },
              matchResult.score
            );

            // Update candidate final data
            await prisma.candidate.update({
              where: { id: candidate.id },
              data: {
                name: candidateInfo.name,
                email: candidateInfo.email || null,
                phone: candidateInfo.phone || null,
                resumeText,
                skills: candidateInfo.skills,
                experience: candidateInfo.experience as any,
                education: candidateInfo.education as any,
                totalExperienceYears: candidateInfo.totalExperienceYears,
                matchScore: matchResult.score,
                matchedSkills: matchResult.matchedSkills,
                missingSkills: matchResult.missingSkills,
                fitVerdict: summary.fitVerdict,
                summary: summary.summary,
                strengths: summary.strengths,
                weaknesses: summary.weaknesses,
                processingStatus: "completed",
                updatedAt: new Date(),
              },
            });

            processedCount++;

            await prisma.processingLog.update({
              where: { id: processingLog.id },
              data: {
                processedResumes: processedCount,
                status: "in_progress",
              },
            });
          } catch (err: any) {
            failedCount++;

            await prisma.candidate.update({
              where: { id: candidate.id },
              data: {
                processingStatus: "failed",
                processingError: err.message || "Processing failed",
              },
            });

            await prisma.processingLog.update({
              where: { id: processingLog.id },
              data: { failedResumes: failedCount },
            });
          }
        })
      );

      // Throttle between batches
      if (i + BATCH_SIZE < candidates.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Mark job completed
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "completed" },
    });

    await prisma.processingLog.update({
      where: { id: processingLog.id },
      data: { status: "completed", completedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      processed: processedCount,
      failed: failedCount,
      total: candidates.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to process resumes",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// -------------------------
// GET: CHECK PROCESSING STATUS
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

    const latestLog = await prisma.processingLog.findFirst({
      where: { jobId },
      orderBy: { startedAt: "desc" },
    });

    if (!latestLog) return NextResponse.json({ status: "not_started" });

    return NextResponse.json(latestLog);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
