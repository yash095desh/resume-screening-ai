import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { candidateScoreSchema } from "../validations/sourcing";

/**
 * ✅ ENHANCED: Score candidate with skill matching and experience analysis
 * Now extracts: matchedSkills, missingSkills, bonusSkills, relevantYears, seniorityLevel, industryMatch
 */
export async function scoreCandidateWithRubric(
  candidate: any,
  jobDescription: string,
  jobRequirements?: {
    requiredSkills?: string;
    niceToHave?: string;
    yearsOfExperience?: string;
    location?: string;
    industry?: string;
    educationLevel?: string;
    companyType?: string;
  }
): Promise<{
  skillsScore: number;
  experienceScore: number;
  industryScore: number;
  titleScore: number;
  niceToHaveScore: number;
  totalScore: number;
  reasoning: string;
  matchedSkills: string[];
  missingSkills: string[];
  bonusSkills: string[];
  relevantYears: number | null;
  seniorityLevel: "Entry" | "Mid" | "Senior" | "Lead" | "Executive";
  industryMatch: string | null;
}> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      temperature: 0, // Ensures consistent scoring
      schema: candidateScoreSchema,
      system: `You are an expert recruiter evaluating LinkedIn profiles. Be realistic and lenient - candidates often don't list every skill they have.

SCORING PHILOSOPHY:
- Look for TRANSFERABLE skills and related experience
- Give credit for similar/adjacent skills (e.g., "Python" covers "Data Analysis")
- Consider job responsibilities, not just listed skills
- LinkedIn profiles are incomplete - infer capabilities from experience
- Aim for average scores of 65-75 for reasonable matches

RUBRIC (100 total):
1. Skills (0-30): Related/transferable skills count. Be generous with partial matches.
2. Experience (0-25): Relevant experience, even if not exact role. Similar work counts.
3. Industry (0-20): Adjacent industries are fine. Focus on transferable domain knowledge.
4. Title (0-15): Similar seniority levels acceptable. Responsibilities matter more than titles.
5. Bonus (0-10): Any related nice-to-have skills.

SKILL MATCHING RULES:
- matchedSkills: Required skills found in candidate profile (exact or similar)
- missingSkills: Required skills NOT found (be strict here)
- bonusSkills: Nice-to-have skills found (extras that add value)

EXPERIENCE ANALYSIS:
- relevantYears: Count ONLY years in similar roles/industries (not total career)
- seniorityLevel: Based on titles (Engineer→Entry, Senior→Senior, Lead/Manager→Lead, Director+→Executive)
- industryMatch: Primary industry from their background (SaaS, FinTech, Healthcare, etc.)

Default to giving benefit of the doubt. Most sourced candidates should score 60-80.`,
      prompt: `JOB: ${jobDescription}

${jobRequirements ? `REQUIREMENTS:
Must-Have Skills: ${jobRequirements.requiredSkills || 'Not specified'}
Nice-to-Have Skills: ${jobRequirements.niceToHave || 'Not specified'}
Experience Needed: ${jobRequirements.yearsOfExperience || 'Not specified'}
Industry: ${jobRequirements.industry || 'Any'}` : ''}

CANDIDATE: ${candidate.fullName}
Position: ${candidate.currentPosition || "N/A"} at ${candidate.currentCompany || "N/A"}
Total Experience: ${candidate.experienceYears || "Unknown"} years
Skills Listed: ${candidate.skills?.join(", ") || "None"}
Location: ${candidate.location || "N/A"}

Work History: ${JSON.stringify(candidate.experience || []).substring(0, 800)}

INSTRUCTIONS:
1. Score using the rubric above
2. Identify matchedSkills, missingSkills, and bonusSkills arrays
3. Calculate relevantYears (years in similar roles, not total career)
4. Determine seniorityLevel from job titles
5. Extract industryMatch from work history
6. Provide brief positive reasoning (2-3 sentences)

Score generously. Focus on potential and transferable skills.`,
    });

    return object;
  } catch (error) {
    console.error("Error scoring candidate:", error);
    throw new Error("Failed to score candidate");
  }
}

/**
 * ✅ Process candidates in parallel with concurrency control
 * This prevents overwhelming the API while maximizing throughput
 */
export async function scoreCandidatesInParallel(
  candidates: any[],
  jobDescription: string,
  jobRequirements: any,
  concurrencyLimit: number = 5
): Promise<Array<{
  candidateId: string;
  candidateName: string;
  status: 'success' | 'failed';
  score?: any;
  error?: string;
}>> {
  const results: Array<{
    candidateId: string;
    candidateName: string;
    status: 'success' | 'failed';
    score?: any;
    error?: string;
  }> = [];

  // Process in chunks to control concurrency
  for (let i = 0; i < candidates.length; i += concurrencyLimit) {
    const chunk = candidates.slice(i, i + concurrencyLimit);
    
    console.log(`   Processing ${i + 1}-${Math.min(i + concurrencyLimit, candidates.length)} of ${candidates.length}...`);
    
    const chunkResults = await Promise.allSettled(
      chunk.map(async (candidate) => {
        try {
          const score = await scoreCandidateWithRubric(
            candidate,
            jobDescription,
            jobRequirements
          );
          return {
            candidateId: candidate.id,
            candidateName: candidate.fullName,
            status: 'success' as const,
            score,
          };
        } catch (error: any) {
          return {
            candidateId: candidate.id,
            candidateName: candidate.fullName,
            status: 'failed' as const,
            error: error.message,
          };
        }
      })
    );

    // Extract results from settled promises
    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('❌ Unexpected promise rejection:', result.reason);
      }
    }
  }

  return results;
}

/**
 * ⚠️ DEPRECATED: Use scoreCandidatesInParallel instead
 * Keeping for backward compatibility
 */
export async function batchScoreCandidates(
  candidates: any[],
  jobDescription: string,
  jobRequirements?: {
    requiredSkills?: string;
    niceToHave?: string;
    yearsOfExperience?: string;
    location?: string;
    industry?: string;
    educationLevel?: string;
    companyType?: string;
  },
  batchSize: number = 10
): Promise<Map<string, any>> {
  const scoreMap = new Map<string, any>();

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);

    console.log(
      `⭐ Scoring batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        candidates.length / batchSize
      )}`
    );

    const scores = await Promise.all(
      batch.map(async (candidate) => {
        try {
          const score = await scoreCandidateWithRubric(
            candidate,
            jobDescription,
            jobRequirements
          );
          return { candidateId: candidate.id, score };
        } catch (error) {
          console.error(`Failed to score ${candidate.fullName}:`, error);
          return {
            candidateId: candidate.id,
            score: {
              skillsScore: 0,
              experienceScore: 0,
              industryScore: 0,
              titleScore: 0,
              niceToHaveScore: 0,
              totalScore: 0,
              reasoning: "Scoring failed due to error",
              matchedSkills: [],
              missingSkills: [],
              bonusSkills: [],
              relevantYears: null,
              seniorityLevel: "Mid" as const,
              industryMatch: null,
            },
          };
        }
      })
    );

    scores.forEach(({ candidateId, score }) => {
      scoreMap.set(candidateId, score);
    });

    // Small delay between batches to avoid rate limits
    if (i + batchSize < candidates.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return scoreMap;
}