// app/api/sourcing/[jobId]/stream/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

    if (!job || job.userId !== userId) {
      return new Response("Unauthorized", { status: 403 });
    }

    const encoder = new TextEncoder();
    let isStreamClosed = false;
    let lastUpdateHash = "";

    const stream = new ReadableStream({
      async start(controller) {
        console.log(`📡 SSE stream started for job ${jobId}`);

        // Send initial connection
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
        );

        const intervalId = setInterval(async () => {
          if (isStreamClosed) {
            clearInterval(intervalId);
            return;
          }

          try {
            const latestJob = await prisma.sourcingJob.findUnique({
              where: { id: jobId },
              include: {
                candidates: {
                  where: { isScored: true },
                  orderBy: { matchScore: "desc" },
                  take: 10,
                  select: {
                    id: true,
                    fullName: true,
                    headline: true,
                    location: true,
                    profileUrl: true,
                    photoUrl: true,
                    currentPosition: true,
                    currentCompany: true,
                    currentCompanyLogo: true,
                    matchScore: true,
                    skillsScore: true,
                    experienceScore: true,
                    seniorityLevel: true,
                    hasContactInfo: true,
                    isDuplicate: true,
                    isOpenToWork: true,
                    matchedSkills: true,
                    bonusSkills: true,
                    email: true,
                    phone: true,
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

            // ✅ NO MORE TYPE ASSERTIONS - All fields exist in schema!
            const updateHash = JSON.stringify({
              status: latestJob.status,
              stage: latestJob.currentStage,
              scraped: latestJob.profilesScraped,
              parsed: latestJob.profilesParsed,
              saved: latestJob.profilesSaved,
              scored: latestJob.profilesScored,
            });

            // Only send if data changed
            if (updateHash !== lastUpdateHash) {
              lastUpdateHash = updateHash;

              const update = {
                type: "update",
                status: latestJob.status,
                currentStage: latestJob.currentStage ?? "PROCESSING",
                progress: {
                  totalFound: latestJob.totalProfilesFound,
                  scraped: latestJob.profilesScraped,
                  parsed: latestJob.profilesParsed,
                  saved: latestJob.profilesSaved,
                  scored: latestJob.profilesScored,
                  percentage: latestJob.totalProfilesFound > 0
                    ? Math.round((latestJob.profilesScored / latestJob.totalProfilesFound) * 100)
                    : 0,
                },
                candidates: latestJob.candidates,
                lastActivityAt: latestJob.lastActivityAt,
              };

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(update)}\n\n`)
              );
            }

            // Close stream when complete
            if (latestJob.status === "COMPLETED" || latestJob.status === "FAILED") {
              console.log(`✅ Job ${jobId} finished. Closing stream.`);
              
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
        }, 2000);

        // Cleanup on disconnect
        request.signal.addEventListener("abort", () => {
          console.log(`🔌 Client disconnected from SSE for job ${jobId}`);
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