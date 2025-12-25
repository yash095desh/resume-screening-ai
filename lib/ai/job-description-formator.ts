// lib/ai/job-description-formator.ts

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";


const linkedInSearchSchema = z.object({
  searchQuery: z.string().optional().describe("Boolean search query combining top 2-3 skills with AND (e.g., 'React AND Node.js')"),
  currentJobTitles: z.array(z.string()).describe("Array of 3-5 exact job titles from the job description"),
  locations: z.array(z.string()).optional().describe("Array of location strings (e.g., 'San Francisco Bay Area', 'New York City Metropolitan Area')"),
  industryIds: z.array(z.number()).optional().describe("LinkedIn industry IDs: Software Development=4, Internet=6, IT Services=96, Financial Services=43, Healthcare=14, Consulting=11"),
});

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
  },
  maxCandidates: number = 20
) {
  try {
    console.log("🎨 Formatting job description for LinkedIn search...");

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: linkedInSearchSchema,
      system: `You are formatting job requirements for LinkedIn search via Apify harvestapi/linkedin-profile-search actor.

CRITICAL INSTRUCTIONS:

1. searchQuery: 
   - Extract ONLY the top 2-3 most critical technical skills from requiredSkills
   - Join with " AND " (e.g., "React AND Node.js AND TypeScript")
   - Keep it concise - more filters = fewer results
   - If no technical skills, use the job category (e.g., "Software Engineer")

2. currentJobTitles:
   - Extract 3-5 EXACT job titles that would appear on LinkedIn
   - Examples: "Senior Software Engineer", "Full Stack Developer", "Engineering Manager"
   - Avoid generic titles like "Engineer" or "Developer" alone
   - Include variations (e.g., both "Senior Engineer" and "Staff Engineer")

3. locations:
   - Convert to LinkedIn's standard format:
     * "San Francisco" → "San Francisco Bay Area"
     * "NYC" or "New York" → "New York City Metropolitan Area"  
     * "Los Angeles" → "Greater Los Angeles Area"
     * "Seattle" → "Greater Seattle Area"
     * "Boston" → "Greater Boston"
   - If multiple cities mentioned, include all

4. industryIds (use LinkedIn's IDs):
   - Software/SaaS/Tech/Startup → [4]
   - Internet/E-commerce → [6]
   - IT Services/Consulting → [96]
   - FinTech/Banking/Finance → [43]
   - Healthcare/Biotech → [14]
   - Management Consulting → [11]
   - If unclear, use [4, 6] for tech roles

IMPORTANT: Don't over-filter! We score candidates later. Cast a wide net in search.`,
      
      prompt: `Job Description:
${jobDescription}

Job Requirements:
- Required Skills: ${jobRequirements?.requiredSkills || 'Not specified'}
- Nice to Have: ${jobRequirements?.niceToHave || 'Not specified'}
- Location: ${jobRequirements?.location || 'Not specified'}
- Industry: ${jobRequirements?.industry || 'Not specified'}
- Years of Experience: ${jobRequirements?.yearsOfExperience || 'Not specified'}
- Education: ${jobRequirements?.educationLevel || 'Not specified'}

Generate LinkedIn search filters that will find relevant candidates.`,
    });

    console.log("✅ AI generated filters:", JSON.stringify(object, null, 2));

    // Build search input for your Apify actor
    const searchInput = {
      searchQuery: object.searchQuery,
      currentJobTitles: object.currentJobTitles,
      locations: object.locations,
      industryIds: object.industryIds,
      maxItems: maxCandidates,
      takePages: Math.ceil(maxCandidates / 25), // 25 results per page
      
      // Store metadata for multi-strategy search and post-filtering
      _meta: {
        requiredSkills: jobRequirements?.requiredSkills?.split(/[,;]/).map(s => s.trim()).filter(Boolean) || [],
        niceToHaveSkills: jobRequirements?.niceToHave?.split(/[,;]/).map(s => s.trim()).filter(Boolean) || [],
        yearsOfExperience: jobRequirements?.yearsOfExperience,
        educationLevel: jobRequirements?.educationLevel,
        rawJobDescription: jobDescription,
      }
    };

    console.log("📋 Final search input:", JSON.stringify(searchInput, null, 2));
    
    return searchInput;
    
  } catch (error) {
    console.error("❌ Failed to format job description:", error);
    
    // Fallback: Create basic search from skills
    const skills = jobRequirements?.requiredSkills?.split(/[,;]/).map(s => s.trim()).filter(Boolean) || [];
    const searchQuery = skills.slice(0, 3).join(" AND ");
    
    console.log("⚠️ Using fallback search query:", searchQuery);
    
    return {
      searchQuery: searchQuery || undefined,
      maxItems: maxCandidates,
      takePages: Math.ceil(maxCandidates / 25),
      _meta: {
        requiredSkills: skills,
        niceToHaveSkills: [],
        rawJobDescription: jobDescription,
      }
    };
  }
}