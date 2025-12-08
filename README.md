# Resume Screening System

AI-powered platform to rank and analyze candidates against job descriptions.

## What It Does

- Upload job description
- Upload multiple resumes (PDF/DOCX)
- AI automatically extracts and analyzes candidate data
- Get ranked list with match scores
- See matched and missing skills for each candidate
- Export results to CSV/PDF

## Tech Used

- **Next.js 14** - Frontend & Backend
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Prisma + PostgreSQL** - Database
- **Clerk** - Authentication
- **Supabase** - File storage
- **OpenRouter** - AI (LLM)
- **Unstructured API** - PDF parsing

## Setup

1. **Clone the repo**
```bash
git clone [your-repo-url]
cd [project-name]
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env.local` file:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key

# Database
DATABASE_URL=your_neon_database_url

# OpenRouter
OPENROUTER_API_KEY=your_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# Unstructured
UNSTRUCTURED_API_KEY=your_key
UNSTRUCTURED_API_URL=https://api.unstructuredapp.io/general/v0/general
```

4. **Setup database**
```bash
npx prisma generate
npx prisma db push
```

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How to Use

1. Sign up / Log in
2. Click "New Job"
3. Enter job title and paste JD
4. Upload resumes (can upload multiple at once)
5. Click "Process Candidates"
6. Wait for AI to analyze (takes 1-2 mins for ~10 resumes)
7. View ranked candidates
8. Click on any candidate for detailed analysis
9. Export results

## Features Completed

✅ Bulk resume upload
✅ JD analysis and requirement extraction
✅ AI-powered resume parsing
✅ Skill matching (matched & missing)
✅ Scoring system (0-100)
✅ Fit verdict (Good/Moderate/Low)
✅ Candidate ranking
✅ Detailed candidate view
✅ Export to CSV/PDF
✅ Clean dashboard UI
✅ Authentication

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── (dashboard)/      # Main app pages
│   └── (auth)/           # Login/signup pages
├── components/           # React components
├── lib/                  # Utilities
├── prisma/              # Database schema
└── public/              # Static files
```

## Deployment

Deployed on Vercel: [https://resume-screening-ai-git-main-yash095deshs-projects.vercel.app]

## Known Issues & Solutions

**PDF Parsing:**
- Initially tried client-side parsing - didn't work well
- Switched to Unstructured API - works reliably

**Processing Speed:**
- Processes ~10 resumes in 1-2 minutes
- Could be faster with paid AI tier

## Future Improvements

- Add filters (experience, skills, location)
- Email integration for candidates
- Interview scheduling
- Behavior prediction
- Resume templates validation

## Links

- **Live App:** [https://resume-screening-ai-git-main-yash095deshs-projects.vercel.app/]
- **Demo Video:** [https://www.loom.com/share/496b4917c646424c8eaef48846895ac1]
- **Documentation:** See `ARCHITECTURE.md` and `API.md` inside docs 