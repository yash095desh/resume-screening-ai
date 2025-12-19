import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sourcing/[jobId]/stream - SSE stream for real-time updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { jobId } = await params;

    // Verify job ownership
    const job = await prisma.sourcingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return new Response("Job not found", { status: 404 });
    }

    // Verify ownership
    if (job.userId !== userId) {
      return new Response("Unauthorized", { status: 403 });
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    let isStreamClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        console.log(`📡 SSE stream started for job ${jobId}`);

        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
        );

        // Poll database every 2 seconds for updates
        const intervalId = setInterval(async () => {
          if (isStreamClosed) {
            clearInterval(intervalId);
            return;
          }

          try {
            // Fetch latest job status
            const latestJob = await prisma.sourcingJob.findUnique({
              where: { id: jobId },
              include: {
                candidates: {
                  where: { isScored: true },
                  orderBy: { matchScore: "desc" },
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
                    batchNumber: true,
                  },
                },
              },
            });

            if (!latestJob) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "error", message: "Job not found" })}\n\n`
                )
              );
              controller.close();
              clearInterval(intervalId);
              return;
            }

            // Send status update
            const update = {
              type: "update",
              status: latestJob.status,
              progress: {
                totalCandidates: latestJob.totalProfilesFound,
                scrapedCandidates: latestJob.profilesScraped,
                scoredCandidates: latestJob.profilesScored,
                percentage:
                  latestJob.totalProfilesFound > 0
                    ? Math.round(
                        (latestJob.profilesScored / latestJob.totalProfilesFound) * 100
                      )
                    : 0,
              },
              candidates: latestJob.candidates,
              lastActivityAt: latestJob.lastActivityAt,
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(update)}\n\n`)
            );

            // If job is complete or failed, close stream
            if (latestJob.status === "COMPLETED" || latestJob.status === "FAILED") {
              console.log(`✅ Job ${jobId} finished. Closing SSE stream.`);
              
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "complete",
                    status: latestJob.status,
                    errorMessage: latestJob.errorMessage,
                  })}\n\n`
                )
              );

              controller.close();
              clearInterval(intervalId);
              isStreamClosed = true;
            }
          } catch (error: any) {
            console.error("Error in SSE poll:", error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
              )
            );
          }
        }, 2000); // Poll every 2 seconds

        // Cleanup on stream close
        request.signal.addEventListener("abort", () => {
          console.log(`🔌 Client disconnected from SSE stream for job ${jobId}`);
          clearInterval(intervalId);
          isStreamClosed = true;
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error creating SSE stream:", error);
    return new Response(error.message, { status: 500 });
  }
}