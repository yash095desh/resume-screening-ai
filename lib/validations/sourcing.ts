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

// ============================================
// ENHANCED: Candidate Score Schema
// ============================================

export const candidateScoreSchema = z.object({
  // Existing fields
  skillsScore: z.number().min(0).max(30),
  experienceScore: z.number().min(0).max(25),
  industryScore: z.number().min(0).max(20),
  titleScore: z.number().min(0).max(15),
  niceToHaveScore: z.number().min(0).max(10),
  totalScore: z.number().min(0).max(100),
  reasoning: z.string(),
  
  // Existing skill matching
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  bonusSkills: z.array(z.string()),
  
  // Existing experience analysis
  relevantYears: z.number().nullable(),
  seniorityLevel: z.enum(["Entry", "Mid", "Senior", "Lead", "Executive"]),
  industryMatch: z.string().nullable(),
  
  // ============================================
  // 🆕 NEW: Interview Readiness
  // ============================================
  interviewReadiness: z.enum([
    "READY_TO_INTERVIEW",
    "INTERVIEW_WITH_VALIDATION",
    "NOT_RECOMMENDED"
  ]),
  interviewReadinessReason: z.string(),
  interviewConfidenceScore: z.number().min(0).max(100),
  candidateSummary: z.string(),
  keyStrengths: z.array(z.string()).max(3),
  
  // ============================================
  // 🆕 NEW: Enhanced Skill Analysis
  // ============================================
  skillsProficiency: z.number().min(1).max(5),
  criticalGaps: z.array(z.string()),
  skillGapImpact: z.enum(["High", "Medium", "Low"]),
  skillsAnalysisSummary: z.string(),
  
  // ============================================
  // 🆕 NEW: Enhanced Experience Analysis
  // ============================================
  experienceRelevanceScore: z.number().min(0).max(100),
  seniorityAlignment: z.enum(["Perfect", "Higher", "Lower", "Unclear"]),
  industryAlignment: z.enum(["Exact", "Adjacent", "Different"]),
  experienceHighlights: z.array(z.object({
    title: z.string(),
    company: z.string(),
    relevance: z.enum(["High", "Medium", "Low"]),
    reason: z.string()
  })).max(3),
  experienceAnalysisSummary: z.string(),
  
  // ============================================
  // 🆕 NEW: Gaps & Trade-offs
  // ============================================
  hasSignificantGaps: z.boolean(),
  gapsAndTradeoffs: z.object({
    criticalGaps: z.array(z.object({
      type: z.enum(["skill", "experience", "seniority", "industry"]),
      gap: z.string(),
      impact: z.enum(["High", "Medium", "Low"]),
      mitigation: z.string().optional()
    })),
    acceptableTradeoffs: z.array(z.object({
      tradeoff: z.string(),
      reasoning: z.string()
    })),
    dealBreakers: z.array(z.string())
  }),
  gapsOverallImpact: z.enum(["Manageable", "Significant", "Critical"]),
  gapsSummary: z.string(),
  
  // ============================================
  // 🆕 NEW: Interview Focus Areas
  // ============================================
  interviewFocusAreas: z.array(z.object({
    category: z.string(),
    question: z.string(),
    reasoning: z.string()
  })).min(2).max(5),
  suggestedQuestions: z.array(z.string()).max(8),
  redFlags: z.array(z.string()),
  interviewFocusSummary: z.string()
});

export type CandidateScore = z.infer<typeof candidateScoreSchema>;