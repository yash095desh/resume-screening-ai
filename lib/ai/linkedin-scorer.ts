
import { generateObject } from "ai";
import { candidateScoreSchema } from "../validations/sourcing";
import { PAID_MODEL , openrouter} from "./openrouter"

/**
 * Score candidate with structured rubric (temperature: 0 for consistency)
 */
export async function scoreCandidateWithRubric(
  candidate: any,
  jobDescription: string
): Promise<{
  skillsScore: number;
  experienceScore: number;
  industryScore: number;
  titleScore: number;
  totalScore: number;
  reasoning: string;
}> {
  try {
    const { object } = await generateObject({
      model: openrouter(PAID_MODEL),
      temperature: 0,
      schema: candidateScoreSchema,
      prompt: `You are an expert recruiter scoring candidates. Use this EXACT rubric:

**SCORING RUBRIC (100 points total):**

1. **Skills Match (0-25 points)**
   - 20-25: Has 80%+ of required skills
   - 15-19: Has 60-79% of required skills
   - 10-14: Has 40-59% of required skills
   - 5-9: Has 20-39% of required skills
   - 0-4: Has <20% of required skills

2. **Experience Level (0-25 points)**
   - 20-25: Experience matches required years exactly (±1 year)
   - 15-19: Within 2-3 years of requirement
   - 10-14: Within 4-5 years of requirement
   - 5-9: 6+ years difference
   - 0-4: Entry-level for senior role or vice versa

3. **Industry Relevance (0-25 points)**
   - 20-25: Same exact industry/domain
   - 15-19: Related/adjacent industry
   - 10-14: Transferable but different industry
   - 5-9: Somewhat related experience
   - 0-4: Completely unrelated background

4. **Title/Seniority Fit (0-25 points)**
   - 20-25: Current title matches target seniority exactly
   - 15-19: One level off (e.g., Mid for Senior role)
   - 10-14: Two levels off
   - 5-9: Three+ levels off
   - 0-4: Completely mismatched seniority

---

**Job Description:**
${jobDescription}

---

**Candidate Profile:**
Name: ${candidate.fullName}
Headline: ${candidate.headline || "N/A"}
Current Position: ${candidate.currentPosition || "N/A"}
Company: ${candidate.currentCompany || "N/A"}
Experience: ${candidate.experienceYears || "Unknown"} years
Skills: ${candidate.skills?.join(", ") || "None listed"}
Experience History: ${JSON.stringify(candidate.experience || [], null, 2)}

---

Score this candidate using the rubric above. Be strict and objective.
Provide:
- skillsScore (0-25)
- experienceScore (0-25)
- industryScore (0-25)
- titleScore (0-25)
- totalScore (sum of above, 0-100)
- reasoning (2-3 sentences explaining the score breakdown)`,
    });

    return object;
  } catch (error) {
    console.error("Error scoring candidate:", error);
    throw new Error("Failed to score candidate");
  }
}

/**
 * Batch score candidates in parallel (max 10 concurrent)
 */
export async function batchScoreCandidates(
  candidates: any[],
  jobDescription: string,
  batchSize: number = 10
): Promise<Map<string, any>> {
  const scoreMap = new Map<string, any>();

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);

    console.log(
      ` Scoring batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        candidates.length / batchSize
      )}`
    );

    const scores = await Promise.all(
      batch.map(async (candidate) => {
        try {
          const score = await scoreCandidateWithRubric(candidate, jobDescription);
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
              totalScore: 0,
              reasoning: "Scoring failed",
            },
          };
        }
      })
    );

    scores.forEach(({ candidateId, score }) => {
      scoreMap.set(candidateId, score);
    });

    // Small delay between batches
    if (i + batchSize < candidates.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return scoreMap;
}