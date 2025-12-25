// lib/sourcing/nodes/scrape-all.ts
import { scrapeLinkedInProfiles } from "@/lib/scrapping/apify-client";
import { prisma } from "@/lib/prisma";
import type { SourcingState } from "../state";

export async function scrapeAllProfiles(state: SourcingState) {
  console.log(`📦 Starting scrape phase for ${state.profileUrls.length} profiles...`);

  // ✅ RESUME SUPPORT: Check what's already scraped in database
  const existingJob = await prisma.sourcingJob.findUnique({
    where: { id: state.jobId },
    select: { 
      scrapedProfilesData: true,
      profilesScraped: true 
    }
  });

  let allScrapedProfiles = state.scrapedProfiles || [];
  
  // ✅ Resume from database if available
  if (existingJob?.scrapedProfilesData && Array.isArray(existingJob.scrapedProfilesData)) {
    allScrapedProfiles = existingJob.scrapedProfilesData as any[];
    console.log(`♻️ Resuming with ${allScrapedProfiles.length} already scraped profiles`);
  }

  const alreadyScrapedUrls = new Set(
    allScrapedProfiles
      .filter((p: any) => p.succeeded)
      .map((p: any) => p.url)
  );

  const remainingUrls = state.profileUrls.filter(
    url => !alreadyScrapedUrls.has(url)
  );

  if (remainingUrls.length === 0) {
    console.log(`✅ All profiles already scraped, skipping to next phase`);
    
    return {
      scrapedProfiles: allScrapedProfiles,
      currentStage: "SCRAPING_COMPLETE"
    };
  }

  console.log(`🔄 Scraping ${remainingUrls.length} remaining profiles...`);

  // Process in batches to avoid memory issues
  const batchSize = state.batchSize || 20;
  const totalBatches = Math.ceil(remainingUrls.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, remainingUrls.length);
    const batchUrls = remainingUrls.slice(start, end);

    console.log(`📦 Scraping batch ${i + 1}/${totalBatches} (${batchUrls.length} profiles)...`);

    try {
      const rawProfiles = await scrapeLinkedInProfiles(batchUrls);
      const succeeded = rawProfiles.filter((p: any) => p.succeeded).length;
      
      console.log(`✓ Batch ${i + 1}: Scraped ${succeeded}/${rawProfiles.length} successfully`);

      // Add to results
      allScrapedProfiles = [...allScrapedProfiles, ...rawProfiles];

      // ✅ Save checkpoint to database after each batch
      await prisma.sourcingJob.update({
        where: { id: state.jobId },
        data: {
          scrapedProfilesData: allScrapedProfiles as any,
          profilesScraped: allScrapedProfiles.filter((p: any) => p.succeeded).length,
          status: "SCRAPING_PROFILES",
          currentStage: `SCRAPING_BATCH_${i + 1}_OF_${totalBatches}`,
          lastActivityAt: new Date()
        }
      });

    } catch (error: any) {
      console.error(`❌ Batch ${i + 1} scraping failed:`, error.message);

      // Save partial progress and continue
      await prisma.sourcingJob.update({
        where: { id: state.jobId },
        data: {
          scrapedProfilesData: allScrapedProfiles as any,
          profilesScraped: allScrapedProfiles.filter((p: any) => p.succeeded).length,
          errorMessage: `Batch ${i + 1} failed: ${error.message}`,
          lastActivityAt: new Date()
        }
      });

      // Continue with next batch instead of failing entirely
      continue;
    }
  }

  const successCount = allScrapedProfiles.filter((p: any) => p.succeeded).length;
  console.log(`✅ Scraping complete: ${successCount}/${state.profileUrls.length} profiles`);

  // Final update
  await prisma.sourcingJob.update({
    where: { id: state.jobId },
    data: {
      status: "PROFILES_FOUND",
      currentStage: "SCRAPING_COMPLETE",
      lastActivityAt: new Date()
    }
  });

  return {
    scrapedProfiles: allScrapedProfiles,
    currentStage: "SCRAPING_COMPLETE"
  };
}