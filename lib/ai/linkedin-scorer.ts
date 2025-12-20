import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { candidateScoreSchema } from "../validations/sourcing";

/**
 * Score candidate with structured rubric using GPT-4o (temperature: 0 for consistency)
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
}> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      temperature: 0, // Ensures consistent scoring
      schema: candidateScoreSchema,
      system: `You are an expert recruiter scoring candidates based on their ability to perform the job. You must be strict, objective, and consistent in your evaluations.

Your goal: Determine if the candidate CAN DO THE JOB based on skills and experience.

Use the EXACT rubric below. Do not be lenient - score accurately based on actual matches.`,
      prompt: `**SCORING RUBRIC (100 points total):**

═══════════════════════════════════════════════════════════════════

**1. REQUIRED SKILLS MATCH (0-30 points)** ⭐ MOST IMPORTANT
   - 25-30: Has 90-100% of required skills with strong proficiency
   - 20-24: Has 75-89% of required skills
   - 15-19: Has 60-74% of required skills
   - 10-14: Has 40-59% of required skills
   - 5-9:  Has 20-39% of required skills
   - 0-4:  Has <20% of required skills

   EVALUATION RULES:
   - Match skills exactly (e.g., "React" matches "React.js", "ReactJS")
   - Consider related technologies (e.g., "Node.js" experience implies "JavaScript")
   - Years of experience with the skill matters (1 year vs 5 years)
   - Don't give credit for vague mentions - must be clearly demonstrated

═══════════════════════════════════════════════════════════════════

**2. EXPERIENCE LEVEL (0-25 points)**
   - 23-25: Experience matches required years exactly (±1 year)
   - 18-22: Within 2 years of requirement
   - 13-17: Within 3-4 years of requirement
   - 8-12:  Within 5-6 years of requirement
   - 3-7:   7+ years difference
   - 0-2:   Severe mismatch (entry-level for senior role or vice versa)

   EVALUATION RULES:
   - Count RELEVANT experience only, not total career length
   - Junior roles: 0-3 years | Mid: 3-5 years | Senior: 5-8 years | Lead: 8-12 years | Principal: 12+ years
   - Being overqualified is better than underqualified (but note it in reasoning)

═══════════════════════════════════════════════════════════════════

**3. INDUSTRY RELEVANCE (0-20 points)**
   - 18-20: Same exact industry/domain (e.g., FinTech to FinTech)
   - 14-17: Closely related industry (e.g., SaaS to Cloud)
   - 10-13: Adjacent industry with transferable skills (e.g., E-commerce to Retail Tech)
   - 5-9:   Different but somewhat related (e.g., Healthcare to Insurance)
   - 0-4:   Completely unrelated background

   EVALUATION RULES:
   - Industry matters less for highly technical roles
   - Domain expertise is crucial for specialized fields (Finance, Healthcare, etc.)
   - B2B and B2C experience can be different

═══════════════════════════════════════════════════════════════════

**4. TITLE/SENIORITY FIT (0-15 points)**
   - 14-15: Current title matches target seniority exactly
   - 11-13: One level off (e.g., Mid-level for Senior role)
   - 8-10:  Two levels off (e.g., Junior for Senior role)
   - 4-7:   Three levels off
   - 0-3:   Completely mismatched seniority (e.g., Intern for Director role)

   EVALUATION RULES:
   - Focus on actual responsibilities, not just title
   - IC (Individual Contributor) vs Manager track matters
   - Some companies have inflated titles - look at actual scope

═══════════════════════════════════════════════════════════════════

**5. NICE-TO-HAVE SKILLS (0-10 points)** 💎 BONUS
   - 9-10:  Has 80%+ of nice-to-have skills
   - 7-8:   Has 60-79% of nice-to-have skills
   - 5-6:   Has 40-59% of nice-to-have skills
   - 3-4:   Has 20-39% of nice-to-have skills
   - 0-2:   Has <20% of nice-to-have skills

   EVALUATION RULES:
   - These are bonuses, not requirements
   - Don't penalize heavily for missing these
   - If no nice-to-have skills specified, give 5 points (neutral)

═══════════════════════════════════════════════════════════════════

**TOTAL SCORE = Skills + Experience + Industry + Title + Nice-to-Have**

**Score Interpretation:**
- 90-100: Excellent match - High priority candidate
- 75-89:  Strong match - Good candidate
- 60-74:  Decent match - Consider if other candidates are limited
- 40-59:  Weak match - Only if desperate
- 0-39:   Poor match - Reject

═══════════════════════════════════════════════════════════════════

**JOB REQUIREMENTS:**

Job Description:
${jobDescription}

${jobRequirements ? `
Structured Requirements:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ REQUIRED SKILLS (Must-Have):
${jobRequirements.requiredSkills || 'Not specified'}

⭐ NICE-TO-HAVE SKILLS (Bonus):
${jobRequirements.niceToHave || 'Not specified'}

📅 EXPERIENCE REQUIRED:
${jobRequirements.yearsOfExperience || 'Not specified'}

📍 LOCATION:
${jobRequirements.location || 'Any'}

🏢 INDUSTRY:
${jobRequirements.industry || 'Any'}

🎓 EDUCATION LEVEL:
${jobRequirements.educationLevel || 'Not specified'}

🏛️ COMPANY TYPE PREFERENCE:
${jobRequirements.companyType || 'Any'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}

═══════════════════════════════════════════════════════════════════

**CANDIDATE PROFILE:**

Name: ${candidate.fullName}
Headline: ${candidate.headline || "N/A"}
Current Position: ${candidate.currentPosition || "N/A"}
Current Company: ${candidate.currentCompany || "N/A"}
Total Experience: ${candidate.experienceYears || "Unknown"} years
Location: ${candidate.location || "N/A"}

Skills: ${candidate.skills?.join(", ") || "None listed"}

Experience History:
${JSON.stringify(candidate.experience || [], null, 2)}

Education:
${JSON.stringify(candidate.education || [], null, 2)}

═══════════════════════════════════════════════════════════════════

**INSTRUCTIONS:**

1. Carefully analyze the candidate against EACH category
2. Count exact skill matches for required skills
3. Count exact skill matches for nice-to-have skills
4. Evaluate experience relevance, not just years
5. Be strict but fair - don't inflate scores
6. Provide specific reasoning with examples

**Provide your scores:**
- skillsScore (0-30)
- experienceScore (0-25)
- industryScore (0-20)
- titleScore (0-15)
- niceToHaveScore (0-10)
- totalScore (sum of all above, 0-100)
- reasoning (3-4 sentences explaining key strengths and gaps)

Score this candidate now:`,
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