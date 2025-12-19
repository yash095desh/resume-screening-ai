import { openrouter, PAID_MODEL } from "./openrouter";
import { generateObject } from "ai";
import { linkedInSearchFiltersSchema } from "../validations/sourcing";

/**
 * Format job description into LinkedIn search filters using AI
 * Returns filters compatible with harvestapi/linkedin-profile-search actor
 */
export async function formatJobDescriptionForLinkedIn(
  jobDescription: string
): Promise<{
  keywords: string[];
  titles: string[];
  experienceYears?: string;
  location?: string;
  companies?: string[];
}> {
  try {
    const { object } = await generateObject({
      model: openrouter(PAID_MODEL),
      schema: linkedInSearchFiltersSchema,
      prompt: `You are an expert recruiter analyzing a job description to create LinkedIn search filters.

Job Description:
${jobDescription}

Your task: Extract precise, realistic LinkedIn search parameters that will find qualified candidates.

IMPORTANT GUIDELINES:

1. **Keywords** (5-10 technical skills/tools):
   - Focus on MUST-HAVE technical skills only
   - Include tools, frameworks, languages, methodologies
   - Be specific (e.g., "React", "AWS", "Python", not generic terms)
   - Example: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"]

2. **Job Titles** (3-5 variations):
   - List titles someone with these skills would currently have
   - Include seniority levels mentioned
   - Use common industry titles
   - Example: ["Senior Software Engineer", "Full Stack Developer", "Backend Engineer"]

3. **Experience Years** (if mentioned):
   - Use LinkedIn format: "3-5 years", "5+ years", "7-10 years"
   - Only include if explicitly stated or clearly implied
   - Leave empty if not specified

4. **Location** (if mentioned):
   - Use FULL location names to avoid LinkedIn auto-suggestions
   - Examples: "San Francisco, California" (NOT "SF"), "United Kingdom" (NOT "UK")
   - Include multiple cities if mentioned
   - Leave empty for remote/flexible positions

5. **Companies** (if mentioned):
   - Only include if specific companies are mentioned
   - Include competitors in the same industry if mentioned
   - Example: ["Google", "Meta", "Amazon"]

CRITICAL RULES:
- Be conservative - only include what's clearly important
- Don't infer too much - if not mentioned, leave empty
- Focus on what makes a candidate qualified, not nice-to-haves
- Use industry-standard terminology

Extract the filters now:`,
    });

    // Validate and clean the output
    const cleanedObject = {
      keywords: object.keywords || [],
      titles: object.titles || [],
      experienceYears: object.experienceYears,
      location: object.location,
      companies: object.companies,
    };

    console.log("📋 Extracted LinkedIn search filters:", JSON.stringify(cleanedObject, null, 2));

    return cleanedObject;
  } catch (error) {
    console.error("Error formatting job description:", error);
    throw new Error("Failed to format job description for LinkedIn search");
  }
}

/**
 * Validate search filters before sending to Apify
 */
export function validateSearchFilters(filters: {
  keywords?: string[];
  titles?: string[];
  experienceYears?: string;
  location?: string;
  companies?: string[];
}): boolean {
  // At least titles or keywords must be provided
  if ((!filters.titles || filters.titles.length === 0) && 
      (!filters.keywords || filters.keywords.length === 0)) {
    throw new Error("At least job titles or keywords must be provided");
  }

  // Validate location format (warn about common mistakes)
  if (filters.location) {
    const problematicLocations = ["UK", "NY", "SF", "LA"];
    if (problematicLocations.some(loc => filters.location === loc)) {
      console.warn(
        `⚠️ Location "${filters.location}" may cause issues. ` +
        `LinkedIn might interpret it differently (e.g., UK -> Ukraine). ` +
        `Consider using full names: "United Kingdom", "New York", etc.`
      );
    }
  }

  return true;
}