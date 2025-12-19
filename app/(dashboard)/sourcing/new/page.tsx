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
//   Search,
  FileText,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info
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

  const isValid = formData.title.length >= 3 && formData.jobDescription.length >= 50;
  const charCount = formData.jobDescription.length;
  const charCountColor = charCount < 50 ? "text-red-600" : charCount > 4500 ? "text-yellow-600" : "text-gray-500";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
                AI will automatically find and score matching LinkedIn candidates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
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
                This will be used to identify your sourcing job
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
- Required skills and technologies
- Years of experience needed
- Responsibilities and requirements
- Preferred qualifications
- Company culture fit
- Location preferences (if any)

The more detailed your description, the better the AI can match candidates!"
                value={formData.jobDescription}
                onChange={(e) =>
                  setFormData({ ...formData, jobDescription: e.target.value })
                }
                required
                minLength={50}
                maxLength={5000}
                rows={16}
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
                    Start Sourcing
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
              <p>AI analyzes your job description to create LinkedIn search filters</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">2</span>
              </div>
              <p>We search LinkedIn for profiles matching your criteria</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">3</span>
              </div>
              <p>Profile details are extracted including experience, skills, and contact info</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">4</span>
              </div>
              <p>AI scores each candidate (0-100) with detailed reasoning</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">5</span>
              </div>
              <p>Results appear in real-time as they&apos;re processed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Scoring Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-green-900">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Skills Match</span>
                <Badge variant="secondary" className="bg-green-200 text-green-800">25 pts</Badge>
              </div>
              <p className="text-xs text-green-700">How many required skills they have</p>
            </div>
            <Separator className="bg-green-200" />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Experience Level</span>
                <Badge variant="secondary" className="bg-green-200 text-green-800">25 pts</Badge>
              </div>
              <p className="text-xs text-green-700">Years of experience match</p>
            </div>
            <Separator className="bg-green-200" />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Industry Relevance</span>
                <Badge variant="secondary" className="bg-green-200 text-green-800">25 pts</Badge>
              </div>
              <p className="text-xs text-green-700">Same or related industry background</p>
            </div>
            <Separator className="bg-green-200" />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Title/Seniority Fit</span>
                <Badge variant="secondary" className="bg-green-200 text-green-800">25 pts</Badge>
              </div>
              <p className="text-xs text-green-700">Current role matches target level</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Tips for Best Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-purple-900">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span><strong>Be specific</strong> about required skills and technologies</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span><strong>Include experience level</strong> (e.g., &quot;5+ years&quot;, &quot;senior level&quot;)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span><strong>Mention preferred companies</strong> or industries for better targeting</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span><strong>Add location preferences</strong> if you have any (remote/specific cities)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span><strong>List &quot;nice to have&quot; skills</strong> separately from required ones</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}