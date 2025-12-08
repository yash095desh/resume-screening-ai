# Architecture Document

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui

**Backend:**
- Next.js API Routes
- Prisma ORM
- Neon PostgreSQL

**AI & Processing:**
- Vercel AI SDK
- OpenRouter API (using free LLM models)
- Unstructured API (for PDF parsing)

**Storage & Auth:**
- Supabase (file storage)
- Clerk (authentication)

**Deployment:**
- Vercel

---

## How It Works

### 1. Job Description Processing
- User uploads or pastes JD
- AI extracts required skills, experience, and qualifications
- Stored in database for matching

### 2. Resume Upload & Storage
- User uploads multiple resumes (PDF/DOCX)
- Files stored in Supabase Storage
- Resume URLs saved in database

### 3. Resume Parsing
- Unstructured API extracts text from PDFs
- Handles different resume formats
- Returns clean text for AI processing

### 4. AI Analysis
- LLM extracts structured data from each resume:
  - Name, email, phone
  - Skills (technical & soft)
  - Work experience
  - Education
- Generates candidate summary

### 5. Matching & Scoring
- Compare candidate skills with JD requirements
- Calculate match percentage (0-100)
- Identify matched skills
- Identify missing skills
- Assign fit verdict (Good/Moderate/Low Fit)

### 6. Display Results
- Show ranked candidate list
- Sortable by score
- View detailed analysis for each candidate
- Export to CSV/PDF

---

## Database Schema

**Users Table:**
- Clerk user data

**Jobs Table:**
- Job title, description
- Extracted requirements
- Created by user

**Candidates Table:**
- Name, email, contact
- Resume file URL
- Extracted skills
- Experience details
- Match score
- Matched/missing skills
- Fit verdict
- Linked to job

---

## Key Features Implemented

1. **Bulk Upload:** Handle multiple resumes at once
2. **AI Parsing:** Automatic data extraction from resumes
3. **Smart Matching:** AI compares candidates with JD
4. **Scoring System:** 0-100 match score
5. **Skill Analysis:** Shows what matches and what's missing
6. **Export:** Download results as CSV or PDF
7. **Clean UI:** Simple dashboard to manage everything

---

## Challenges Solved

**PDF Parsing on Vercel:**
- Issue: Direct PDF parsing libraries didn't work well on serverless
- Solution: Used Unstructured API for reliable parsing
- Handles various resume formats consistently

**AI Response Consistency:**
- Issue: LLM responses can be unpredictable
- Solution: Structured prompts with JSON output format
- Validation and error handling for AI responses

**Batch Processing:**
- Issue: Processing many resumes takes time
- Solution: Process resumes in parallel where possible
- Show progress indicators to user

---

## Why This Approach?

**Next.js:** Full-stack in one framework, easy deployment on Vercel

**Serverless:** No server management, scales automatically

**OpenRouter:** Free tier for LLMs, cost-effective for assignment

**Supabase:** Simple file storage setup, free tier available

**Prisma:** Type-safe database queries, easy schema management

**Clerk:** Quick auth setup, handles all user management

This stack allows rapid development while keeping the app scalable and maintainable.