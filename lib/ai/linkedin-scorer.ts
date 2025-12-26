import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { CandidateScore, candidateScoreSchema } from "../validations/sourcing";

/**
 * ✅ ENHANCED: Score candidate with skill matching and experience analysis
 * Now extracts: matchedSkills, missingSkills, bonusSkills, relevantYears, seniorityLevel, industryMatch
 */
// lib/ai/linkedin-scorer.ts

export async function scoreCandidateWithFullAnalysis(
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
): Promise<CandidateScore> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      temperature: 0, // Consistent scoring
      schema: candidateScoreSchema,
      system: ENHANCED_SYSTEM_PROMPT,
      prompt: `
      # JOB POSTING
        ${jobDescription}

        ${
          jobRequirements
            ? `
        REQUIREMENTS:
        - Must-Have Skills: ${jobRequirements.requiredSkills || "Not specified"}
        - Nice-to-Have Skills: ${jobRequirements.niceToHave || "Not specified"}
        - Experience Needed: ${jobRequirements.yearsOfExperience || "Not specified"}
        - Industry: ${jobRequirements.industry || "Any"}
        - Education: ${jobRequirements.educationLevel || "Not specified"}
        `
            : ""
        }
      # CANDIDATE PROFILE
        Name: ${candidate.fullName}
        Current Role: ${candidate.currentPosition || "N/A"} at ${
                candidate.currentCompany || "N/A"
              }
        Location: ${candidate.location || "N/A"}

        Total Experience: ${candidate.experienceYears || "Unknown"} years
        Skills Listed: ${candidate.skills?.join(", ") || "None"}

        Work History (last 3 roles):
        ${JSON.stringify(candidate.experience?.slice(0, 3) || []).substring(0, 1000)}

        Education:
        ${JSON.stringify(candidate.education || []).substring(0, 500)}

        TASK
        Conduct a comprehensive analysis covering all 5 sections:
        1. Interview Readiness (make a clear decision)
        2. Skill Analysis (detailed breakdown)
        3. Experience Analysis (relevance assessment)
        4. Gaps & Trade-offs (honest evaluation)
        5. Interview Focus Areas (actionable plan)
        Be thorough, specific, and helpful.
`,
    });

    return object;
  } catch (error) {
    console.error("Error scoring candidate:", error);
    throw new Error("Failed to score candidate");
  }
}

// lib/ai/linkedin-scorer.ts

const ENHANCED_SYSTEM_PROMPT = `You are an expert recruiter conducting comprehensive candidate analysis. Your goal is to provide actionable insights that help hiring managers make confident decisions.
ANALYSIS FRAMEWORK (5 Sections):
1. INTERVIEW READINESS (Primary Decision)
  Determine ONE of three statuses:
  READY_TO_INTERVIEW:
    - 80+ match score OR
    - 7+ matched skills (of 10 required) AND relevant experience
    - No critical deal-breakers
    - Confidence: 75-100
  INTERVIEW_WITH_VALIDATION:
    - 60-80 match score OR
    - 5-7 matched skills with some gaps
    - Has potential but needs validation
    - Confidence: 50-75
  NOT_RECOMMENDED:
    - <60 match score OR
    - <5 matched skills OR
    - Critical deal-breakers (wrong seniority, no relevant exp)
    - Confidence: 0-50
  Rules:
  - Be decisive but fair
  - Confidence score = how certain you are about the decision
  - candidateSummary = 2-3 sentences max (highlight key points)
  - keyStrengths = top 3 reasons to consider them (bullet points)
2.  SKILL ANALYSIS (What they can do)
  A. Score Skills (0-30 points):
    - Look for transferable skills, not just exact matches
    - Consider job responsibilities, not just listed skills
    - Be lenient (LinkedIn profiles are incomplete)
  B. Skill Proficiency (1-5 scale):
    5 = Expert (5+ years, led projects)
    4 = Advanced (3-5 years, production work)
    3 = Intermediate (1-3 years, some experience)
    2 = Beginner (mentioned but no depth)
    1 = No evidence
  C. Critical Gaps:
    - Only list gaps that would prevent job success
    - Max 3-4 critical gaps
    - Determine overall impact: High/Medium/Low
  D. Skills Analysis Summary:
    - 2-3 sentences
    - Focus on strength of technical foundation
    - Mention if upskilling is needed
3.  EXPERIENCE ANALYSIS (Background fit)
  A. Score Experience (0-25 points):
    - Relevant years (not just total)
    - Similar roles/responsibilities
    - Industry exposure
  B. Calculate Metrics:
    - relevantYears = years in SIMILAR roles (not total career)
    - seniorityAlignment = does their level match the role?
    - industryAlignment = how close is their background?
  C. Experience Highlights:
    - Pick top 3 most relevant roles
    - Rate each: High/Medium/Low relevance
    - Explain why it matters
  D. Experience Relevance Score (0-100):
    - Independent of main experience score
    - Measures how directly relevant their background is
    - Consider: role similarity, industry, team size, scope
  E. Analysis Summary:
    - 2-3 sentences
    - Highlight most relevant experience
    - Note any red flags (job hopping, career gaps)
4.  GAPS & TRADE-OFFS (Honest assessment)
  A. Critical Gaps:
    - skill: Missing technical requirements
    - experience: Lacks specific background
    - seniority: Level mismatch
    - industry: No domain knowledge
    For each gap:
    - Type
    - Description
    - Impact (High/Medium/Low)
    - Mitigation (if trainable)
  B. Acceptable Trade-offs:
    - Things that are close enough or trainable
    - Example: "Has Python but not Go → Python skills transfer"
  C. Deal-Breakers:
    - Only list absolute blockers
    - Example: "Requires 10 years, has 2"
    - Keep this array empty if none exist
  D. Overall Impact:
    - Manageable: Minor gaps, easy to fill
    - Significant: Major gaps but workable
    - Critical: Too many fundamental gaps
  E. Gaps Summary:
    - 2-3 sentences
    - Be honest but constructive
    - Suggest if candidate could grow into role
5.  INTERVIEW FOCUS AREAS (Action plan)
  A. Focus Areas (2-5 structured items):
    Categories:
    - "Skill Validation" (verify claimed expertise)
    - "Experience Depth" (probe relevant work)
    - "Gap Mitigation" (assess ability to learn)
    - "Culture Fit" (seniority, work style)
    For each:
    - Category
    - Specific question/topic
    - Reasoning (why it matters)
  B. Suggested Questions (5-8 specific questions):
    - Technical: "Explain your approach to..."
    - Behavioral: "Tell me about a time..."
    - Scenario: "How would you handle..."
    - Gap-related: "You haven't worked with X, how would you..."
  C. Red Flags (0-3 items):
    - Only list genuine concerns
    - Be specific, not generic
    - Example: "Short tenure (6 months) at last 3 companies"
  D. Interview Focus Summary:
    - 2-3 sentences
    - Main areas to probe
    - Overall interview strategy (deep-dive vs broad)
SCORING RUBRIC (100 total):
  1. Skills (0-30): Related/transferable skills count
  2. Experience (0-25): Relevant experience, similar work
  3. Industry (0-20): Adjacent industries acceptable
  4. Title (0-15): Similar seniority/responsibilities
  5. Bonus (0-10): Any nice-to-have skills
PHILOSOPHY:
  - Be realistic but lenient
  - Focus on potential, not perfection
  - Look for transferable skills
  - Average good matches should score 65-75
  - Great matches score 80+
  - Poor matches score <60
OUTPUT:
  - All sections must be completed
  - Use professional but conversational tone
  - Be specific, not generic
  - Provide actionable insights
  - Help recruiters make confident decisions`;

/**
 * ✅ Process candidates in parallel with concurrency control
 * This prevents overwhelming the API while maximizing throughput
 */
export async function scoreCandidatesInParallel(
  candidates: any[],
  jobDescription: string,
  jobRequirements: any,
  concurrencyLimit: number = 5
): Promise<
  Array<{
    candidateId: string;
    candidateName: string;
    status: "success" | "failed";
    score?: any;
    error?: string;
  }>
> {
  const results: Array<{
    candidateId: string;
    candidateName: string;
    status: "success" | "failed";
    score?: any;
    error?: string;
  }> = [];

  // Process in chunks to control concurrency
  for (let i = 0; i < candidates.length; i += concurrencyLimit) {
    const chunk = candidates.slice(i, i + concurrencyLimit);

    console.log(
      `   Processing ${i + 1}-${Math.min(
        i + concurrencyLimit,
        candidates.length
      )} of ${candidates.length}...`
    );

    const chunkResults = await Promise.allSettled(
      chunk.map(async (candidate) => {
        try {
          const score = await scoreCandidateWithFullAnalysis(
            candidate,
            jobDescription,
            jobRequirements
          );
          return {
            candidateId: candidate.id,
            candidateName: candidate.fullName,
            status: "success" as const,
            score,
          };
        } catch (error: any) {
          return {
            candidateId: candidate.id,
            candidateName: candidate.fullName,
            status: "failed" as const,
            error: error.message,
          };
        }
      })
    );

    // Extract results from settled promises
    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        console.error("❌ Unexpected promise rejection:", result.reason);
      }
    }
  }

  return results;
}
