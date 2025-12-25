// lib/sourcing/nodes/search-profiles.ts
import { searchLinkedInProfiles } from "@/lib/scrapping/apify-client";
import { prisma } from "@/lib/prisma";
import type { SourcingState } from "../state";

export async function searchWithPreciseQuery(state: SourcingState) {
  // 🧪 FORCE FAILURE FOR TESTING
  // console.log("🧪 TEST MODE: Forcing precise search to return 0 results");
  // return {
  //   profileUrls: [], // Empty results to trigger fallback
  //   searchAttempts: state.searchAttempts + 1,
  //   currentStage: "SEARCH_PRECISE_COMPLETE"
  // };
  return await executeSearch(state, "precise"); // Comment out for testing
}

export async function searchWithBroadQuery(state: SourcingState) {
  return await executeSearch(state, "broad");
}

export async function searchWithAlternativeQuery(state: SourcingState) {
  return await executeSearch(state, "alternative");
}

async function executeSearch(state: SourcingState, strategy: string) {
  console.log(`🔎 Searching with ${strategy} strategy...`);
  
  const query = state.searchQueries[state.currentQueryIndex];
  
  if (!query) {
    console.error(`❌ No query found at index ${state.currentQueryIndex}`);
    return {
      searchAttempts: state.searchAttempts + 1,
      currentQueryIndex: state.currentQueryIndex + 1,
      errors: [{
        stage: `search_${strategy}`,
        message: "No search query available",
        timestamp: new Date(),
        retryable: false
      }]
    };
  }
  
  try {
    const results = await searchLinkedInProfiles(query);
    const profileUrls = results.map(r => r.profileUrl).filter(Boolean);
    
    console.log(`✓ Found ${profileUrls.length} profiles with ${strategy} strategy`);
    
    //  Combine with existing URLs (avoid duplicates)
    const existingUrls = new Set(state.profileUrls);
    const newUrls = profileUrls.filter(url => !existingUrls.has(url));
    const allUrls = [...state.profileUrls, ...newUrls];
    
    // Update database
    await prisma.sourcingJob.update({
      where: { id: state.jobId },
      data: {
        discoveredUrls: allUrls as any,
        totalProfilesFound: allUrls.length,
        status: allUrls.length > 0 ? "PROFILES_FOUND" : "SEARCHING_PROFILES",
        currentStage: `SEARCH_${strategy.toUpperCase()}`,
        lastActivityAt: new Date()
      }
    });
    
    //  Return updated profileUrls
    return {
      profileUrls: allUrls,
      searchAttempts: state.searchAttempts + 1,
      currentQueryIndex: state.currentQueryIndex + 1,
      currentStage: `SEARCH_${strategy.toUpperCase()}_COMPLETE`
    };
    
  } catch (error: any) {
    console.error(`❌ Search failed with ${strategy}:`, error.message);
    
    await prisma.sourcingJob.update({
      where: { id: state.jobId },
      data: {
        errorMessage: `Search ${strategy} failed: ${error.message}`,
        lastActivityAt: new Date()
      }
    });
    
    return {
      searchAttempts: state.searchAttempts + 1,
      currentQueryIndex: state.currentQueryIndex + 1,
      errors: [{
        stage: `search_${strategy}`,
        message: error.message,
        timestamp: new Date(),
        retryable: true
      }]
    };
  }
}