"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  ExternalLink,
  AlertCircle,
  Copy,
  CheckCircle2,
  Calendar,
  Building2,
  TrendingUp,
  Target,
  Sparkles,
  Info,
} from "lucide-react";

interface Experience {
  title: string;
  company: string;
  duration: string;
  description?: string;
}

interface Education {
  degree: string;
  school: string;
  year?: string;
}

interface Candidate {
  id: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  profileUrl: string;
  photoUrl: string | null;
  currentPosition: string | null;
  currentCompany: string | null;
  experienceYears: number | null;
  skills: string[];
  experience: Experience[];
  education: Education[];
  email: string | null;
  phone: string | null;
  hasContactInfo: boolean;
  isDuplicate: boolean;
  matchScore: number;
  skillsScore: number;
  experienceScore: number;
  industryScore: number;
  titleScore: number;
  matchReason: string | null;
  scrapedAt: string;
}

export default function CandidateDetailPage() {
  const params = useParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const jobId = params.jobId as string;
  const candidateId = params.candidateId as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchCandidate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, candidateId]);

  const fetchCandidate = async () => {
    try {
      const response = await fetch(
        `/api/sourcing/${jobId}/candidates/${candidateId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch candidate");
      }

      setCandidate(data);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !candidate) {
    return (
      <div className="max-w-5xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Candidate not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/sourcing/${jobId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Candidates
          </Button>
        </Link>
      </div>

      {/* Profile Header Card */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage
                  src={candidate.photoUrl || undefined}
                  alt={candidate.fullName}
                />
                <AvatarFallback className="text-3xl bg-linear-to-br from-purple-500 to-blue-500 text-white">
                  {candidate.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>

                <a
                    href={candidate.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                >
                <Button variant="outline" className="w-full" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View LinkedIn Profile
                </Button>
              </a>
            </div>

            {/* Main Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h1 className="text-3xl font-bold">{candidate.fullName}</h1>
                    {candidate.headline && (
                      <p className="text-lg text-gray-600 mt-1">
                        {candidate.headline}
                      </p>
                    )}
                  </div>
                  {candidate.isDuplicate && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      Previously Sourced
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {candidate.currentPosition && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      {candidate.currentPosition}
                      {candidate.currentCompany && ` @ ${candidate.currentCompany}`}
                    </span>
                  )}
                  {candidate.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {candidate.location}
                    </span>
                  )}
                  {candidate.experienceYears && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {candidate.experienceYears} years experience
                    </span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Contact Information
                </h3>
                {candidate.hasContactInfo ? (
                  <div className="space-y-2">
                    {candidate.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a
                          href={`mailto:${candidate.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {candidate.email}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(candidate.email!, "email")
                          }
                          className="h-6 w-6 p-0"
                        >
                          {copiedField === "email" ? (
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    )}
                    {candidate.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a
                          href={`tel:${candidate.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {candidate.phone}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(candidate.phone!, "phone")
                          }
                          className="h-6 w-6 p-0"
                        >
                          {copiedField === "phone" ? (
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Contact information not available. Reach out via LinkedIn
                      directly.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Score Card */}
            <div className="md:w-48 space-y-3">
              <Card className="bg-linear-to-br from-purple-50 to-blue-50 border-2">
                <CardContent className="pt-6 text-center">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Match Score
                  </div>
                  <div
                    className={`text-5xl font-bold mb-4 ${
                      candidate.matchScore >= 80
                        ? "text-green-600"
                        : candidate.matchScore >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {Math.round(candidate.matchScore)}
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      candidate.matchScore >= 80
                        ? "bg-green-100 text-green-700"
                        : candidate.matchScore >= 60
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {candidate.matchScore >= 80
                      ? "Excellent Match"
                      : candidate.matchScore >= 60
                      ? "Good Match"
                      : "Fair Match"}
                  </Badge>
                </CardContent>
              </Card>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Info className="w-4 h-4 mr-2" />
                      Score Breakdown
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="w-64">
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">Score Components:</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Skills Match:</span>
                          <span className="font-semibold">
                            {candidate.skillsScore}/25
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Experience Level:</span>
                          <span className="font-semibold">
                            {candidate.experienceScore}/25
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Industry Fit:</span>
                          <span className="font-semibold">
                            {candidate.industryScore}/25
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Title/Seniority:</span>
                          <span className="font-semibold">
                            {candidate.titleScore}/25
                          </span>
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ScoreItem
              label="Skills Match"
              score={candidate.skillsScore}
              maxScore={25}
              icon={Award}
              color="blue"
            />
            <ScoreItem
              label="Experience Level"
              score={candidate.experienceScore}
              maxScore={25}
              icon={TrendingUp}
              color="green"
            />
            <ScoreItem
              label="Industry Fit"
              score={candidate.industryScore}
              maxScore={25}
              icon={Building2}
              color="purple"
            />
            <ScoreItem
              label="Title/Seniority"
              score={candidate.titleScore}
              maxScore={25}
              icon={Briefcase}
              color="orange"
            />
          </div>
        </CardContent>
      </Card>

      {/* Match Reasoning */}
      {candidate.matchReason && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Sparkles className="w-5 h-5" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-900 leading-relaxed">
              {candidate.matchReason}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Skills Section */}
      {candidate.skills && candidate.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Skills & Technologies ({candidate.skills.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 px-3 py-1"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience Section */}
      {candidate.experience && candidate.experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Work Experience ({candidate.experience.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {candidate.experience.map((exp, idx) => (
                  <div key={idx}>
                    {idx > 0 && <Separator className="my-6" />}
                    <div className="flex gap-4">
                      <div className="shrink-0">
                        <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{exp.title}</h3>
                        <p className="text-blue-600 font-medium">{exp.company}</p>
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {exp.duration}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Education Section */}
      {candidate.education && candidate.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Education ({candidate.education.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {candidate.education.map((edu, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p className="text-green-600 font-medium">{edu.school}</p>
                    {edu.year && (
                      <p className="text-sm text-gray-600 mt-1">{edu.year}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Info */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <p className="text-xs text-gray-600 text-center">
            Profile sourced on {new Date(candidate.scrapedAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Score Item Component
function ScoreItem({
  label,
  score,
  maxScore,
  icon: Icon,
  color,
}: {
  label: string;
  score: number;
  maxScore: number;
  icon: any;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const percentage = (score / maxScore) * 100;
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 border-blue-300",
    green: "bg-green-100 text-green-700 border-green-300",
    purple: "bg-purple-100 text-purple-700 border-purple-300",
    orange: "bg-orange-100 text-orange-700 border-orange-300",
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg border-2 p-4`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-2xl font-bold">
          {score}/{maxScore}
        </span>
      </div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="w-full bg-white/50 rounded-full h-2">
        <div
          className="bg-current h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-10 w-48" />
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-6">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-6 w-96" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}