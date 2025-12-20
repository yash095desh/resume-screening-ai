import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { structuredCandidateSchema } from "../validations/sourcing";

/**
 * Parse cleaned profile into structured format using GPT-4o mini
 * Fast, cheap, and perfect for structured data extraction
 */

const SYSTEM_PROMPT = `
You are an expert data parser specialized in LinkedIn profiles. Your job is to convert raw LinkedIn profile data into a structured JSON object exactly as defined by the provided schema. 

CRITICAL RULES:
1. Return a **single JSON object only** — no explanations, no markdown, no extra text.
2. Include all fields present in the input. Omit only fields that are missing or completely unclear.
3. Normalize all company, school, and organization names (proper capitalization).
4. Keep all arrays intact (skills, experience, education, certifications) exactly as-is.
5. Calculate experienceYears if it is missing, using the experience array.
6. Ensure correct data types:
   - Strings for names, titles, locations
   - Numbers for experienceYears, connections, followers
   - Arrays for skills, experience, education, certifications
   - Booleans for isPremium, isVerified, isOpenToWork
7. Do not invent or guess any data not present in the profile.
8. Make output deterministic. Always produce the same structure for the same input.
9. Use proper JSON formatting, without trailing commas or comments.

If you understand, parse the input profile strictly according to these rules and output only the JSON object.
`;

export async function parseProfileWithAI(cleanedProfile: any): Promise<any> {
  try {
    // Validate minimum required data
    if (!cleanedProfile.fullName || !cleanedProfile.profileUrl) {
      console.warn(`⚠️ Missing required fields, using fallback`);
      return createFallbackProfile(cleanedProfile);
    }

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      temperature: 0,
      schema: structuredCandidateSchema,
      system: SYSTEM_PROMPT,
      prompt: buildParsingPrompt(cleanedProfile),
    });

    // Validate result
    if (!object.fullName || !object.profileUrl) {
      throw new Error("AI failed to generate required fields");
    }

    console.log(`✓ Parsed: ${object.fullName}`);
    return object;
  } catch (error: any) {
    console.error(
      `❌ AI parsing failed for ${cleanedProfile.fullName}:`,
      error.message
    );
    console.warn(`⚠️ Using manual fallback`);

    return createFallbackProfile(cleanedProfile);
  }
}

/**
 * Build concise parsing prompt
 */
function buildParsingPrompt(cleanedProfile: any): string {
  return `Parse this LinkedIn profile into structured format:

${JSON.stringify(cleanedProfile, null, 2)}

Extract all available fields. Ensure:
- fullName and profileUrl are present
- experienceYears is calculated from experience array if not provided
- Skills are kept as array of objects
- All data is accurate and properly formatted`;
}

/**
 * Fallback when AI parsing fails
 */
function createFallbackProfile(cleanedProfile: any): any {
  return {
    fullName: cleanedProfile.fullName || "Unknown",
    profileUrl: cleanedProfile.profileUrl,
    ...(cleanedProfile.headline && { headline: cleanedProfile.headline }),
    ...(cleanedProfile.location && { location: cleanedProfile.location }),
    ...(cleanedProfile.photoUrl && { photoUrl: cleanedProfile.photoUrl }),
    ...(cleanedProfile.linkedInId && { linkedInId: cleanedProfile.linkedInId }),
    ...(cleanedProfile.publicIdentifier && {
      publicIdentifier: cleanedProfile.publicIdentifier,
    }),

    ...(cleanedProfile.currentPosition && {
      currentPosition: cleanedProfile.currentPosition,
    }),
    ...(cleanedProfile.currentCompany && {
      currentCompany: cleanedProfile.currentCompany,
    }),
    ...(cleanedProfile.experienceYears && {
      experienceYears: cleanedProfile.experienceYears,
    }),

    ...(cleanedProfile.skills && { skills: cleanedProfile.skills }),
    ...(cleanedProfile.experience && { experience: cleanedProfile.experience }),
    ...(cleanedProfile.education && { education: cleanedProfile.education }),
    ...(cleanedProfile.certifications && {
      certifications: cleanedProfile.certifications,
    }),

    ...(cleanedProfile.email && { email: cleanedProfile.email }),
    ...(cleanedProfile.phone && { phone: cleanedProfile.phone }),

    ...(cleanedProfile.connections && {
      connections: cleanedProfile.connections,
    }),
    ...(cleanedProfile.followers && { followers: cleanedProfile.followers }),
    isPremium: cleanedProfile.isPremium || false,
    isVerified: cleanedProfile.isVerified || false,
    isOpenToWork: cleanedProfile.isOpenToWork || false,
  };
}
