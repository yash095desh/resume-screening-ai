import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseResume } from '@/lib/utils/file-parser';
import { extractResumeInfo } from '@/lib/ai/parser';
import { calculateMatchScore } from '@/lib/ai/matcher';
import { generateCandidateSummary } from '@/lib/ai/scorer';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseFile } from '@/lib/storage/supabase';

export async function POST(req: Request, context: { params: { jobId: string } }) {
  const params = await context.params;
  console.log("Final Params:", params);

  const { jobId } = params;
  console.log("Extracted jobId:", jobId);

  try {
    const { userId } = await auth();
    console.log("🔐 Authenticated User:", userId);

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch Job
    console.log("📝 Fetching job...");
    const job = await prisma.job.findFirst({
      where: { id: params.jobId, userId },
    });

    console.log("📝 Job fetched:", job);

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Fetch Pending Candidates
    console.log("👥 Fetching pending candidates...");
    const candidates = await prisma.candidate.findMany({
      where: { jobId: params.jobId, processingStatus: 'pending' },
    });

    console.log("👥 Pending candidates:", candidates.length);

    if (!candidates.length)
      return NextResponse.json({ message: 'No pending candidates to process' });

    // Update job status
    console.log("📌 Updating job status → processing");
    await prisma.job.update({ where: { id: params.jobId }, data: { status: 'processing' } });

    // Create processing log
    console.log("🧾 Creating processing log...");
    const processingLog = await prisma.processingLog.create({
      data: { jobId: params.jobId, status: 'started', totalResumes: candidates.length },
    });

    console.log("🧾 Processing Log created:", processingLog.id);

    let processedCount = 0;
    let failedCount = 0;
    const BATCH_SIZE = 5;

    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      console.log(`🚀 Processing batch ${i / BATCH_SIZE + 1}`);

      const batch = candidates.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (candidate) => {
          console.log(`➡️ Starting candidate ${candidate.id}`);

          try {
            await prisma.candidate.update({
              where: { id: candidate.id },
              data: { processingStatus: 'processing' },
            });

            console.log(`📥 Downloading resume:`, candidate.resumePath);

            // Download resume
            const resumeBuffer = await getSupabaseFile(candidate.resumePath!);
            console.log("📁 Resume downloaded — size:", resumeBuffer?.length);

            const fileType = candidate.resumePath!.endsWith('.pdf')
              ? 'application/pdf'
              : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

            console.log("📄 Parsing resume...");
            const resumeText = await parseResume(resumeBuffer, fileType);
            console.log("📄 Resume parsed. Text length:", resumeText?.length);

            console.log("🧠 Extracting resume info...");
            const candidateInfo = await extractResumeInfo(resumeText);
            console.log("🧠 Extracted info:", candidateInfo);

            console.log("📊 Calculating match score...");
            const matchResult = calculateMatchScore(
              candidateInfo.skills,
              job.requiredSkills,
              candidateInfo.totalExperienceYears || 0,
              job.experienceRequired || '0'
            );
            console.log("📊 Match Score:", matchResult);

            console.log("📝 Generating AI summary...");
            const summary = await generateCandidateSummary(
              candidateInfo,
              {
                requiredSkills: job.requiredSkills,
                experienceRequired: job.experienceRequired,
                qualifications: job.qualifications,
              },
              matchResult.score
            );
            console.log("📝 Summary generated");

            // Update candidate
            console.log(`📌 Updating candidate ${candidate.id}`);
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
                processingStatus: 'completed',
                updatedAt: new Date(),
              },
            });

            processedCount++;
            console.log(`✅ Candidate processed (${processedCount})`);

            await prisma.processingLog.update({
              where: { id: processingLog.id },
              data: { processedResumes: processedCount, status: 'in_progress' },
            });
          } catch (err: any) {
            console.error(`❌ Error processing candidate ${candidate.id}:`, err);
            failedCount++;

            await prisma.candidate.update({
              where: { id: candidate.id },
              data: {
                processingStatus: 'failed',
                processingError: err.message || 'Processing failed',
              },
            });

            await prisma.processingLog.update({
              where: { id: processingLog.id },
              data: { failedResumes: failedCount },
            });
          }
        })
      );

      if (i + BATCH_SIZE < candidates.length) {
        console.log("⏳ Waiting 2 seconds before next batch...");
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    console.log("🎉 All batches done. Updating job status → completed");

    await prisma.job.update({ where: { id: params.jobId }, data: { status: 'completed' } });

    await prisma.processingLog.update({
      where: { id: processingLog.id },
      data: { status: 'completed', completedAt: new Date() },
    });

    console.log("🎉 Processing finished successfully");

    return NextResponse.json({
      success: true,
      processed: processedCount,
      failed: failedCount,
      total: candidates.length,
    });

  } catch (error: any) {
    console.error('🔥 MAIN ERROR in resume processing:', error);
    return NextResponse.json({ error: 'Failed to process resumes', details: error.message }, { status: 500 });
  }
}


// GET endpoint
export async function GET(req: Request, { params }: { params: { jobId: string } }) {
  console.log("➡️ GET /process-status for job:", params.jobId);

  try {
    const { userId } = await auth();
    console.log("🔐 Authenticated User:", userId);

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    console.log("🧾 Fetching latest processing log...");
    const latestLog = await prisma.processingLog.findFirst({
      where: { jobId: params.jobId },
      orderBy: { startedAt: 'desc' },
    });

    if (!latestLog) {
      console.log("⚠️ No log found");
      return NextResponse.json({ status: 'not_started' });
    }

    console.log("📄 Processing Log:", latestLog);
    return NextResponse.json(latestLog);

  } catch (error) {
    console.error('🔥 Error fetching processing status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
