import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// // import { processSourcingJobWithCheckpoints } from "@/lib/processing/pipeline-processor-v2";

// const STUCK_THRESHOLD_MINUTES = 5; // No activity for 5+ minutes = stuck
// const MAX_RETRIES = 3;

/**
 * Cron job that runs every 2 minutes to recover stuck jobs
 * Setup in Vercel: Add cron config in vercel.json
 */ 
export async function GET(request: Request) {
  // Verify cron secret (security)
  // const authHeader = request.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  try {
  //   console.log("🔍 Checking for stuck jobs...");

  //   const stuckThreshold = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000);

  //   // Find jobs that are stuck
  //   const stuckJobs = await prisma.sourcingJob.findMany({
  //     where: {
  //       status: {
  //         in: ["FORMATTING_JD", "SEARCHING_PROFILES", "SCRAPING_PROFILES", "PARSING_PROFILES","SAVING_PROFILES","SCORING_PROFILES","RATE_LIMITED"],
  //       },
  //       lastActivityAt: {
  //         lt: stuckThreshold,
  //       },
  //       retryCount: {
  //         lt: MAX_RETRIES,
  //       },
  //     },
  //   });

  //   console.log(`Found ${stuckJobs.length} stuck jobs`);

  //   const results = {
  //     recovered: 0,
  //     failed: 0,
  //     errors: [] as string[],
  //   };

  //   // Attempt to recover each stuck job
  //   for (const job of stuckJobs) {
  //     try {
  //       console.log(`🔄 Attempting to recover job ${job.id} (retry ${job.retryCount + 1}/${MAX_RETRIES})`);

  //       // Increment retry count
  //       await prisma.sourcingJob.update({
  //         where: { id: job.id },
  //         data: {
  //           retryCount: { increment: 1 },
  //           lastActivityAt: new Date(),
  //         },
  //       });

  //       // Resume from checkpoint
  //       // await processSourcingJobWithCheckpoints(job.id);

  //       results.recovered++;
  //     } catch (error: any) {
  //       console.error(`Failed to recover job ${job.id}:`, error);

  //       // Check if max retries reached
  //       const updatedJob = await prisma.sourcingJob.findUnique({
  //         where: { id: job.id },
  //         select: { retryCount: true },
  //       });

  //       if (updatedJob && updatedJob.retryCount >= MAX_RETRIES) {
  //         // Mark as permanently failed
  //         await prisma.sourcingJob.update({
  //           where: { id: job.id },
  //           data: {
  //             status: "FAILED",
  //             errorMessage: `Failed after ${MAX_RETRIES} retries: ${error.message}`,
  //             failedAt: new Date(),
  //             lastActivityAt: new Date(),
  //           },
  //         });

  //         results.failed++;
  //       }

  //       results.errors.push(`Job ${job.id}: ${error.message}`);
  //     }
  //   }

  //   console.log(`✅ Recovery complete: ${results.recovered} recovered, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      // ...results,
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}