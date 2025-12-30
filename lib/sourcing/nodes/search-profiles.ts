// lib/sourcing/nodes/search-profiles.ts
import { searchLinkedInProfiles } from "@/lib/scrapping/apify-client";
import { prisma } from "@/lib/prisma";
import type { SourcingState } from "../state";

export async function searchProfiles(state: SourcingState) {
  console.log(`\n🔍 SEARCH ITERATION ${state.searchIterations + 1}`);
  
  const currentCount = state.candidatesWithEmails || 0;
  const remaining = state.maxCandidates - currentCount;
  const searchTarget = Math.ceil(remaining * 2);
  
  console.log(`Current: ${currentCount}/${state.maxCandidates} | Need: ${remaining} | Searching: ${searchTarget}`);

  const discoveredUrls = new Set(state.discoveredUrls || []);
  let foundProfiles: any[] = [];
  
  const strategies = ["precise", "broad", "alternative"];
  
  for (const strategy of strategies) {
    console.log(`\n🔎 Trying ${strategy.toUpperCase()} strategy...`);
    
    const query = state.searchQueries.find((q: any) => q.type === strategy);
    if (!query) {
      console.log(`⚠️ No ${strategy} query found, skipping`);
      continue;
    }
    
    const adjustedQuery = {
      ...query,
      maxItems: searchTarget,
    };
    
    try {
      const results = await searchLinkedInProfiles(adjustedQuery);
      
      console.log(` Found ${results.length} profiles from search`);
      
      const newProfiles = results.filter((profile: any) => 
        profile.profileUrl && !discoveredUrls.has(profile.profileUrl)
      );
      
      console.log(`   ${newProfiles.length} are new (${results.length - newProfiles.length} duplicates removed)`);
      
      foundProfiles = [...foundProfiles, ...newProfiles];
      newProfiles.forEach((profile: any) => discoveredUrls.add(profile.profileUrl));
      
      if (foundProfiles.length >= searchTarget) {
        console.log(`✅ Found enough profiles (${foundProfiles.length}), stopping search`);
        break;
      }
      
      console.log(`   Need ${searchTarget - foundProfiles.length} more profiles, trying next strategy...`);
      
    } catch (error: any) {
      console.error(`❌ ${strategy} search failed:`, error.message);
      
      await prisma.sourcingJob.update({
        where: { id: state.jobId },
        data: {
          errorMessage: `Search ${strategy} failed: ${error.message}`,
          lastActivityAt: new Date()
        }
      });
      
      continue;
    }
  }
  
  console.log(`\n✅ Search complete: Found ${foundProfiles.length} new profiles (Total discovered: ${discoveredUrls.size})\n`);
  
  await prisma.sourcingJob.update({
    where: { id: state.jobId },
    data: {
      totalProfilesFound: discoveredUrls.size,
      status: "SEARCHING_PROFILES",
      currentStage: `SEARCH_ITERATION_${state.searchIterations + 1}_COMPLETE`,
      lastActivityAt: new Date()
    }
  });
  
  return {
    currentSearchResults: foundProfiles,
    discoveredUrls: discoveredUrls,
    searchIterations: state.searchIterations + 1,
    currentStage: "SEARCH_COMPLETE"
  };
}