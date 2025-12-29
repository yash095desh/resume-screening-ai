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

            // Create a comprehensive hash to detect ANY meaningful change
            const currentState = {
              status: latestJob.status,
              stage: latestJob.currentStage,
              totalFound: latestJob.totalProfilesFound,
              scraped: latestJob.profilesScraped,
              parsed: latestJob.profilesParsed,
              saved: latestJob.profilesSaved,
              scored: latestJob.profilesScored,
              candidateCount: latestJob.candidates.length,
            };
            
            const updateHash = JSON.stringify(currentState);

            // Send update if anything changed
            if (updateHash !== lastUpdateHash) {
              lastUpdateHash = updateHash;

              // Calculate progress based on current stage and completion
              const calculateProgress = () => {
                const stage = latestJob.currentStage;
                const total = latestJob.totalProfilesFound;
                
                let baseProgress = 0;
                
                // Get base progress from completed stages
                switch (stage) {
                  case "CREATED":
                    baseProgress = 0;
                    break;
                    
                  case "FORMATTING_JD":
                    baseProgress = 5;
                    break;
                    
                  case "SEARCHING_PROFILES":
                    baseProgress = 15;
                    break;
                    
                  case "SEARCHING_COMPLETE":
                    baseProgress = 30; // Search done, ready for scraping
                    break;
                    
                  case "SCRAPING_PROFILES":
                    baseProgress = 30;
                    // Add progress within scraping stage (30% of total progress)
                    if (total > 0 && latestJob.profilesScraped > 0) {
                      const stageProgress = Math.round((latestJob.profilesScraped / total) * 30);
                      baseProgress += stageProgress;
                      console.log(`[Progress] Scraping: ${latestJob.profilesScraped}/${total} = +${stageProgress}% → ${baseProgress}%`);
                    }
                    break;
                    
                  case "SCRAPING_COMPLETE":
                    baseProgress = 60; // Scraping done, ready for parsing
                    break;
                    
                  case "PARSING_PROFILES":
                    baseProgress = 60;
                    // Add progress within parsing stage (20% of total progress)
                    if (total > 0 && latestJob.profilesParsed > 0) {
                      const stageProgress = Math.round((latestJob.profilesParsed / total) * 20);
                      baseProgress += stageProgress;
                      console.log(`[Progress] Parsing: ${latestJob.profilesParsed}/${total} = +${stageProgress}% → ${baseProgress}%`);
                    }
                    break;
                    
                  case "PARSING_COMPLETE":
                    baseProgress = 80; // Parsing done, ready for saving
                    break;
                    
                  case "SAVING_PROFILES":
                    baseProgress = 80;
                    // Add progress within saving stage (10% of total progress)
                    if (total > 0 && latestJob.profilesSaved > 0) {
                      const stageProgress = Math.round((latestJob.profilesSaved / total) * 10);
                      baseProgress += stageProgress;
                      console.log(`[Progress] Saving: ${latestJob.profilesSaved}/${total} = +${stageProgress}% → ${baseProgress}%`);
                    }
                    break;
                    
                  case "SAVING_COMPLETE":
                    baseProgress = 90; // Saving done, ready for scoring
                    break;
                    
                  case "SCORING_PROFILES":
                    baseProgress = 90;
                    // Add progress within scoring stage (10% of total progress)
                    if (total > 0 && latestJob.profilesScored > 0) {
                      const stageProgress = Math.round((latestJob.profilesScored / total) * 10);
                      baseProgress += stageProgress;
                      console.log(`[Progress] Scoring: ${latestJob.profilesScored}/${total} = +${stageProgress}% → ${baseProgress}%`);
                    }
                    break;
                    
                  case "SCORING_COMPLETE":
                    baseProgress = 100; // All done!
                    break;
                    
                  default:
                    console.log(`[Progress] ⚠️  Unknown stage: ${stage}, using fallback calculation`);
                    // Fallback: calculate based on what's actually been done
                    if (latestJob.profilesScored === total && total > 0) {
                      baseProgress = 100;
                    } else if (latestJob.profilesSaved === total && total > 0) {
                      baseProgress = 90;
                    } else if (latestJob.profilesParsed === total && total > 0) {
                      baseProgress = 80;
                    } else if (latestJob.profilesScraped === total && total > 0) {
                      baseProgress = 60;
                    } else {
                      baseProgress = 0;
                    }
                }

                const finalProgress = Math.min(baseProgress, 100);
                return finalProgress;
              };

              const progressPercentage = calculateProgress();

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
                  percentage: progressPercentage,
                },
                candidates: latestJob.candidates,
                lastActivityAt: latestJob.lastActivityAt,
              };

              console.log(`[SSE] ✉️  Sending update: ${update.currentStage} @ ${progressPercentage}%`);

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(update)}\n\n`)
              );
            } else {
              // No changes detected - just continue polling
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