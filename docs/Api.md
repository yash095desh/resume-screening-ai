# API Documentation

## Jobs Endpoints

### Create Job
```
POST /api/jobs
```
Creates a new job posting

**Body:**
```json
{
  "title": "Frontend Developer",
  "description": "Job description here..."
}
```

---

### Get All Jobs
```
GET /api/jobs
```
Returns all jobs created by logged-in user

---

### Get Single Job
```
GET /api/jobs/[jobId]
```
Returns job details with all candidates

---

### Update Job
```
PATCH /api/jobs/[jobId]
```
Update job title or description

---

### Delete Job
```
DELETE /api/jobs/[jobId]
```
Deletes job and all associated candidates

---

## Resume Processing

### Upload Resumes
```
POST /api/upload/resumes
```
Upload multiple resume files

**Body:** FormData with files

**Returns:** Array of uploaded file URLs

---

### Process Candidates
```
POST /api/jobs/[jobId]/process
```
Starts AI processing for all uploaded resumes

**Body:**
```json
{
  "resumeUrls": ["url1", "url2", "url3"]
}
```

**What it does:**
1. Downloads each resume from Supabase
2. Parses PDF using Unstructured API
3. Extracts data using AI
4. Matches against JD
5. Calculates scores
6. Saves results to database

---

## Candidates

### Get Candidate Details
```
GET /api/candidates/[candidateId]
```
Returns full candidate profile with analysis

**Returns:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "score": 85,
  "matchedSkills": ["React", "TypeScript"],
  "missingSkills": ["AWS"],
  "experience": "3 years in frontend development",
  "verdict": "Good Fit",
  "summary": "Experienced developer with..."
}
```

---

Generates downloadable file with all candidate data

---

## Authentication

All endpoints require authentication via Clerk. User must be logged in.

---

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error message here"
}
```

Common status codes:
- `200` - Success
- `400` - Bad request (missing data)
- `401` - Not authenticated
- `404` - Not found
- `500` - Server error