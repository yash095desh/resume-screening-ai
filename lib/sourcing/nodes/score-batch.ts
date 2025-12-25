// lib/sourcing/nodes/score-all.ts
import { scoreCandidatesInParallel } from "@/lib/ai/linkedin-scorer";
import { SourcingState } from "../state";
import { prisma } from "@/lib/prisma";

export async function scoreAllCandidates(state: SourcingState) {
  console.log(`⭐ Starting scoring phase...`);

  // ✅ RESUME SUPPORT: Get only unscored candidates
  const totalCandidates = await prisma.linkedInCandidate.count({
    where: { sourcingJobId: state.jobId }
  });

  const scoredCount = await prisma.linkedInCandidate.count({
    where: { 
      sourcingJobId: state.jobId,
      isScored: true 
    }
  });

  if (scoredCount >= totalCandidates) {
    console.log(`✅ All ${totalCandidates} candidates already scored`);
    
    await prisma.sourcingJob.update({
      where: { id: state.jobId },
      data: {
        status: "COMPLETED",
        currentStage: "SCORING_COMPLETE",
        completedAt: new Date(),
        lastActivityAt: new Date()
      }
    });

    return {
      currentStage: "COMPLETED"
    };
  }

  console.log(`♻️ ${scoredCount}/${totalCandidates} already scored, processing remaining...`);

  // Get job requirements
  const job = await prisma.sourcingJob.findUnique({
    where: { id: state.jobId }
  });

  if (!job) {
    throw new Error("Job not found");
  }

  const batchSize = 20;
  let processedInThisRun = 0;

  while (true) {
    // Get next batch of unscored candidates
    const candidates = await prisma.linkedInCandidate.findMany({
      where: {
        sourcingJobId: state.jobId,
        isScored: false
      },
      take: batchSize
    });

    if (candidates.length === 0) {
      console.log(`✅ No more candidates to score`);
      break;
    }

    console.log(`⭐ Scoring batch of ${candidates.length} candidates...`);

    try {
      const results = await scoreCandidatesInParallel(
        candidates,
        job.rawJobDescription,
        job.jobRequirements as any,
        5 // Concurrency limit
      );

      let batchScoredCount = 0;

      for (const result of results) {
        if (result.status === 'success' && result.score) {
          try {
            // ✅ ENHANCED: Save all new fields including skill matching and experience analysis
            await prisma.linkedInCandidate.update({
              where: { id: result.candidateId },
              data: {
                // Core scores
                matchScore: result.score.totalScore,
                skillsScore: result.score.skillsScore,
                experienceScore: result.score.experienceScore,
                industryScore: result.score.industryScore,
                titleScore: result.score.titleScore,
                niceToHaveScore: result.score.niceToHaveScore,
                matchReason: result.score.reasoning,
                
                // ✅ NEW: Skill matching details (for Skills Analysis tab)
                matchedSkills: result.score.matchedSkills || [],
                missingSkills: result.score.missingSkills || [],
                bonusSkills: result.score.bonusSkills || [],
                
                // ✅ NEW: Experience insights (for Experience Analysis tab)
                relevantYears: result.score.relevantYears,
                seniorityLevel: result.score.seniorityLevel,
                industryMatch: result.score.industryMatch,
                
                // Metadata
                isScored: true,
                scoredAt: new Date(),
                scoringVersion: "v2.0" // Track version for future updates
              }
            });
            batchScoredCount++;
            
            // Log the enhanced data for monitoring
            console.log(`   ✓ ${result.candidateName}: ${result.score.totalScore}/100 | ` +
              `Matched: ${result.score.matchedSkills?.length || 0} | ` +
              `Missing: ${result.score.missingSkills?.length || 0} | ` +
              `Level: ${result.score.seniorityLevel} | ` +
              `Relevant: ${result.score.relevantYears || 0}yrs`
            );
            
          } catch (error: any) {
            console.error(`❌ Failed to update score for ${result.candidateName}:`, error.message);
          }
        } else if (result.status === 'failed') {
          console.error(`❌ Scoring failed for ${result.candidateName}:`, result.error);
        }
      }

      processedInThisRun += batchScoredCount;
      const totalScored = scoredCount + processedInThisRun;

      console.log(`✓ Scored ${batchScoredCount} candidates (${totalScored}/${totalCandidates} total)`);

      // ✅ Update progress
      await prisma.sourcingJob.update({
        where: { id: state.jobId },
        data: {
          profilesScored: totalScored,
          status: "SCORING_PROFILES",
          currentStage: `SCORED_${totalScored}_OF_${totalCandidates}`,
          lastActivityAt: new Date()
        }
      });

    } catch (error: any) {
      console.error(`❌ Scoring batch failed:`, error.message);

      await prisma.sourcingJob.update({
        where: { id: state.jobId },
        data: {
          errorMessage: `Scoring failed: ${error.message}`,
          lastActivityAt: new Date()
        }
      });

      // Continue to next batch instead of failing
      continue;
    }
  }

  console.log(`✅ Scoring complete: ${scoredCount + processedInThisRun}/${totalCandidates} candidates scored`);

  // Mark job as complete
  await prisma.sourcingJob.update({
    where: { id: state.jobId },
    data: {
      status: "COMPLETED",
      currentStage: "SCORING_COMPLETE",
      completedAt: new Date(),
      lastActivityAt: new Date()
    }
  });

  return {
    scoredCandidates: state.scoredCandidates || [],
    currentStage: "COMPLETED"
  };
}