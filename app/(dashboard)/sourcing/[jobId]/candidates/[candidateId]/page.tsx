"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  AlertCircle,
  Copy,
  CheckCircle2,
  Calendar,
  Building2,
  Target,
  Sparkles,
  Globe,
  Star,
  FileText,
  Download,
  Clock,
  TrendingUp,
  Check,
  X,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Shield,
  Zap,
  Info,
  MessageSquare,
  ThumbsUp,
  ChevronRight,
  Circle,
} from "lucide-react";

interface Experience {
  title: string;
  company: string;
  duration: string;
  description?: string;
  location?: string;
}

interface Education {
  degree: string;
  school: string;
  year?: string;
}

interface Certification {
  name: string;
  issuer: string;
  year?: string;
}

interface Language {
  name: string;
  level?: string;
}

interface ExperienceHighlight {
  title: string;
  company: string;
  relevance: "High" | "Medium" | "Low";
  reason: string;
}

interface Gap {
  type: "skill" | "experience" | "seniority" | "industry";
  gap: string;
  impact: "High" | "Medium" | "Low";
  mitigation?: string;
}

interface TradeOff {
  tradeoff: string;
  reasoning: string;
}

interface InterviewFocusArea {
  category: string;
  question: string;
  reasoning: string;
}

interface Candidate {
  id: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  profileUrl: string;
  photoUrl: string | null;
  publicIdentifier: string | null;
  
  currentPosition: string | null;
  currentCompany: string | null;
  currentCompanyLogo: string | null;
  currentJobDuration: string | null;
  experienceYears: number | null;
  
  skills: string[];
  experience: Experience[];
  education: Education[];
  certifications?: Certification[];
  languages?: Language[];
  
  email: string | null;
  phone: string | null;
  hasContactInfo: boolean;
  
  connections: number | null;
  followers: number | null;
  isPremium: boolean;
  isOpenToWork: boolean;
  
  // Core scoring
  matchScore: number;
  skillsScore: number;
  experienceScore: number;
  industryScore: number;
  titleScore: number;
  niceToHaveScore: number;
  matchReason: string | null;
  
  // Skill matching
  matchedSkills: string[] | null;
  missingSkills: string[] | null;
  bonusSkills: string[] | null;
  
  // Experience insights
  relevantYears: number | null;
  seniorityLevel: string | null;
  industryMatch: string | null;
  
  // NEW: Interview Readiness
  interviewReadiness?: "READY_TO_INTERVIEW" | "INTERVIEW_WITH_VALIDATION" | "NOT_RECOMMENDED" | "NOT_ASSESSED";
  interviewReadinessReason?: string | null;
  interviewConfidenceScore?: number | null;
  candidateSummary?: string | null;
  keyStrengths?: string[] | null;
  
  // NEW: Enhanced Skills
  skillsProficiency?: Record<string, number> | null;
  criticalGaps?: string[] | null;
  skillGapImpact?: "High" | "Medium" | "Low" | null;
  skillsAnalysisSummary?: string | null;
  
  // NEW: Enhanced Experience
  experienceRelevanceScore?: number | null;
  seniorityAlignment?: "Perfect" | "Higher" | "Lower" | "Unclear" | null;
  industryAlignment?: "Exact" | "Adjacent" | "Different" | null;
  experienceHighlights?: ExperienceHighlight[] | null;
  experienceAnalysisSummary?: string | null;
  
  // NEW: Gaps & Trade-offs
  hasSignificantGaps?: boolean;
  gapsAndTradeoffs?: {
    criticalGaps: Gap[];
    acceptableTradeoffs: TradeOff[];
    dealBreakers: string[];
  } | null;
  gapsOverallImpact?: "Manageable" | "Significant" | "Critical" | null;
  gapsSummary?: string | null;
  
  // NEW: Interview Focus
  interviewFocusAreas?: InterviewFocusArea[] | null;
  suggestedQuestions?: string[] | null;
  redFlags?: string[] | null;
  interviewFocusSummary?: string | null;
  
  isDuplicate: boolean;
  scrapedAt: string;
  scoredAt: string | null;
  fullAnalysisGenerated?: boolean;
}

interface JobRequirements {
  requiredSkills?: string;
  niceToHaveSkills?: string[];
  experienceYears?: number;
  title?: string;
  description?: string;
}

interface JobData {
  id: string;
  title: string;
  rawJobDescription: string;
  jobRequirements?: JobRequirements;
  searchFilters? : any;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const candidateId = params.candidateId as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [job, setJob] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [jobId, candidateId]);

  const fetchData = async () => {
    try {
      const [candidateRes, jobRes] = await Promise.all([
        fetch(`/api/sourcing/${jobId}/candidates/${candidateId}`),
        fetch(`/api/sourcing/${jobId}`)
      ]);

      const candidateData = await candidateRes.json();
      const jobData = await jobRes.json();

      if (!candidateRes.ok) {
        throw new Error(candidateData.error || "Failed to fetch candidate");
      }

      setCandidate(candidateData);
      setJob(jobData);
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

  const downloadProfile = () => {
    if (!candidate) return;
    
    const profileData = {
      name: candidate.fullName,
      headline: candidate.headline,
      location: candidate.location,
      email: candidate.email,
      phone: candidate.phone,
      currentRole: `${candidate.currentPosition} @ ${candidate.currentCompany}`,
      experience: candidate.experience,
      education: candidate.education,
      skills: candidate.skills,
      matchScore: candidate.matchScore,
      interviewReadiness: candidate.interviewReadiness,
    };

    const blob = new Blob([JSON.stringify(profileData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${candidate.fullName.replace(/\s+/g, '_')}_profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Candidate not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
    if (score >= 75) return { label: "Strong", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
    if (score >= 60) return { label: "Good", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    return { label: "Fair", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
  };

  const scoreConfig = getScoreLabel(candidate.matchScore);

  const getReadinessConfig = (status?: string) => {
    switch (status) {
      case "READY_TO_INTERVIEW":
        return {
          icon: CheckCircle2,
          label: "Ready to Interview",
          color: "text-green-700",
          bg: "bg-green-50",
          border: "border-green-200",
          badgeBg: "bg-green-100",
          badgeText: "text-green-700",
          iconColor: "text-green-600"
        };
      case "INTERVIEW_WITH_VALIDATION":
        return {
          icon: AlertCircle,
          label: "Interview with Validation",
          color: "text-amber-700",
          bg: "bg-amber-50",
          border: "border-amber-200",
          badgeBg: "bg-amber-100",
          badgeText: "text-amber-700",
          iconColor: "text-amber-600"
        };
      case "NOT_RECOMMENDED":
        return {
          icon: X,
          label: "Not Recommended",
          color: "text-red-700",
          bg: "bg-red-50",
          border: "border-red-200",
          badgeBg: "bg-red-100",
          badgeText: "text-red-700",
          iconColor: "text-red-600"
        };
      default:
        return {
          icon: Info,
          label: "Assessment Pending",
          color: "text-gray-700",
          bg: "bg-gray-50",
          border: "border-gray-200",
          badgeBg: "bg-gray-100",
          badgeText: "text-gray-700",
          iconColor: "text-gray-600"
        };
    }
  };

  const readinessConfig = getReadinessConfig(candidate.interviewReadiness);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/sourcing/${jobId}`}>
            <Button variant="ghost" size="sm" className="text-muted-foreground h-9 hover:bg-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Candidates
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            {candidate.email && (
              <Button variant="outline" size="sm" className="h-9 bg-white hover:bg-gray-50" asChild>
                <a href={`mailto:${candidate.email}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-9 bg-white hover:bg-gray-50" asChild>
              <a href={candidate.profileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                LinkedIn
              </a>
            </Button>
            <Button variant="outline" size="sm" className="h-9 bg-white hover:bg-gray-50" onClick={downloadProfile}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <Card className="shadow-md border-slate-200 bg-white mb-6">
          <CardContent className="p-6">
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              {/* Left: Profile Info */}
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20 shrink-0 ring-4 ring-slate-100">
                    <AvatarImage src={candidate.photoUrl || undefined} alt={candidate.fullName} />
                    <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      {candidate.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{candidate.fullName}</h1>
                    {candidate.headline && (
                      <p className="text-base text-slate-600 mb-3 line-clamp-2">
                        {candidate.headline}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {candidate.seniorityLevel && (
                        <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {candidate.seniorityLevel}
                        </Badge>
                      )}
                      {candidate.isOpenToWork && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-medium">
                          <Target className="w-3 h-3 mr-1" />
                          Open to Work
                        </Badge>
                      )}
                      {candidate.isPremium && (
                        <Badge variant="secondary" className="text-xs font-medium bg-amber-50 text-amber-700 border-amber-200">
                          <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current Role */}
                {candidate.currentPosition && (
                  <Card className="bg-linear-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-base">{candidate.currentPosition}</h3>
                          <p className="text-sm text-blue-700 font-medium">{candidate.currentCompany}</p>
                          {candidate.currentJobDuration && (
                            <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {candidate.currentJobDuration}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                  {candidate.location && (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {candidate.location}
                    </span>
                  )}
                  {candidate.experienceYears !== null && (
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      {candidate.experienceYears} years total experience
                    </span>
                  )}
                  {candidate.relevantYears !== null && (
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-semibold text-green-700">{candidate.relevantYears} years relevant</span>
                    </span>
                  )}
                </div>

                {/* Contact Info */}
                {candidate.hasContactInfo && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-3 space-y-2">
                      {candidate.email && (
                        <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2.5 hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                            <a href={`mailto:${candidate.email}`} className="text-sm text-blue-600 hover:underline truncate font-medium">
                              {candidate.email}
                            </a>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(candidate.email!, "email")} className="h-8 w-8 p-0 shrink-0">
                            {copiedField === "email" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2.5 hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                            <a href={`tel:${candidate.phone}`} className="text-sm text-blue-600 hover:underline font-medium">
                              {candidate.phone}
                            </a>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(candidate.phone!, "phone")} className="h-8 w-8 p-0 shrink-0">
                            {copiedField === "phone" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right: Decision Card */}
              <div className="space-y-4">
                {/* Interview Readiness Card */}
                <Card className={`border-2 ${readinessConfig.border} ${readinessConfig.bg} shadow-lg`}>
                  <CardContent className="p-5">
                    <div className="text-center space-y-4">
                      <div className="flex justify-center">
                        <div className={`h-16 w-16 rounded-full ${readinessConfig.badgeBg} flex items-center justify-center`}>
                          <readinessConfig.icon className={`w-8 h-8 ${readinessConfig.iconColor}`} />
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Interview Status
                        </div>
                        <h3 className={`text-lg font-bold ${readinessConfig.color}`}>
                          {readinessConfig.label}
                        </h3>
                      </div>

                      {candidate.interviewConfidenceScore !== null && candidate.interviewConfidenceScore !== undefined && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">Confidence</span>
                            <span className={`font-bold ${readinessConfig.color}`}>
                              {Math.round(candidate.interviewConfidenceScore)}%
                            </span>
                          </div>
                          <Progress 
                            value={candidate.interviewConfidenceScore} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Match Score Card */}
                <Card className="bg-linear-to-br from-blue-600 to-indigo-600 shadow-lg border-0">
                  <CardContent className="p-5 text-center text-white">
                    <div className="mb-2">
                      <Target className="w-5 h-5 mx-auto mb-1.5 opacity-90" />
                      <div className="text-xs font-semibold opacity-90 uppercase tracking-wider">
                        Overall Match Score
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-6xl font-black leading-none">{Math.round(candidate.matchScore)}</div>
                      <div className="text-sm opacity-80 mt-1">/100</div>
                    </div>
                    
                    <Badge variant="secondary" className={`${scoreConfig.bg} ${scoreConfig.color} border ${scoreConfig.border} text-xs font-semibold`}>
                      {scoreConfig.label} Fit
                    </Badge>
                  </CardContent>
                </Card>

                {/* Score Breakdown */}
                <Card className="border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Score Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ScoreBar label="Skills" score={candidate.skillsScore} maxScore={30} color="bg-green-500" />
                    <ScoreBar label="Experience" score={candidate.experienceScore} maxScore={25} color="bg-blue-500" />
                    <ScoreBar label="Industry" score={candidate.industryScore} maxScore={20} color="bg-purple-500" />
                    <ScoreBar label="Title" score={candidate.titleScore} maxScore={15} color="bg-amber-500" />
                    <ScoreBar label="Bonus" score={candidate.niceToHaveScore} maxScore={10} color="bg-pink-500" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Card className="shadow-md border-slate-200 bg-white">
          <Tabs defaultValue="readiness" className="w-full">
            <CardHeader className="pb-4 border-b border-slate-200">
              <TabsList className="grid w-full grid-cols-6 h-auto p-1 bg-slate-100">
                <TabsTrigger value="readiness" className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Shield className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Readiness
                </TabsTrigger>
                <TabsTrigger value="skills" className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Zap className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Skills
                </TabsTrigger>
                <TabsTrigger value="experience" className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Briefcase className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Experience
                </TabsTrigger>
                <TabsTrigger value="gaps" className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <AlertTriangle className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Gaps
                </TabsTrigger>
                <TabsTrigger value="interview" className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <MessageSquare className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Interview
                </TabsTrigger>
                <TabsTrigger value="profile" className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <FileText className="w-4 h-4 mr-1.5 hidden sm:inline" />
                  Profile
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-6">
              {/* INTERVIEW READINESS TAB */}
              <TabsContent value="readiness" className="mt-0 space-y-6">
                <InterviewReadinessTab candidate={candidate} readinessConfig={readinessConfig} />
              </TabsContent>

              {/* SKILLS ANALYSIS TAB */}
              <TabsContent value="skills" className="mt-0 space-y-6">
                <SkillsAnalysisTab candidate={candidate} job={job} />
              </TabsContent>

              {/* EXPERIENCE ANALYSIS TAB */}
              <TabsContent value="experience" className="mt-0 space-y-6">
                <ExperienceAnalysisTab candidate={candidate} />
              </TabsContent>

              {/* GAPS & TRADE-OFFS TAB */}
              <TabsContent value="gaps" className="mt-0 space-y-6">
                <GapsTradeoffsTab candidate={candidate} />
              </TabsContent>

              {/* INTERVIEW FOCUS TAB */}
              <TabsContent value="interview" className="mt-0 space-y-6">
                <InterviewFocusTab candidate={candidate} />
              </TabsContent>

              {/* FULL PROFILE TAB */}
              <TabsContent value="profile" className="mt-0 space-y-6">
                <FullProfileTab candidate={candidate} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// TAB COMPONENTS
// ============================================

function InterviewReadinessTab({ candidate, readinessConfig }: { 
  candidate: Candidate; 
  readinessConfig: any;
}) {
  return (
    <>
      {/* Summary Card */}
      {candidate.candidateSummary && (
        <Card className={`border-2 ${readinessConfig.border} ${readinessConfig.bg}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className={`w-5 h-5 ${readinessConfig.iconColor}`} />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed">
              {candidate.candidateSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Strengths */}
      {candidate.keyStrengths && candidate.keyStrengths.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-green-600" />
            Key Strengths
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {candidate.keyStrengths.map((strength, idx) => (
              <Card key={idx} className="border-green-200 bg-green-50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed flex-1">
                      {strength}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      {candidate.interviewReadinessReason && (
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Detailed Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {candidate.interviewReadinessReason.split('\n').filter(line => line.trim()).map((line, idx) => (
                <p key={idx} className="text-sm text-slate-700 leading-relaxed mb-2">
                  {line.trim()}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confidence Meter */}
      {candidate.interviewConfidenceScore !== null && candidate.interviewConfidenceScore !== undefined && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Recommendation Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">How confident are we in this assessment?</span>
                <span className="text-lg font-bold text-blue-700">
                  {Math.round(candidate.interviewConfidenceScore)}%
                </span>
              </div>
              <Progress value={candidate.interviewConfidenceScore} className="h-3" />
              <p className="text-xs text-slate-600">
                {candidate.interviewConfidenceScore >= 75 ? "High confidence - strong signal match" :
                 candidate.interviewConfidenceScore >= 50 ? "Moderate confidence - worth exploring further" :
                 "Lower confidence - additional validation recommended"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function SkillsAnalysisTab({ candidate, job }: { candidate: Candidate; job: JobData | null }) {
  const matchedCount = candidate.matchedSkills?.length || 0;
  const missingCount = candidate.missingSkills?.length || 0;
  const totalRequired = matchedCount + missingCount;
  const skillMatchPercentage = totalRequired > 0 
    ? Math.min((matchedCount / totalRequired) * 100, 100)
    : 0;

  return (
    <>
      {/* Skills Match Overview */}
      <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Skills Coverage</h3>
            <span className="text-2xl font-bold text-blue-700">
              {matchedCount}/{totalRequired}
            </span>
          </div>
          <Progress value={skillMatchPercentage} className="h-3 mb-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {Math.round(skillMatchPercentage)}% of required skills matched
            </span>
            {candidate.skillGapImpact && (
              <Badge 
                variant="secondary" 
                className={
                  candidate.skillGapImpact === "High" ? "bg-red-100 text-red-700" :
                  candidate.skillGapImpact === "Medium" ? "bg-amber-100 text-amber-700" :
                  "bg-green-100 text-green-700"
                }
              >
                {candidate.skillGapImpact} Impact Gaps
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Summary */}
      {candidate.skillsAnalysisSummary && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed">
              {candidate.skillsAnalysisSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Matched Skills */}
      {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            Matched Skills ({candidate.matchedSkills.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {candidate.matchedSkills.map((skill, idx) => {
              const proficiency = candidate.skillsProficiency?.[skill] || 3;
              return (
                <Card key={idx} className="bg-green-50 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-green-900">{skill}</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < proficiency
                                ? "fill-green-500 text-green-500"
                                : "text-green-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="h-1.5 bg-green-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${(proficiency / 5) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Missing Skills */}
      {candidate.missingSkills && candidate.missingSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-700">
            <X className="w-4 h-4" />
            Missing Skills ({candidate.missingSkills.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {candidate.missingSkills.map((skill, idx) => {
              const isCritical = candidate.criticalGaps?.includes(skill);
              return (
                <Card key={idx} className={`shadow-sm ${isCritical ? 'bg-red-50 border-red-300 border-2' : 'bg-red-50 border-red-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-red-900">{skill}</span>
                      <Badge 
                        variant="secondary" 
                        className={isCritical ? "bg-red-200 text-red-800 text-xs" : "bg-red-100 text-red-700 text-xs"}
                      >
                        {isCritical ? "Critical" : "Gap"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Bonus Skills */}
      {candidate.bonusSkills && candidate.bonusSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-purple-700">
            <Sparkles className="w-4 h-4" />
            Bonus Skills ({candidate.bonusSkills.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {candidate.bonusSkills.map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 text-sm py-1.5 px-3">
                <Sparkles className="w-3 h-3 mr-1" />
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* All Skills */}
      {candidate.skills && candidate.skills.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-sm font-semibold mb-3 text-slate-700">
            All Listed Skills ({candidate.skills.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ExperienceAnalysisTab({ candidate }: { candidate: Candidate }) {
  return (
    <>
      {/* Experience Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-700 mb-1">
              {candidate.experienceYears || 0}
            </div>
            <div className="text-xs text-slate-600 font-medium">Total Years</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-700 mb-1">
              {candidate.relevantYears || 0}
            </div>
            <div className="text-xs text-slate-600 font-medium">Relevant Years</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-purple-700 mb-1">
              {candidate.seniorityLevel || "Unknown"}
            </div>
            <div className="text-xs text-slate-600 font-medium">Seniority Level</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis */}
      {candidate.experienceAnalysisSummary && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Experience Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed">
              {candidate.experienceAnalysisSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alignment Metrics */}
      <div className="grid gap-4 sm:grid-cols-2">
        {candidate.seniorityAlignment && (
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600">Seniority Fit</span>
                <Badge 
                  variant="secondary"
                  className={
                    candidate.seniorityAlignment === "Perfect" ? "bg-green-100 text-green-700" :
                    candidate.seniorityAlignment === "Higher" ? "bg-blue-100 text-blue-700" :
                    candidate.seniorityAlignment === "Lower" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-700"
                  }
                >
                  {candidate.seniorityAlignment}
                </Badge>
              </div>
              <Progress 
                value={
                  candidate.seniorityAlignment === "Perfect" ? 100 :
                  candidate.seniorityAlignment === "Higher" ? 75 :
                  candidate.seniorityAlignment === "Lower" ? 50 : 25
                } 
                className="h-2"
              />
            </CardContent>
          </Card>
        )}

        {candidate.industryAlignment && (
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600">Industry Fit</span>
                <Badge 
                  variant="secondary"
                  className={
                    candidate.industryAlignment === "Exact" ? "bg-green-100 text-green-700" :
                    candidate.industryAlignment === "Adjacent" ? "bg-blue-100 text-blue-700" :
                    "bg-amber-100 text-amber-700"
                  }
                >
                  {candidate.industryAlignment}
                </Badge>
              </div>
              <Progress 
                value={
                  candidate.industryAlignment === "Exact" ? 100 :
                  candidate.industryAlignment === "Adjacent" ? 70 : 40
                } 
                className="h-2"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Experience Highlights */}
      {candidate.experienceHighlights && candidate.experienceHighlights.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Most Relevant Experience
          </h4>
          <div className="space-y-3">
            {candidate.experienceHighlights.map((exp, idx) => {
              const config = {
                High: { 
                  color: 'border-green-500', 
                  bg: 'bg-green-50',
                  badgeBg: 'bg-green-100',
                  badgeText: 'text-green-700',
                  label: 'Highly Relevant'
                },
                Medium: { 
                  color: 'border-amber-500', 
                  bg: 'bg-amber-50',
                  badgeBg: 'bg-amber-100',
                  badgeText: 'text-amber-700',
                  label: 'Relevant'
                },
                Low: { 
                  color: 'border-gray-400', 
                  bg: 'bg-gray-50',
                  badgeBg: 'bg-gray-100',
                  badgeText: 'text-gray-700',
                  label: 'Less Relevant'
                }
              }[exp.relevance];

              return (
                <Card key={idx} className={`border-l-4 ${config.color} ${config.bg} shadow-sm`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-slate-900">{exp.title}</h5>
                        <p className="text-sm text-blue-600 font-medium">{exp.company}</p>
                      </div>
                      <Badge variant="secondary" className={`text-xs shrink-0 ${config.badgeBg} ${config.badgeText}`}>
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {exp.reason}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Experience Timeline */}
      {candidate.experience && candidate.experience.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-sm font-semibold mb-3 text-slate-700">
            Complete Work History ({candidate.experience.length} roles)
          </h4>
          <div className="space-y-3">
            {candidate.experience.map((exp, idx) => (
              <Card key={idx} className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-slate-900">{exp.title}</h5>
                      <p className="text-sm text-blue-600 font-medium">{exp.company}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {exp.duration}
                    </span>
                    {exp.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {exp.location}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function GapsTradeoffsTab({ candidate }: { candidate: Candidate }) {
  const hasGaps = candidate.gapsAndTradeoffs && (
    candidate.gapsAndTradeoffs.criticalGaps.length > 0 ||
    candidate.gapsAndTradeoffs.acceptableTradeoffs.length > 0 ||
    candidate.gapsAndTradeoffs.dealBreakers.length > 0
  );

  return (
    <>
      {/* Overall Impact */}
      {candidate.gapsOverallImpact && (
        <Card className={`border-2 shadow-sm ${
          candidate.gapsOverallImpact === "Critical" ? "bg-red-50 border-red-300" :
          candidate.gapsOverallImpact === "Significant" ? "bg-amber-50 border-amber-300" :
          "bg-green-50 border-green-300"
        }`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                candidate.gapsOverallImpact === "Critical" ? "bg-red-100" :
                candidate.gapsOverallImpact === "Significant" ? "bg-amber-100" :
                "bg-green-100"
              }`}>
                {candidate.gapsOverallImpact === "Critical" ? (
                  <X className="w-6 h-6 text-red-600" />
                ) : candidate.gapsOverallImpact === "Significant" ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase mb-0.5">
                  Overall Gap Impact
                </div>
                <div className={`text-lg font-bold ${
                  candidate.gapsOverallImpact === "Critical" ? "text-red-700" :
                  candidate.gapsOverallImpact === "Significant" ? "text-amber-700" :
                  "text-green-700"
                }`}>
                  {candidate.gapsOverallImpact}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {candidate.gapsSummary && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Honest Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed">
              {candidate.gapsSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {hasGaps ? (
        <>
          {/* Critical Gaps */}
          {candidate.gapsAndTradeoffs!.criticalGaps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                Critical Gaps ({candidate.gapsAndTradeoffs!.criticalGaps.length})
              </h4>
              <div className="space-y-3">
                {candidate.gapsAndTradeoffs!.criticalGaps.map((gap, idx) => (
                  <Card key={idx} className={`shadow-sm ${
                    gap.impact === "High" ? "border-red-300 bg-red-50 border-2" :
                    gap.impact === "Medium" ? "border-amber-300 bg-amber-50" :
                    "border-slate-300 bg-slate-50"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                              {gap.type}
                            </Badge>
                            <Badge 
                              variant="secondary"
                              className={`text-xs ${
                                gap.impact === "High" ? "bg-red-100 text-red-700" :
                                gap.impact === "Medium" ? "bg-amber-100 text-amber-700" :
                                "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {gap.impact} Impact
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            {gap.gap}
                          </p>
                        </div>
                      </div>
                      {gap.mitigation && (
                        <Alert className="mt-3 bg-blue-50 border-blue-200">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-xs text-blue-900">
                            <span className="font-semibold">Mitigation:</span> {gap.mitigation}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Acceptable Trade-offs */}
          {candidate.gapsAndTradeoffs!.acceptableTradeoffs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-700">
                <ThumbsUp className="w-4 h-4" />
                Acceptable Trade-offs ({candidate.gapsAndTradeoffs!.acceptableTradeoffs.length})
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {candidate.gapsAndTradeoffs!.acceptableTradeoffs.map((tradeoff, idx) => (
                  <Card key={idx} className="border-blue-200 bg-blue-50 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold text-slate-900 mb-2">
                        {tradeoff.tradeoff}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {tradeoff.reasoning}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Deal Breakers */}
          {candidate.gapsAndTradeoffs!.dealBreakers.length > 0 && (
            <Alert variant="destructive" className="border-2">
              <X className="h-5 w-5" />
              <AlertDescription>
                <div className="font-semibold mb-2">Deal Breakers Identified:</div>
                <ul className="list-disc list-inside space-y-1">
                  {candidate.gapsAndTradeoffs!.dealBreakers.map((breaker, idx) => (
                    <li key={idx} className="text-sm">{breaker}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-green-900 mb-2">
              No Significant Gaps Identified
            </h4>
            <p className="text-sm text-green-700">
              This candidate&apos;s profile aligns well with the requirements.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function InterviewFocusTab({ candidate }: { candidate: Candidate }) {
  return (
    <>
      {/* AI Summary */}
      {candidate.interviewFocusSummary && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Interview Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed">
              {candidate.interviewFocusSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Focus Areas */}
      {candidate.interviewFocusAreas && candidate.interviewFocusAreas.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700">
            <Target className="w-4 h-4 text-blue-600" />
            Key Focus Areas ({candidate.interviewFocusAreas.length})
          </h4>
          <div className="space-y-3">
            {candidate.interviewFocusAreas.map((area, idx) => (
              <Card key={idx} className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-blue-600">{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                          {area.category}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mb-2">
                        {area.question}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-semibold">Why:</span> {area.reasoning}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Questions */}
      {candidate.suggestedQuestions && candidate.suggestedQuestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            Suggested Interview Questions ({candidate.suggestedQuestions.length})
          </h4>
          <div className="space-y-2">
            {candidate.suggestedQuestions.map((question, idx) => (
              <Card key={idx} className="border-purple-200 bg-purple-50 shadow-sm hover:bg-purple-100 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <ChevronRight className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {question}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {candidate.redFlags && candidate.redFlags.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-300">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            <div className="font-semibold mb-2 text-red-900">
              Areas of Concern to Probe:
            </div>
            <ul className="space-y-2">
              {candidate.redFlags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                  <Circle className="w-2 h-2 fill-red-600 text-red-600 shrink-0 mt-1.5" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

function FullProfileTab({ candidate }: { candidate: Candidate }) {
  return (
    <>
      {/* Education */}
      {candidate.education && candidate.education.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            Education
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {candidate.education.map((edu, idx) => (
              <Card key={idx} className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-sm mb-1 text-slate-900">{edu.degree}</h5>
                      <p className="text-sm text-blue-600 font-medium mb-2">{edu.school}</p>
                      {edu.year && (
                        <Badge variant="secondary" className="text-xs">
                          {edu.year}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {candidate.certifications && candidate.certifications.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700">
            <Award className="w-4 h-4 text-purple-600" />
            Certifications
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {candidate.certifications.map((cert, idx) => (
              <Card key={idx} className="border-purple-200 bg-purple-50 shadow-sm">
                <CardContent className="p-3">
                  <h5 className="font-semibold text-sm mb-1 text-slate-900">{cert.name}</h5>
                  <p className="text-xs text-purple-600 font-medium mb-1">{cert.issuer}</p>
                  {cert.year && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                      {cert.year}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {candidate.languages && candidate.languages.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-700">
            <Globe className="w-4 h-4 text-green-600" />
            Languages
          </h4>
          <div className="grid gap-3 sm:grid-cols-3">
            {candidate.languages.map((lang, idx) => (
              <Card key={idx} className="border-green-200 bg-green-50 shadow-sm">
                <CardContent className="p-3 text-center">
                  <h5 className="font-semibold text-sm text-slate-900">{lang.name}</h5>
                  {lang.level && (
                    <Badge variant="secondary" className="text-xs mt-1 bg-green-100 text-green-700">
                      {lang.level}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="pt-4 border-t border-slate-200">
        <h4 className="text-sm font-semibold mb-3 text-slate-700">Profile Metadata</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {candidate.connections && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Network Size</span>
              <span className="font-semibold text-slate-900">
                {candidate.connections >= 500 ? '500+' : candidate.connections} connections
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Profile Added</span>
            <span className="font-semibold text-slate-900">
              {new Date(candidate.scrapedAt).toLocaleDateString()}
            </span>
          </div>
          {candidate.scoredAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Last Scored</span>
              <span className="font-semibold text-slate-900">
                {new Date(candidate.scoredAt).toLocaleDateString()}
              </span>
            </div>
          )}
          {candidate.fullAnalysisGenerated && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Full Analysis</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Generated
              </Badge>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================
// UTILITY COMPONENTS
// ============================================

function ScoreBar({ label, score, maxScore, color }: {
  label: string;
  score: number;
  maxScore: number;
  color: string;
}) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-slate-900">{score}/{maxScore}</span>
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`absolute inset-y-0 left-0 ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Skeleton className="h-9 w-40 mb-6" />
        <Card className="shadow-md mb-6">
          <CardContent className="p-6">
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}