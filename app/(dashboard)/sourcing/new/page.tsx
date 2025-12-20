"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles,
  FileText,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info,
  Briefcase,
  MapPin,
  GraduationCap,
  Building2,
  Star,
  Clock
} from "lucide-react";
import Link from "next/link";

export default function NewSourcingJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    jobDescription: "",
    maxCandidates: 50,
    jobRequirements: {
      requiredSkills: "",
      niceToHave: "",
      yearsOfExperience: "",
      location: "",
      industry: "",
      educationLevel: "",
      companyType: "",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/sourcing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create sourcing job");
      }

      // Redirect to job page
      router.push(`/sourcing/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const isValid = 
    formData.title.length >= 3 && 
    formData.jobRequirements.requiredSkills.length >= 3 &&
    formData.jobDescription.length >= 50;
  
  const charCount = formData.jobDescription.length;
  const charCountColor = charCount < 50 ? "text-red-600" : charCount > 4500 ? "text-yellow-600" : "text-gray-500";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/sourcing">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </Link>
      </div>

      {/* Main Form Card */}
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-linear-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-purple-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Create New Sourcing Job</CardTitle>
              <CardDescription className="mt-1">
                AI will automatically find and score matching candidates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Job Title
                <Badge variant="secondary" className="ml-auto">Required</Badge>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Senior Full Stack Developer"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                minLength={3}
                maxLength={200}
                className="text-base"
              />
              <p className="text-xs text-gray-500">
                The exact position title you&apos;re hiring for
              </p>
            </div>

            <Separator />

            {/* Required Skills */}
            <div className="space-y-2">
              <Label htmlFor="requiredSkills" className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Required Skills
                <Badge variant="secondary" className="ml-auto">Required</Badge>
              </Label>
              <Textarea
                id="requiredSkills"
                placeholder="Enter required skills, separated by commas or line breaks...

Examples:
- React, Node.js, TypeScript, PostgreSQL
- Python, AWS, Docker, Kubernetes
- Java, Spring Boot, Microservices, REST APIs"
                value={formData.jobRequirements.requiredSkills}
                onChange={(e) =>
                  setFormData({ 
                    ...formData, 
                    jobRequirements: { 
                      ...formData.jobRequirements, 
                      requiredSkills: e.target.value 
                    }
                  })
                }
                required
                minLength={3}
                maxLength={1000}
                rows={4}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                List technical skills, frameworks, and tools that are must-haves
              </p>
            </div>

            <Separator />

            {/* Nice-to-Have Skills */}
            <div className="space-y-2">
              <Label htmlFor="niceToHave" className="text-base font-semibold flex items-center gap-2">
                <Star className="w-4 h-4" />
                Nice-to-Have Skills
                <Badge variant="outline" className="ml-auto">Optional</Badge>
              </Label>
              <Textarea
                id="niceToHave"
                placeholder="Enter preferred but not required skills...

Examples:
- GraphQL, Redis, MongoDB
- CI/CD, Terraform, Jenkins
- Machine Learning, Data Science"
                value={formData.jobRequirements.niceToHave}
                onChange={(e) =>
                  setFormData({ 
                    ...formData, 
                    jobRequirements: { 
                      ...formData.jobRequirements, 
                      niceToHave: e.target.value 
                    }
                  })
                }
                maxLength={1000}
                rows={3}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                Additional skills that would be a plus but aren&apos;t mandatory
              </p>
            </div>

            <Separator />

            {/* Years of Experience */}
            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience" className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Years of Experience
                <Badge variant="outline" className="ml-auto">Optional</Badge>
              </Label>
              <Select
                value={formData.jobRequirements.yearsOfExperience}
                onValueChange={(value) =>
                  setFormData({ 
                    ...formData, 
                    jobRequirements: { 
                      ...formData.jobRequirements, 
                      yearsOfExperience: value 
                    }
                  })
                }
              >
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Select experience level..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-2">0-2 years (Entry Level)</SelectItem>
                  <SelectItem value="2-4">2-4 years (Junior)</SelectItem>
                  <SelectItem value="3-5">3-5 years (Mid-Level)</SelectItem>
                  <SelectItem value="5-8">5-8 years (Senior)</SelectItem>
                  <SelectItem value="8-12">8-12 years (Lead/Principal)</SelectItem>
                  <SelectItem value="12+">12+ years (Executive/Architect)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Minimum years of professional experience required
              </p>
            </div>

            <Separator />

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
                <Badge variant="outline" className="ml-auto">Optional</Badge>
              </Label>
              <Input
                id="location"
                placeholder="e.g., New York, San Francisco, London, Remote, United States"
                value={formData.jobRequirements.location}
                onChange={(e) =>
                  setFormData({ 
                    ...formData, 
                    jobRequirements: { 
                      ...formData.jobRequirements, 
                      location: e.target.value 
                    }
                  })
                }
                maxLength={200}
                className="text-base"
              />
              <p className="text-xs text-gray-500">
                Preferred location(s) or specify &quot;Remote&quot; for remote positions
              </p>
            </div>

            <Separator />

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-base font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Industry
                <Badge variant="outline" className="ml-auto">Optional</Badge>
              </Label>
              <Select
                value={formData.jobRequirements.industry}
                onValueChange={(value) =>
                  setFormData({ 
                    ...formData, 
                    jobRequirements: { 
                      ...formData.jobRequirements, 
                      industry: value 
                    }
                  })
                }
              >
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Select target industry..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Software Development">Software Development</SelectItem>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="FinTech">FinTech</SelectItem>
                  <SelectItem value="E-commerce">E-commerce</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Education">Education (EdTech)</SelectItem>
                  <SelectItem value="Finance">Financial Services</SelectItem>
                  <SelectItem value="Consulting">IT Consulting</SelectItem>
                  <SelectItem value="Cloud">Cloud Computing</SelectItem>
                  <SelectItem value="AI/ML">AI/Machine Learning</SelectItem>
                  <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                  <SelectItem value="Gaming">Gaming</SelectItem>
                  <SelectItem value="Marketing">Digital Marketing</SelectItem>
                  <SelectItem value="Any">Any Industry</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Preferred industry background for candidates
              </p>
            </div>

            <Separator />

            {/* Education Level */}
            <div className="space-y-2">
              <Label htmlFor="educationLevel" className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Education Level
                <Badge variant="outline" className="ml-auto">Optional</Badge>
              </Label>
              <Select
                value={formData.jobRequirements.educationLevel}
                onValueChange={(value) =>
                  setFormData({ 
                    ...formData, 
                    jobRequirements: { 
                      ...formData.jobRequirements, 
                      educationLevel: value 
                    }
                  })
                }
              >
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Select minimum education..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High School">High School Diploma</SelectItem>
                  <SelectItem value="Associate">Associate Degree</SelectItem>
                  <SelectItem value="Bachelor">Bachelor&apos;s Degree</SelectItem>
                  <SelectItem value="Master">Master&apos;s Degree</SelectItem>
                  <SelectItem value="PhD">PhD/Doctorate</SelectItem>
                  <SelectItem value="Not Required">Not Required</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Minimum educational qualification required
              </p>
            </div>

            <Separator />

            {/* Company Type */}
            <div className="space-y-2">
              <Label htmlFor="companyType" className="text-base font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Preferred Company Type
                <Badge variant="outline" className="ml-auto">Optional</Badge>
              </Label>
              <Select
                value={formData.jobRequirements.companyType}
                onValueChange={(value) =>
                  setFormData({ 
                    ...formData, 
                    jobRequirements: { 
                      ...formData.jobRequirements, 
                      companyType: value 
                    }
                  })
                }
              >
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Select company type preference..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Startup">Startup (Seed to Series A)</SelectItem>
                  <SelectItem value="Growth">Growth Stage (Series B-D)</SelectItem>
                  <SelectItem value="Enterprise">Enterprise/Large Corp</SelectItem>
                  <SelectItem value="Tech Giants">Tech Giants (FAANG, etc.)</SelectItem>
                  <SelectItem value="Agency">Agency/Consulting</SelectItem>
                  <SelectItem value="Product">Product Companies</SelectItem>
                  <SelectItem value="Any">Any Company Type</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Type of companies you prefer candidates to have worked at
              </p>
            </div>

            <Separator />

            {/* Job Description */}
            <div className="space-y-2">
              <Label htmlFor="jobDescription" className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Job Description
                <Badge variant="secondary" className="ml-auto">Required</Badge>
              </Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste your full job description here...

Include:
- Detailed responsibilities and day-to-day tasks
- Team structure and who they'll work with
- Projects they'll be working on
- Company culture and values
- Growth opportunities
- Any other relevant information

The more detailed your description, the better the AI can match candidates!"
                value={formData.jobDescription}
                onChange={(e) =>
                  setFormData({ ...formData, jobDescription: e.target.value })
                }
                required
                minLength={50}
                maxLength={5000}
                rows={12}
                className="font-mono text-sm resize-none"
              />
              <div className="flex items-center justify-between">
                <p className={`text-xs font-medium ${charCountColor}`}>
                  {charCount}/5000 characters
                  {charCount < 50 && ` (minimum 50 required)`}
                </p>
                {charCount >= 50 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Valid
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Max Candidates */}
            <div className="space-y-2">
              <Label htmlFor="maxCandidates" className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Maximum Candidates to Source
              </Label>
              <Select
                value={formData.maxCandidates.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, maxCandidates: parseInt(value) })
                }
              >
                <SelectTrigger className="text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">
                    <div className="flex items-center gap-2">
                      <span>10 candidates</span>
                      <Badge variant="secondary" className="text-xs">~2 min</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="25">
                    <div className="flex items-center gap-2">
                      <span>25 candidates</span>
                      <Badge variant="secondary" className="text-xs">~4 min</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="50">
                    <div className="flex items-center gap-2">
                      <span>50 candidates</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">Recommended</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="75">
                    <div className="flex items-center gap-2">
                      <span>75 candidates</span>
                      <Badge variant="secondary" className="text-xs">~8 min</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="100">
                    <div className="flex items-center gap-2">
                      <span>100 candidates</span>
                      <Badge variant="secondary" className="text-xs">~12 min</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                More candidates = better selection, but takes longer to process
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Link href="/sourcing" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Job...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start AI Sourcing
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-900">
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">1</span>
              </div>
              <p>AI analyzes your job requirements and creates optimized candidate search filters</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">2</span>
              </div>
              <p>Automatically searches professional networks using skills, experience, location, and industry filters</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">3</span>
              </div>
              <p>Extracts full profile details including work history, education, skills, and contact info</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">4</span>
              </div>
              <p>AI scores each candidate (0-100) based on skills, experience, industry, and seniority match</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">5</span>
              </div>
              <p>Results appear in real-time with detailed reasoning for each score</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              AI Scoring Criteria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-green-900">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Required Skills Match</span>
                <Badge variant="secondary" className="bg-green-200 text-green-800">30 pts</Badge>
              </div>
              <p className="text-xs text-green-700">Percentage of required skills they possess</p>
            </div>
            <Separator className="bg-green-200" />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Experience Level</span>
                <Badge variant="secondary" className="bg-green-200 text-green-800">25 pts</Badge>
              </div>
              <p className="text-xs text-green-700">Years of experience match with requirements</p>
            </div>
            <Separator className="bg-green-200" />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Industry Relevance</span>
                <Badge variant="secondary" className="bg-green-200 text-green-800">20 pts</Badge>
              </div>
              <p className="text-xs text-green-700">Background in same or related industry</p>
            </div>
            <Separator className="bg-green-200" />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Title/Seniority Match</span>
                <Badge variant="secondary" className="bg-green-200 text-green-800">15 pts</Badge>
              </div>
              <p className="text-xs text-green-700">Current role matches target seniority level</p>
            </div>
            <Separator className="bg-green-200" />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Nice-to-Have Skills</span>
                <Badge variant="secondary" className="bg-green-200 text-green-800">10 pts</Badge>
              </div>
              <p className="text-xs text-green-700">Bonus points for additional desired skills</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Pro Tips for Best Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-purple-900">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span><strong>Be specific with skills:</strong> Use exact technology names (e.g., &quot;React 18&quot; instead of just &quot;frontend&quot;)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span><strong>Separate required from nice-to-have:</strong> This helps AI prioritize candidates correctly</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span><strong>Include experience context:</strong> Mention if you need specific domain experience</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span><strong>Use full location names:</strong> &quot;United Kingdom&quot; works better than &quot;UK&quot;</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span><strong>Mention company preferences:</strong> If you want candidates from startups or Fortune 500 companies</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span><strong>Detail the job description:</strong> More context = better AI matching and scoring</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}