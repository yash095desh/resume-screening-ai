import { z } from "zod";

export const createSourcingJobSchema = z.object({
  title: z.string().min(3).max(200),
  jobDescription: z.string().min(50).max(5000),
  maxCandidates: z.number().int().min(10).max(100).default(50),
});

export const linkedInSearchFiltersSchema = z.object({
  keywords: z.array(z.string()).min(1),
  titles: z.array(z.string()).min(1),
  experienceYears: z.string().optional(),
  location: z.string().optional(),
  companies: z.array(z.string()).optional(),
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
  skillsScore: z.number().min(0).max(25),
  experienceScore: z.number().min(0).max(25),
  industryScore: z.number().min(0).max(25),
  titleScore: z.number().min(0).max(25),
  totalScore: z.number().min(0).max(100),
  reasoning: z.string().min(20).max(500),
});

export type CandidateScore = z.infer<typeof candidateScoreSchema>;