import { openrouter, PAID_MODEL } from "./openrouter"
import { generateObject } from "ai";
import { structuredCandidateSchema } from "../validations/sourcing";

/**
 * ULTRA-ROBUST: Parse cleaned profile data into structured format using AI
 * 
 * Handles:
 * 1. AI returning arrays instead of objects
 * 2. AI not following schema exactly
 * 3. Missing required fields
 * 4. Fallback to manual parsing
 */
export async function parseProfileWithAI(cleanedProfile: any): Promise<any> {
  try {
    // Validate minimum required data
    if (!cleanedProfile.fullName || !cleanedProfile.profileUrl) {
      console.warn(`⚠️ Missing required fields in input, using fallback`);
      return createFallbackProfile(cleanedProfile);
    }

    // Try AI parsing with improved prompt
    const { object } = await generateObject({
      model: openrouter(PAID_MODEL),
      schema: structuredCandidateSchema,
      prompt: buildImprovedPrompt(cleanedProfile),
      temperature: 0.1,
    });

    // Validate result
    if (!object.fullName || !object.profileUrl) {
      throw new Error("AI failed to generate required fields");
    }

    console.log(`✓ AI Parsed: ${object.fullName}`);
    return object;

  } catch (error: any) {
    // Check if error is the "array instead of object" issue
    if (error.cause?.name === 'AI_TypeValidationError' && error.text) {
      console.warn(`⚠️ AI returned array instead of object, attempting to fix...`);
      
      try {
        // Try to parse the text response and extract the first object
        const parsed = JSON.parse(error.text);
        
        // If it's an array, take the first element
        if (Array.isArray(parsed) && parsed.length > 0) {
          const profile = parsed[0];
          
          // Validate it has required fields
          if (profile.fullName && profile.profileUrl) {
            console.log(`✓ Fixed array response: ${profile.fullName}`);
            return profile;
          }
        }
      } catch (parseError) {
        console.error(`Failed to parse AI text response:`, parseError);
      }
    }
    
    console.error(`❌ AI parsing failed:`, error.message);
    console.warn(`⚠️ Using manual fallback for ${cleanedProfile.fullName || 'unknown'}`);
    
    return createFallbackProfile(cleanedProfile);
  }
}

/**
 * Build an improved prompt that's very explicit about NOT returning arrays
 */
function buildImprovedPrompt(cleanedProfile: any): string {
  return `TASK: Parse ONE LinkedIn profile into a JSON object.

INPUT DATA:
${JSON.stringify(cleanedProfile, null, 2)}

CRITICAL INSTRUCTIONS:
1. Return a SINGLE JSON OBJECT (not an array)
2. Do NOT wrap in [ ]
3. Do NOT return multiple objects
4. Return exactly ONE profile object

REQUIRED FIELDS (must include):
- fullName: string
- profileUrl: string

OPTIONAL FIELDS (include if data exists):
- headline: string
- location: string  
- photoUrl: string (must be valid URL)
- currentPosition: string
- currentCompany: string
- experienceYears: number (calculate by summing job durations)
- skills: string[] (top 10 most relevant)
- experience: object[] (each with: title, company, duration, description?)
- education: object[] (each with: degree, school, year?)
- email: string (must be valid email)
- phone: string

RULES:
- fullName and profileUrl are MANDATORY
- Calculate experienceYears from experience array
- Limit skills to top 10
- Normalize company/title names (proper capitalization)
- Omit fields if data missing/unclear
- All URLs must be properly formatted
- Email must be valid format

OUTPUT FORMAT (EXACTLY THIS STRUCTURE):
{
  "fullName": "John Doe",
  "profileUrl": "https://linkedin.com/in/johndoe",
  "headline": "Software Engineer",
  ...
}

DO NOT OUTPUT:
[
  {
    "fullName": "John Doe",
    ...
  }
]

Return ONLY the JSON object. No explanations. No array wrapper.`;
}

/**
 * Create a valid fallback profile when AI parsing fails
 * Ensures all required fields are present
 */
function createFallbackProfile(cleanedProfile: any): any {
  // Extract required fields with multiple fallback attempts
  const fullName = cleanedProfile.fullName || 
                   cleanedProfile.name || 
                   (cleanedProfile.firstName && cleanedProfile.lastName 
                     ? `${cleanedProfile.firstName} ${cleanedProfile.lastName}`
                     : null) ||
                   'Unknown';
  
  const profileUrl = cleanedProfile.profileUrl || 
                     cleanedProfile.url || 
                     cleanedProfile.linkedInUrl ||
                     cleanedProfile.linkedin ||
                     '';

  // Validate we have minimum requirements
  if (!fullName || fullName === 'Unknown') {
    throw new Error('Cannot create profile: fullName is missing');
  }

  if (!profileUrl || !isValidLinkedInUrl(profileUrl)) {
    throw new Error(`Cannot create profile: invalid profileUrl (${profileUrl})`);
  }

  // Calculate experience years manually
  let experienceYears: number | undefined;
  if (cleanedProfile.experience && Array.isArray(cleanedProfile.experience)) {
    experienceYears = calculateExperienceYears(cleanedProfile.experience);
  }

  // Build minimal valid profile
  const fallbackProfile: any = {
    fullName,
    profileUrl,
  };

  // Add optional fields only if they exist and are valid
  if (cleanedProfile.headline && typeof cleanedProfile.headline === 'string') {
    fallbackProfile.headline = cleanedProfile.headline;
  }

  if (cleanedProfile.location && typeof cleanedProfile.location === 'string') {
    fallbackProfile.location = cleanedProfile.location;
  }

  if (cleanedProfile.photoUrl && isValidUrl(cleanedProfile.photoUrl)) {
    fallbackProfile.photoUrl = cleanedProfile.photoUrl;
  } else if (cleanedProfile.photo && isValidUrl(cleanedProfile.photo)) {
    fallbackProfile.photoUrl = cleanedProfile.photo;
  }

  if (cleanedProfile.currentPosition && typeof cleanedProfile.currentPosition === 'string') {
    fallbackProfile.currentPosition = cleanedProfile.currentPosition;
  } else if (cleanedProfile.experience?.[0]?.title) {
    fallbackProfile.currentPosition = cleanedProfile.experience[0].title;
  }

  if (cleanedProfile.currentCompany && typeof cleanedProfile.currentCompany === 'string') {
    fallbackProfile.currentCompany = cleanedProfile.currentCompany;
  } else if (cleanedProfile.experience?.[0]?.company) {
    fallbackProfile.currentCompany = cleanedProfile.experience[0].company;
  }

  if (experienceYears !== undefined && experienceYears > 0) {
    fallbackProfile.experienceYears = experienceYears;
  }

  // Skills - extract and limit to 10
  if (cleanedProfile.skills && Array.isArray(cleanedProfile.skills)) {
    const skills = cleanedProfile.skills
      .filter((s: any) => typeof s === 'string')
      .slice(0, 10);
    if (skills.length > 0) {
      fallbackProfile.skills = skills;
    }
  }

  // Experience - normalize structure
  if (cleanedProfile.experience && Array.isArray(cleanedProfile.experience)) {
    const experience = cleanedProfile.experience
      .filter((exp: any) => exp.title && exp.company)
      .map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        duration: exp.duration || exp.period || 'Unknown',
        ...(exp.description && { description: exp.description })
      }));
    if (experience.length > 0) {
      fallbackProfile.experience = experience;
    }
  }

  // Education - normalize structure
  if (cleanedProfile.education && Array.isArray(cleanedProfile.education)) {
    const education = cleanedProfile.education
      .filter((edu: any) => edu.degree && edu.school)
      .map((edu: any) => ({
        degree: edu.degree,
        school: edu.school,
        ...(edu.year && { year: edu.year })
      }));
    if (education.length > 0) {
      fallbackProfile.education = education;
    }
  }

  // Contact info
  if (cleanedProfile.email && cleanedProfile.email !== 'not available' && isValidEmail(cleanedProfile.email)) {
    fallbackProfile.email = cleanedProfile.email;
  }

  if (cleanedProfile.phone && typeof cleanedProfile.phone === 'string') {
    fallbackProfile.phone = cleanedProfile.phone;
  } else if (cleanedProfile.mobileNumber) {
    fallbackProfile.phone = cleanedProfile.mobileNumber;
  } else if (cleanedProfile.phoneNumbers?.[0]) {
    fallbackProfile.phone = cleanedProfile.phoneNumbers[0];
  }

  console.log(`✓ Manual fallback: ${fullName}`);
  return fallbackProfile;
}

/**
 * Calculate total years of experience from experience array
 */
function calculateExperienceYears(experience: any[]): number {
  let totalYears = 0;

  for (const exp of experience) {
    const duration = exp.duration || exp.period || '';
    
    // Parse various duration formats
    // "2020 - Present" or "2020 - 2023"
    const yearRangeMatch = duration.match(/(\d{4})\s*-\s*(?:Present|(\d{4}))/i);
    if (yearRangeMatch) {
      const startYear = parseInt(yearRangeMatch[1]);
      const endYear = yearRangeMatch[2] ? parseInt(yearRangeMatch[2]) : new Date().getFullYear();
      totalYears += (endYear - startYear);
      continue;
    }
    
    // "2 yrs 3 mos"
    const yearMatch = duration.match(/(\d+)\s*yr/i);
    const monthMatch = duration.match(/(\d+)\s*mo/i);
    
    if (yearMatch) {
      totalYears += parseInt(yearMatch[1]);
    }
    if (monthMatch) {
      totalYears += parseInt(monthMatch[1]) / 12;
    }
  }

  return Math.round(totalYears);
}

/**
 * Validate LinkedIn URL format
 */
function isValidLinkedInUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('linkedin.com') && parsed.pathname.includes('/in/');
  } catch {
    return false;
  }
}

/**
 * Validate any URL format
 */
function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Batch parse multiple profiles with progress tracking
 */
export async function batchParseProfiles(
  cleanedProfiles: any[],
  batchSize: number = 5
): Promise<any[]> {
  const results: any[] = [];
  const stats = {
    aiSuccess: 0,
    aiFixed: 0,
    fallback: 0,
    failed: 0
  };

  for (let i = 0; i < cleanedProfiles.length; i += batchSize) {
    const batch = cleanedProfiles.slice(i, i + batchSize);
    
    console.log(`🤖 Parsing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cleanedProfiles.length / batchSize)}`);

    const parsed = await Promise.allSettled(
      batch.map((profile) => parseProfileWithAI(profile))
    );

    // Track results
    parsed.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        // Simple heuristic: check if it came from AI or fallback
        // (AI results have more fields typically)
        if (result.value.experience && result.value.experience.length > 0) {
          stats.aiSuccess++;
        } else {
          stats.fallback++;
        }
      } else {
        stats.failed++;
        console.error(`❌ Failed to parse profile ${i + idx}: ${result.reason}`);
      }
    });

    // Small delay between batches
    if (i + batchSize < cleanedProfiles.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Log stats
  const total = results.length;
  console.log(`\n📊 Parsing Stats:`);
  console.log(`   Total: ${total}`);
  console.log(`   AI Success: ${stats.aiSuccess} (${((stats.aiSuccess/total)*100).toFixed(1)}%)`);
  console.log(`   Fallback: ${stats.fallback} (${((stats.fallback/total)*100).toFixed(1)}%)`);
  if (stats.failed > 0) {
    console.log(`   Failed: ${stats.failed}`);
  }

  return results;
}