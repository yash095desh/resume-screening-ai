// lib/sourcing/nodes/parse-all.ts
import { cleanProfileData, isValidProfile } from "@/lib/scrapping/profile-cleaner";
import { parseProfileWithAI } from "@/lib/ai/profile-parser";
import { SourcingState } from "../state";
import { prisma } from "@/lib/prisma";

export async function parseAllProfiles(state: SourcingState) {
  console.log(`🔄 Starting parse phase...`);

  // ✅ RESUME SUPPORT: Check what's already parsed in database
  const existingJob = await prisma.sourcingJob.findUnique({
    where: { id: state.jobId },
    select: { 
      parsedProfilesData: true,
      profilesParsed: true 
    }
  });

  let allParsedProfiles = state.parsedProfiles || [];

  // ✅ Resume from database if available
  if (existingJob?.parsedProfilesData && Array.isArray(existingJob.parsedProfilesData)) {
    allParsedProfiles = existingJob.parsedProfilesData as any[];
    console.log(`♻️ Resuming with ${allParsedProfiles.length} already parsed profiles`);
  }

  // Get valid profiles that need parsing
  const validProfiles = state.scrapedProfiles
    .map(cleanProfileData)
    .filter(isValidProfile);

  const alreadyParsedUrls = new Set(
    allParsedProfiles.map((p: any) => p.profileUrl)
  );

  const remainingProfiles = validProfiles.filter(
    p => !alreadyParsedUrls.has(p.url)
  );

  if (remainingProfiles.length === 0) {
    console.log(` All profiles already parsed, skipping to next phase`);
    
    return {
      parsedProfiles: allParsedProfiles,
      currentStage: "PARSING_COMPLETE"
    };
  }

  console.log(`🔄 Parsing ${remainingProfiles.length} remaining profiles...`);

  // Parse in smaller batches (AI calls are slower)
  const batchSize = 10;
  const totalBatches = Math.ceil(remainingProfiles.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, remainingProfiles.length);
    const batch = remainingProfiles.slice(start, end);

    console.log(`🤖 Parsing batch ${i + 1}/${totalBatches} (${batch.length} profiles)...`);

    try {
      const parseResults = await Promise.allSettled(
        batch.map(profile => parseProfileWithAI(profile))
      );

      const parsedBatch = parseResults
        .filter(r => r.status === "fulfilled")
        .map((r: any) => r.value);

      console.log(`✓ Batch ${i + 1}: Parsed ${parsedBatch.length}/${batch.length} successfully`);

      // Add to results
      allParsedProfiles = [...allParsedProfiles, ...parsedBatch];

      // ✅ Save checkpoint to database after each batch
      await prisma.sourcingJob.update({
        where: { id: state.jobId },
        data: {
          parsedProfilesData: allParsedProfiles as any,
          profilesParsed: allParsedProfiles.length,
          status: "PARSING_PROFILES",
          currentStage: `PARSING_BATCH_${i + 1}_OF_${totalBatches}`,
          lastActivityAt: new Date()
        }
      });

    } catch (error: any) {
      console.error(`❌ Batch ${i + 1} parsing failed:`, error.message);

      // Save partial progress
      await prisma.sourcingJob.update({
        where: { id: state.jobId },
        data: {
          parsedProfilesData: allParsedProfiles as any,
          profilesParsed: allParsedProfiles.length,
          errorMessage: `Parse batch ${i + 1} failed: ${error.message}`,
          lastActivityAt: new Date()
        }
      });

      continue;
    }
  }

  console.log(`✅ Parsing complete: ${allParsedProfiles.length} profiles parsed`);

  // Final update
  await prisma.sourcingJob.update({
    where: { id: state.jobId },
    data: {
      status: "PARSING_PROFILES",
      currentStage: "PARSING_COMPLETE",
      lastActivityAt: new Date()
    }
  });

  return {
    parsedProfiles: allParsedProfiles,
    currentStage: "PARSING_COMPLETE"
  };
}