// lib/sourcing/nodes/generate-queries.ts

import { prisma } from "@/lib/prisma";
import type { SourcingState } from "../state";

export async function generateSearchQueries(state: SourcingState) {
  console.log("🔍 Generating search strategies...");

  try {
    // Get search filters from state or database
    let searchFilters = state.searchFilters;

    if (!searchFilters) {
      const job = await prisma.sourcingJob.findUnique({
        where: { id: state.jobId },
        select: { searchFilters: true },
      });
      searchFilters = job?.searchFilters as any;
    }

    if (!searchFilters) {
      throw new Error("Search filters not found in state or database");
    }

    const meta = searchFilters._meta || {};
    const queries = [];

    // === STRATEGY 1: PRECISE (Use all filters including experience) ===
    queries.push({
      type: "precise",
      searchQuery: searchFilters.searchQuery,
      currentJobTitles: searchFilters.currentJobTitles,
      locations: searchFilters.locations,
      industryIds: searchFilters.industryIds,
      experienceLevels: searchFilters.experienceLevels, // ✅ ADD THIS
      maxItems: state.maxCandidates,
      takePages: searchFilters.takePages,
    });

    // === STRATEGY 2: BROAD (Remove industry but keep experience level) ===
    queries.push({
      type: "broad",
      searchQuery: searchFilters.searchQuery,
      currentJobTitles: searchFilters.currentJobTitles?.slice(0, 3),
      locations: searchFilters.locations,
      experienceLevels: searchFilters.experienceLevels, // ✅ ADD THIS
      maxItems: state.maxCandidates,
      takePages: searchFilters.takePages,
    });

    // === STRATEGY 3: ALTERNATIVE (Keep experience level) ===
    if (meta.niceToHaveSkills && meta.niceToHaveSkills.length > 0) {
      const alternativeQuery = meta.niceToHaveSkills.slice(0, 3).join(" AND ");

      queries.push({
        type: "alternative",
        searchQuery: alternativeQuery,
        currentJobTitles: searchFilters.currentJobTitles,
        locations: searchFilters.locations,
        experienceLevels: searchFilters.experienceLevels, // ✅ ADD THIS
        maxItems: state.maxCandidates,
        takePages: searchFilters.takePages,
      });
    }

    console.log(`✅ Generated ${queries.length} search strategies`);

    await prisma.sourcingJob.update({
      where: { id: state.jobId },
      data: {
        status: "SEARCHING_PROFILES",
        currentStage: "QUERY_GENERATED",
        lastActivityAt: new Date(),
      },
    });

    return {
      searchFilters: searchFilters,
      searchQueries: queries,
      currentQueryIndex: 0,
      searchAttempts: 0,
      currentStage: "QUERY_GENERATED",
    };
  } catch (error: any) {
    console.error("❌ Generate queries failed:", error.message);

    await prisma.sourcingJob.update({
      where: { id: state.jobId },
      data: {
        status: "FAILED",
        errorMessage: error.message,
        failedAt: new Date(),
      },
    });

    return {
      errors: [
        {
          stage: "generate_queries",
          message: error.message,
          timestamp: new Date(),
          retryable: true,
        },
      ],
      currentStage: "QUERY_GENERATION_FAILED",
    };
  }
}
