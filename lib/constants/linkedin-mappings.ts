// lib/constants/linkedin-mappings.ts

export const INDUSTRY_TO_LINKEDIN_ID: Record<string, number[] | undefined> = {
  "Software Development": [4],
  "SaaS": [4, 6],
  "FinTech": [43, 4],
  "E-commerce": [6],
  "Healthcare": [14],
  "Education": [69],  // Education Management
  "Finance": [43],    // Financial Services
  "Consulting": [11], // Management Consulting
  "Cloud": [96, 4],   // IT Services + Software
  "AI/ML": [4, 6],
  "Cybersecurity": [96, 122], // IT Services + Security
  "Gaming": [4, 6],
  "Marketing": [80],  // Marketing and Advertising
  "Any": undefined,   // Don't filter by industry
};

export const EXPERIENCE_LEVEL_MAPPING: Record<string, string[]> = {
  "internship": ["internship"],
  "entry": ["entry"],
  "associate": ["associate"],
  "mid-senior": ["mid-senior"],
  "director": ["director"],
  "executive": ["executive"],
  
  // Handle old format if any exists (backward compatibility)
  "0-2": ["internship", "entry"],
  "2-4": ["entry", "associate"],
  "3-5": ["associate"],
  "5-8": ["mid-senior"],
  "8-12": ["mid-senior", "director"],
  "12+": ["director", "executive"],
};