// lib/sourcing/nodes/format-jd.ts
import { formatJobDescriptionForLinkedIn } from "@/lib/ai/job-description-formator";
import { prisma } from "@/lib/prisma";
import type { SourcingState } from "../state";

export async function formatJobDescription(state: SourcingState) {
  console.log("🎨 Formatting job description...");
  
  try {
    const searchFilters = await formatJobDescriptionForLinkedIn(
      state.rawJobDescription,
      state.jobRequirements,
      state.maxCandidates
    );
    
    // Update database
    await prisma.sourcingJob.update({
      where: { id: state.jobId },
      data: {
        searchFilters: searchFilters as any,
        status: "JD_FORMATTED",
        currentStage: "JD_FORMATTED",
        lastActivityAt: new Date()
      }
    });
    
    return {
      searchFilters: searchFilters,
      currentStage: "JD_FORMATTED"
    };
  } catch (error: any) {
    console.error("❌ Format JD failed:", error.message);
    
    await prisma.sourcingJob.update({
      where: { id: state.jobId },
      data: {
        status: "FAILED",
        errorMessage: error.message,
        failedAt: new Date()
      }
    });
    
    return {
      errors: [{
        stage: "format_jd",
        message: error.message,
        timestamp: new Date(),
        retryable: true
      }],
      currentStage: "FORMAT_FAILED"
    };
  }
}