"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  // ExternalLink,
  AlertCircle,
  Copy,
  CheckCircle2,
  Calendar,
  Building2,
  // TrendingUp,
  Target,
  Sparkles,
  Globe,
  Users,
  Star,
  Languages,
  FileText,
  Download,
  // MessageSquare,
  Linkedin,
  Clock,
  BarChart3,
  Zap,
  Shield,
  Info,
  // ChevronRight,
  Check,
  X,
} from "lucide-react";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Skills are now just an array of strings
// interface Skill {
//   name: string;
//   endorsements?: number;
// }

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

interface Candidate {
  id: string;
  
  // Basic Info
  fullName: string;
  headline: string | null;
  location: string | null;
  profileUrl: string;
  photoUrl: string | null;
  linkedInId: string | null;
  publicIdentifier: string | null;
  
  // Current Role
  currentPosition: string | null;
  currentCompany: string | null;
  currentCompanyLogo: string | null;
  currentJobDuration: string | null;
  experienceYears: number | null;
  
  // Detailed Data
  skills: string[]; // Updated to array of strings
  experience: Experience[];
  education: Education[];
  certifications?: Certification[];
  languages?: Language[];
  
  // Contact Info
  email: string | null;
  phone: string | null;
  hasContactInfo: boolean;
  
  // LinkedIn Stats
  connections: number | null;
  followers: number | null;
  isPremium: boolean;
  isVerified: boolean;
  isOpenToWork: boolean;
  
  // Scoring
  matchScore: number;
  skillsScore: number;
  experienceScore: number;
  industryScore: number;
  titleScore: number;
  niceToHaveScore: number;
  matchReason: string | null;
  
  // Skill Matching
  matchedSkills: string[] | null;
  missingSkills: string[] | null;
  bonusSkills: string[] | null;
  
  // Experience Insights
  relevantYears: number | null;
  seniorityLevel: string | null;
  industryMatch: string | null;
  
  // Metadata
  isDuplicate: boolean;
  scrapedAt: string;
  scoredAt: string | null;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const candidateId = params.candidateId as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

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

  const downloadProfile = () => {
    if (!candidate) return;
    
    const profileData = {
      name: candidate.fullName,
      headline: candidate.headline,
      location: candidate.location,
      email: candidate.email,
      phone: candidate.phone,
      linkedIn: candidate.profileUrl,
      currentRole: `${candidate.currentPosition} @ ${candidate.currentCompany}`,
      experience: candidate.experience,
      education: candidate.education,
      skills: candidate.skills,
      matchScore: candidate.matchScore,
    };

    const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
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
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Candidate not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/sourcing/${jobId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Candidates
          </Button>
        </Link>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadProfile}>
            <Download className="w-4 h-4 mr-2" />
            Download Profile
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${candidate.email}`} target="_blank">
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </a>
          </Button>
          <Button variant="default" size="sm" asChild>
            <a href={candidate.profileUrl} target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-4 h-4 mr-2" />
              View LinkedIn
            </a>
          </Button>
        </div>
      </div>

      {/* Hero Section - Profile Header */}
      <Card className="border-2 bg-linear-to-br from-blue-50/50 via-purple-50/30 to-pink-50/20">
        <CardContent className="pt-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Avatar & Quick Actions */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage
                    src={candidate.photoUrl || undefined}
                    alt={candidate.fullName}
                  />
                  <AvatarFallback className="text-4xl font-bold bg-linear-to-br from-blue-500 to-purple-600 text-white">
                    {candidate.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Status Badges on Avatar */}
                {candidate.isPremium && (
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border-2 border-background">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                )}
                {candidate.isOpenToWork && (
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-linear-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg border-2 border-background">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                )}
                {candidate.isVerified && (
                  <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg border-2 border-background">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* LinkedIn Stats */}
              <div className="flex gap-4 text-center">
                {candidate.connections && (
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {candidate.connections >= 500 ? '500+' : candidate.connections}
                    </div>
                    <div className="text-xs text-muted-foreground">Connections</div>
                  </div>
                )}
                {candidate.followers && (
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {candidate.followers}
                    </div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-col gap-2 w-full">
                {candidate.isOpenToWork && (
                  <Badge className="bg-green-100 text-green-700 justify-center py-2 border border-green-300">
                    <Target className="w-3.5 h-3.5 mr-1.5" />
                    Open to Work
                  </Badge>
                )}
                {candidate.isPremium && (
                  <Badge className="bg-amber-100 text-amber-700 justify-center py-2 border border-amber-300">
                    <Star className="w-3.5 h-3.5 mr-1.5" />
                    Premium Member
                  </Badge>
                )}
                {candidate.isVerified && (
                  <Badge className="bg-blue-100 text-blue-700 justify-center py-2 border border-blue-300">
                    <Shield className="w-3.5 h-3.5 mr-1.5" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            {/* Center: Main Info */}
            <div className="flex-1 space-y-4">
              {/* Name & Headline */}
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold tracking-tight mb-1">
                      {candidate.fullName}
                    </h1>
                    {candidate.seniorityLevel && (
                      <Badge variant="outline" className="mb-2 text-sm">
                        {candidate.seniorityLevel} Level
                      </Badge>
                    )}
                  </div>
                  {candidate.isDuplicate && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 mt-1">
                      Previously Sourced
                    </Badge>
                  )}
                </div>
                
                {candidate.headline && (
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {candidate.headline}
                  </p>
                )}
              </div>

              {/* Current Role Card */}
              {(candidate.currentPosition || candidate.currentCompany) && (
                <Card className="bg-white/80 border-blue-200">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      {candidate.currentCompanyLogo ? (
                        <img 
                          src={candidate.currentCompanyLogo} 
                          alt={candidate.currentCompany || ""}
                          className="w-12 h-12 rounded-lg object-contain bg-white p-1 border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground">
                          {candidate.currentPosition}
                        </h3>
                        <p className="text-blue-600 font-medium">
                          {candidate.currentCompany}
                        </p>
                        {candidate.currentJobDuration && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {candidate.currentJobDuration}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {candidate.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {candidate.location}
                  </span>
                )}
                {candidate.experienceYears !== null && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    {candidate.experienceYears} years total experience
                  </span>
                )}
                {candidate.relevantYears !== null && candidate.relevantYears !== candidate.experienceYears && (
                  <span className="flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    {candidate.relevantYears} years relevant
                  </span>
                )}
                {candidate.industryMatch && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {candidate.industryMatch}
                  </span>
                )}
              </div>

              {/* Contact Information */}
              <Card className="bg-linear-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-blue-900">Contact Information</h3>
                  </div>
                  
                  {candidate.hasContactInfo ? (
                    <div className="space-y-2">
                      {candidate.email && (
                        <div className="flex items-center justify-between gap-2 bg-white/60 rounded-lg px-3 py-2 border border-blue-200">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                            <a
                              href={`mailto:${candidate.email}`}
                              className="text-blue-600 hover:underline font-medium truncate"
                            >
                              {candidate.email}
                            </a>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(candidate.email!, "email")}
                            className="h-8 w-8 p-0 shrink-0"
                          >
                            {copiedField === "email" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center justify-between gap-2 bg-white/60 rounded-lg px-3 py-2 border border-blue-200">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                            <a
                              href={`tel:${candidate.phone}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {candidate.phone}
                            </a>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(candidate.phone!, "phone")}
                            className="h-8 w-8 p-0 shrink-0"
                          >
                            {copiedField === "phone" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert className="bg-white/60 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm text-blue-900">
                        Contact information not available. Connect via professional profile directly.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Match Score Card */}
            <div className="md:w-72 space-y-4">
              <Card className="bg-linear-to-br from-purple-500 via-blue-500 to-indigo-600 text-white border-0 shadow-2xl">
                <CardContent className="pt-6 text-center">
                  <div className="mb-3">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-90" />
                    <div className="text-sm font-medium opacity-90">AI Match Score</div>
                  </div>
                  
                  <div className="relative inline-block mb-4">
                    <div className="text-7xl font-black tracking-tight">
                      {Math.round(candidate.matchScore)}
                    </div>
                    <div className="text-xl font-bold opacity-75 absolute -right-6 top-2">
                      /100
                    </div>
                  </div>
                  
                  <Badge
                    variant="secondary"
                    className={`
                      ${candidate.matchScore >= 90 ? "bg-green-500/20 text-green-100 border-green-400/30" :
                        candidate.matchScore >= 75 ? "bg-blue-500/20 text-blue-100 border-blue-400/30" :
                        candidate.matchScore >= 60 ? "bg-yellow-500/20 text-yellow-100 border-yellow-400/30" :
                        "bg-gray-500/20 text-gray-100 border-gray-400/30"}
                      text-sm px-4 py-1.5 border
                    `}
                  >
                    {candidate.matchScore >= 90 ? "🎯 Excellent Match" :
                     candidate.matchScore >= 75 ? "⭐ Strong Match" :
                     candidate.matchScore >= 60 ? "✓ Good Match" :
                     "○ Fair Match"}
                  </Badge>
                </CardContent>
              </Card>

              {/* Score Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScoreBar
                    label="Skills Match"
                    score={candidate.skillsScore}
                    maxScore={30}
                    color="green"
                  />
                  <ScoreBar
                    label="Experience"
                    score={candidate.experienceScore}
                    maxScore={25}
                    color="blue"
                  />
                  <ScoreBar
                    label="Industry Fit"
                    score={candidate.industryScore}
                    maxScore={20}
                    color="purple"
                  />
                  <ScoreBar
                    label="Title Match"
                    score={candidate.titleScore}
                    maxScore={15}
                    color="orange"
                  />
                  <ScoreBar
                    label="Bonus Skills"
                    score={candidate.niceToHaveScore}
                    maxScore={10}
                    color="pink"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      {candidate.matchReason && (
        <Card className="border-2 border-purple-200 bg-linear-to-r from-purple-50 via-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Sparkles className="w-5 h-5" />
              AI Match Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-purple-900 leading-relaxed whitespace-pre-line">
                {candidate.matchReason}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills Matching Section - Highlight */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Matched Skills */}
        {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-green-900">
                <CheckCircle2 className="w-4 h-4" />
                Required Skills Matched ({candidate.matchedSkills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {candidate.matchedSkills.map((skill, idx) => (
                  <Badge 
                    key={idx} 
                    className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Missing Skills */}
        {candidate.missingSkills && candidate.missingSkills.length > 0 && (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-red-900">
                <X className="w-4 h-4" />
                Missing Required Skills ({candidate.missingSkills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {candidate.missingSkills.map((skill, idx) => (
                  <Badge 
                    key={idx} 
                    className="bg-red-100 text-red-700 border-red-300"
                  >
                    <X className="w-3 h-3 mr-1" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bonus Skills */}
        {candidate.bonusSkills && candidate.bonusSkills.length > 0 && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-purple-900">
                <Sparkles className="w-4 h-4" />
                Bonus Skills ({candidate.bonusSkills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {candidate.bonusSkills.map((skill, idx) => (
                  <Badge 
                    key={idx} 
                    className="bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabbed Content - Detailed Information */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-3">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
              <TabsTrigger value="overview" className="gap-2">
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">All Skills</span>
                <span className="sm:hidden">Skills</span>
              </TabsTrigger>
              <TabsTrigger value="experience" className="gap-2">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">Experience</span>
                <span className="sm:hidden">Exp</span>
              </TabsTrigger>
              <TabsTrigger value="education" className="gap-2">
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Education</span>
                <span className="sm:hidden">Edu</span>
              </TabsTrigger>
              <TabsTrigger value="certifications" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Certifications</span>
                <span className="sm:hidden">Certs</span>
              </TabsTrigger>
              <TabsTrigger value="languages" className="gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Languages</span>
                <span className="sm:hidden">Lang</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Overview Tab - All Skills */}
            <TabsContent value="overview" className="mt-0">
              {candidate.skills && candidate.skills.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      All Skills & Technologies ({candidate.skills.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-900 border border-blue-200 hover:shadow-md transition-shadow px-4 py-2 text-sm font-medium"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Award}
                  message="No skills information available"
                />
              )}
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="mt-0">
              {candidate.experience && candidate.experience.length > 0 ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {candidate.experience.map((exp, idx) => (
                      <div key={idx} className="relative pl-8 pb-6 last:pb-0">
                        {/* Timeline line */}
                        {idx !== candidate.experience.length - 1 && (
                          <div className="absolute left-[15px] top-12 bottom-0 w-0.5 bg-linear-to-b from-blue-400 to-purple-400" />
                        )}
                        
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-0 h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg border-4 border-background">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>

                        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div>
                                <h3 className="text-xl font-bold text-foreground">
                                  {exp.title}
                                </h3>
                                <p className="text-lg text-blue-600 font-semibold mt-1">
                                  {exp.company}
                                </p>
                              </div>
                              
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4" />
                                  {exp.duration}
                                </span>
                                {exp.location && (
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    {exp.location}
                                  </span>
                                )}
                              </div>

                              {exp.description && (
                                <div className="pt-2 border-t">
                                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {exp.description}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <EmptyState
                  icon={Briefcase}
                  message="No work experience information available"
                />
              )}
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education" className="mt-0">
              {candidate.education && candidate.education.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {candidate.education.map((edu, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="shrink-0">
                            <div className="h-14 w-14 rounded-full bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
                              <GraduationCap className="w-7 h-7 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-foreground mb-1">
                              {edu.degree}
                            </h3>
                            <p className="text-green-600 font-semibold mb-2">
                              {edu.school}
                            </p>
                            {edu.year && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <Calendar className="w-3 h-3 mr-1" />
                                {edu.year}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={GraduationCap}
                  message="No education information available"
                />
              )}
            </TabsContent>

            {/* Certifications Tab */}
            <TabsContent value="certifications" className="mt-0">
              {candidate.certifications && candidate.certifications.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {candidate.certifications.map((cert, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="shrink-0">
                            <div className="h-14 w-14 rounded-full bg-linear-to-br from-purple-400 to-indigo-600 flex items-center justify-center shadow-lg">
                              <Award className="w-7 h-7 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-foreground mb-1">
                              {cert.name}
                            </h3>
                            <p className="text-purple-600 font-semibold mb-2">
                              {cert.issuer}
                            </p>
                            {cert.year && (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                <Calendar className="w-3 h-3 mr-1" />
                                Issued {cert.year}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Award}
                  message="No certifications available"
                />
              )}
            </TabsContent>

            {/* Languages Tab */}
            <TabsContent value="languages" className="mt-0">
              {candidate.languages && candidate.languages.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {candidate.languages.map((lang, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="h-12 w-12 rounded-full bg-linear-to-br from-orange-400 to-pink-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                            <Languages className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-bold text-lg text-foreground mb-1">
                            {lang.name}
                          </h3>
                          {lang.level && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              {lang.level}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Languages}
                  message="No language information available"
                />
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Footer - Metadata */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Sourced {new Date(candidate.scrapedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {candidate.scoredAt && (
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Scored {new Date(candidate.scoredAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              )}
            </div>
            {candidate.publicIdentifier && (
              <code className="bg-background px-2 py-1 rounded text-xs">
                linkedin.com/in/{candidate.publicIdentifier}
              </code>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Score Bar Component
function ScoreBar({
  label,
  score,
  maxScore,
  color,
}: {
  label: string;
  score: number;
  maxScore: number;
  color: "green" | "blue" | "purple" | "orange" | "pink";
}) {
  const percentage = (score / maxScore) * 100;
  
  const colorClasses = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    pink: "bg-pink-500",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">
          {score}/{maxScore}
        </span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-16">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Skeleton className="h-10 w-48" />
      <Card>
        <CardContent className="pt-8">
          <div className="flex gap-8">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-96" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-48 w-72" />
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