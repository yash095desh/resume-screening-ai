import { z } from "zod";

export const createSourcingJobSchema = z.object({
  title: z.string().min(3).max(200),
  jobDescription: z.string().min(50).max(5000),
  maxCandidates: z.number().int().min(10).max(100).default(50),
  
  // All job requirements stored as a single object
  jobRequirements: z.object({
    requiredSkills: z.string().min(3).max(1000),
    niceToHave: z.string().max(1000).optional().default(""),
    yearsOfExperience: z.string().optional().default(""),
    location: z.string().max(200).optional().default(""),
    industry: z.string().optional().default(""),
    educationLevel: z.string().optional().default(""),
    companyType: z.string().optional().default(""),
  }),
});

export const linkedInSearchFiltersSchema = z.object({
  searchQuery: z.string().optional(),
  currentJobTitles: z.array(z.string()).optional(),
  pastJobTitles: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  currentCompanies: z.array(z.string()).optional(),
  industryIds: z.array(z.number()).optional(),
  totalYearsOfExperience: z.array(z.number()).optional(),
  maxItems: z.number().optional(),
  takePages: z.number().optional(),
});

export const structuredCandidateSchema = z.object({
  fullName: z.string(),
  headline: z.string().optional(),
  location: z.string().optional(),
  profileUrl: z.string().url(),
  photoUrl: z.string().url().optional(),
  currentPosition: z.string().optional(),
  currentCompany: z.string().optional(),
  experienceYears: z.number().int().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      duration: z.string(),
      description: z.string().optional(),
    })
  ).optional(),
  education: z.array(
    z.object({
      degree: z.string(),
      school: z.string(),
      year: z.string().optional(),
    })
  ).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

// === NEW: STRUCTURED SCORING RUBRIC ===

export const candidateScoreSchema = z.object({
  skillsScore: z.number().min(0).max(30).describe("Score for required skills match (0-30 points)"),
  experienceScore: z.number().min(0).max(25).describe("Score for experience level (0-25 points)"),
  industryScore: z.number().min(0).max(20).describe("Score for industry relevance (0-20 points)"),
  titleScore: z.number().min(0).max(15).describe("Score for title/seniority fit (0-15 points)"),
  niceToHaveScore: z.number().min(0).max(10).describe("Score for bonus nice-to-have skills (0-10 points)"),
  totalScore: z.number().min(0).max(100).describe("Total score (sum of all categories)"),
  reasoning: z.string().describe("Brief explanation of the scoring (2-3 sentences max)"),
  
  // === NEW: Skill Matching Details ===
  matchedSkills: z.array(z.string()).describe("Array of required skills the candidate has"),
  missingSkills: z.array(z.string()).describe("Array of required skills the candidate lacks"),
  bonusSkills: z.array(z.string()).describe("Array of nice-to-have skills the candidate has"),
  
  // === NEW: Experience Insights ===
  relevantYears: z.number().nullable().describe("Years of experience directly relevant to this role"),
  seniorityLevel: z.enum(["Entry", "Mid", "Senior", "Lead", "Executive"]).describe("Career level based on titles and experience"),
  industryMatch: z.string().nullable().describe("Specific industry from candidate's background (e.g., 'SaaS', 'FinTech', 'Healthcare')"),
});

export type CandidateScore = z.infer<typeof candidateScoreSchema>;