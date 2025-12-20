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
  skillsScore: z.number().min(0).max(30),
  experienceScore: z.number().min(0).max(25),
  industryScore: z.number().min(0).max(20),
  titleScore: z.number().min(0).max(15),
  niceToHaveScore: z.number().min(0).max(10),
  totalScore: z.number().min(0).max(100),
  reasoning: z.string(),
});

export type CandidateScore = z.infer<typeof candidateScoreSchema>;