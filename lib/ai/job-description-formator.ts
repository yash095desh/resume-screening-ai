import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { linkedInSearchFiltersSchema } from "../validations/sourcing";

/**
 * Format job description into LinkedIn search filters
 * - Uses AI output
 * - Dynamically loosens filters
 * - Never over-restricts
 * - Safe for demos AND production
 */
export async function formatJobDescriptionForLinkedIn(
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
  searchQuery?: string;
  currentJobTitles?: string[];
  locations?: string[];
  maxItems?: number;
  takePages?: number;
}> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: linkedInSearchFiltersSchema,
      system: `
You are a recruitment assistant.

GOAL:
Generate LinkedIn search filters that RETURN RESULTS.

RULES:
- Prefer broader titles over niche ones
- Keep searchQuery light (max 2–3 skills)
- Avoid strict industry or experience filters
- If unsure, stay broad
`,
      prompt: `
Job Description:
${jobDescription}

Structured Requirements:
${jobRequirements ? JSON.stringify(jobRequirements, null, 2) : "None"}

Return LinkedIn search filters that maximize discoverability.
`,
    });

    const safeFilters = normalizeAndLoosenFilters(object);

    console.log(
      "📋 Final LinkedIn search filters:",
      JSON.stringify(safeFilters, null, 2)
    );

    return safeFilters;
  } catch (error) {
    console.error("❌ AI filter generation failed:", error);

    // Fallback WITHOUT hardcoding specific skills/titles
    return {
      searchQuery: extractKeywords(jobDescription),
      maxItems: 30,
      takePages: 2,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                               Helper logic                                 */
/* -------------------------------------------------------------------------- */

/**
 * Dynamically loosens filters without hardcoding values
 */
function normalizeAndLoosenFilters(filters: any) {
  const result: any = {};

  /* ---------------- Job titles (soft limit) ---------------- */
  if (Array.isArray(filters.currentJobTitles) && filters.currentJobTitles.length) {
    result.currentJobTitles = filters.currentJobTitles.slice(0, 3);
  }

  /* ---------------- Search query (trim complexity) ---------------- */
  if (typeof filters.searchQuery === "string") {
    const tokens = filters.searchQuery
      .split(/AND|OR|\(|\)/i)
      .map((t: string) => t.trim())
      .filter(Boolean);

    result.searchQuery = tokens.slice(0, 2).join(" AND ");
  }

  /* ---------------- Location (only if present) ---------------- */
  if (Array.isArray(filters.locations) && filters.locations.length > 0) {
    result.locations = filters.locations.slice(0, 1);
  }

  /* ---------------- Hard removals ---------------- */
  // These often kill search results
  delete filters.industryIds;
  delete filters.totalYearsOfExperience;
  delete filters.currentCompanies;

  /* ---------------- Pagination defaults ---------------- */
  result.maxItems = Math.min(filters.maxItems || 50, 50);
  result.takePages = Math.min(filters.takePages || 2, 2);

  /* ---------------- Safety net ---------------- */
  if (!result.currentJobTitles && !result.searchQuery) {
    result.searchQuery = extractKeywordsFromText(filters);
  }

  return result;
}

/**
 * Extracts lightweight keywords from text without hardcoding
 */
function extractKeywords(text: string): string {
  return text
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(word => word.length > 4)
    .slice(0, 3)
    .join(" AND ");
}

/**
 * Last-resort keyword extraction
 */
function extractKeywordsFromText(filters: any): string {
  return JSON.stringify(filters)
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(word => word.length > 4)
    .slice(0, 3)
    .join(" AND ");
}
