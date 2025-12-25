// lib/sourcing/nodes/save-all.ts
import { checkDuplicateCandidate } from "@/lib/utils/deduplication";
import { hasContactInfo } from "@/lib/scrapping/profile-cleaner";
import { SourcingState } from "../state";
import { prisma } from "@/lib/prisma";

export async function saveAllCandidates(state: SourcingState) {
  console.log(`💾 Starting save phase for ${state.parsedProfiles.length} candidates...`);

  // ✅ RESUME SUPPORT: Check what's already saved
  const existingSaved = await prisma.linkedInCandidate.count({
    where: { sourcingJobId: state.jobId }
  });

  if (existingSaved >= state.parsedProfiles.length) {
    console.log(`✅ All ${existingSaved} candidates already saved`);
    
    return {
      currentStage: "SAVING_COMPLETE"
    };
  }

  console.log(`♻️ ${existingSaved} candidates already saved, processing remaining...`);

  // Get already saved profile URLs
  const savedCandidates = await prisma.linkedInCandidate.findMany({
    where: { sourcingJobId: state.jobId },
    select: { profileUrl: true }
  });

  const savedUrls = new Set(savedCandidates.map(c => c.profileUrl));

  const remainingProfiles = state.parsedProfiles.filter(
    p => !savedUrls.has(p.profileUrl)
  );

  console.log(`💾 Saving ${remainingProfiles.length} remaining candidates...`);

  let savedCount = 0;
  const batchSize = 20;
  const totalBatches = Math.ceil(remainingProfiles.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, remainingProfiles.length);
    const batch = remainingProfiles.slice(start, end);

    console.log(`💾 Saving batch ${i + 1}/${totalBatches} (${batch.length} candidates)...`);

    for (const profile of batch) {
      try {
        const duplicate = await checkDuplicateCandidate(
          state.userId,
          profile.profileUrl
        );

        await prisma.linkedInCandidate.create({
          data: {
            sourcingJobId: state.jobId,
            fullName: profile.fullName,
            headline: profile.headline,
            location: profile.location,
            profileUrl: profile.profileUrl,
            photoUrl: profile.photoUrl,
            currentPosition: profile.currentPosition,
            currentCompany: profile.currentCompany,
            experienceYears: profile.experienceYears,
            skills: profile.skills || [],
            experience: profile.experience || [],
            education: profile.education || [],
            email: profile.email,
            phone: profile.phone,
            hasContactInfo: hasContactInfo(profile),
            isDuplicate: !!duplicate,
            firstSeenJobId: duplicate?.sourcingJobId,
            rawData: profile,
          }
        });

        savedCount++;
      } catch (error: any) {
        console.error(`⚠️ Failed to save ${profile.fullName}:`, error.message);
      }
    }

    console.log(`✓ Batch ${i + 1}: Saved ${savedCount} candidates so far`);

    // ✅ Update progress after each batch
    await prisma.sourcingJob.update({
      where: { id: state.jobId },
      data: {
        profilesSaved: existingSaved + savedCount,
        status: "SAVING_PROFILES",
        currentStage: `SAVING_BATCH_${i + 1}_OF_${totalBatches}`,
        lastActivityAt: new Date()
      }
    });
  }

  console.log(`✅ Saving complete: ${existingSaved + savedCount} total candidates saved`);

  // Final update
  await prisma.sourcingJob.update({
    where: { id: state.jobId },
    data: {
      status: "SAVING_PROFILES",
      currentStage: "SAVING_COMPLETE",
      lastActivityAt: new Date()
    }
  });

  return {
    currentStage: "SAVING_COMPLETE"
  };
}