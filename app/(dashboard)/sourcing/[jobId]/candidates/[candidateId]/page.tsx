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
  Languages,
  FileText,
  Download,
  Clock,
  TrendingUp,
  Check,
  X,
  Activity,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
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
  
  matchScore: number;
  skillsScore: number;
  experienceScore: number;
  industryScore: number;
  titleScore: number;
  niceToHaveScore: number;
  matchReason: string | null;
  
  matchedSkills: string[] | null;
  missingSkills: string[] | null;
  bonusSkills: string[] | null;
  
  relevantYears: number | null;
  seniorityLevel: string | null;
  industryMatch: string | null;
  
  isDuplicate: boolean;
  scrapedAt: string;
  scoredAt: string | null;
}

interface JobRequirements {
  requiredSkills?: string[];
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

  // Helper: Get experience relevance
  const getExperienceRelevance = (exp: Experience): 'high' | 'medium' | 'low' => {
    const title = exp.title.toLowerCase();
    const jobTitle = job?.title?.toLowerCase() || '';
    const jobKeywords = job?.jobRequirements?.title?.toLowerCase().split(' ') || [];
    
    // High: title matches job title
    if (title.includes(jobTitle) || jobTitle.includes(title)) {
      return 'high';
    }
    
    // Medium: has relevant keywords
    const techKeywords = ['engineer', 'developer', 'architect', 'lead', 'senior', 'manager'];
    if (techKeywords.some(kw => title.includes(kw))) {
      return 'medium';
    }
    
    return 'low';
  };

  // Helper: Calculate skill proficiency (mock - would come from AI in production)
  const getSkillProficiency = (skill: string): number => {
    if (candidate?.matchedSkills?.includes(skill)) return 5;
    if (candidate?.bonusSkills?.includes(skill)) return 4;
    if (candidate?.skills?.includes(skill)) return 3;
    return 1;
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-24">
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

  // Calculate metrics
  const requiredSkills = job?.jobRequirements?.requiredSkills || [];
  const matchedCount = candidate.matchedSkills?.length || 0;
  const totalRequired = requiredSkills.length || 1;
  const skillMatchPercentage = (matchedCount / totalRequired) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/sourcing/${jobId}`}>
            <Button variant="ghost" size="sm" className="text-muted-foreground h-8">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Candidates
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            {candidate.email && (
              <Button variant="outline" size="sm" className="h-8" asChild>
                <a href={`mailto:${candidate.email}`}>
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  Email
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-8" asChild>
              <a href={candidate.profileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View Profile
              </a>
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={downloadProfile}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <Card className="shadow-sm border-muted mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-[1fr_280px] gap-6">
              {/* Left: Profile Info */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 shrink-0">
                    <AvatarImage src={candidate.photoUrl || undefined} alt={candidate.fullName} />
                    <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                      {candidate.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold mb-1">{candidate.fullName}</h1>
                    {candidate.headline && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {candidate.headline}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {candidate.seniorityLevel && (
                        <Badge variant="secondary" className="text-xs">
                          {candidate.seniorityLevel}
                        </Badge>
                      )}
                      {candidate.isOpenToWork && (
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                          <Target className="w-3 h-3 mr-1" />
                          Open to Work
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current Role */}
                {candidate.currentPosition && (
                  <Card className="bg-muted/50 border-muted">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{candidate.currentPosition}</h3>
                          <p className="text-sm text-primary font-medium">{candidate.currentCompany}</p>
                          {candidate.currentJobDuration && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
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
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {candidate.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {candidate.location}
                    </span>
                  )}
                  {candidate.experienceYears !== null && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      {candidate.experienceYears} years experience
                    </span>
                  )}
                </div>

                {/* Contact Info */}
                {candidate.hasContactInfo && (
                  <Card className="border-muted">
                    <CardContent className="p-3 space-y-2">
                      {candidate.email && (
                        <div className="flex items-center justify-between gap-2 bg-muted/50 rounded px-3 py-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                            <a href={`mailto:${candidate.email}`} className="text-sm text-primary hover:underline truncate">
                              {candidate.email}
                            </a>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(candidate.email!, "email")} className="h-7 w-7 p-0 shrink-0">
                            {copiedField === "email" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center justify-between gap-2 bg-muted/50 rounded px-3 py-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                            <a href={`tel:${candidate.phone}`} className="text-sm text-primary hover:underline">
                              {candidate.phone}
                            </a>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(candidate.phone!, "phone")} className="h-7 w-7 p-0 shrink-0">
                            {copiedField === "phone" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right: Match Score */}
              <div className="space-y-3">
                <Card className="bg-primary shadow-lg border-0">
                  <CardContent className="p-5 text-center text-white">
                    <div className="mb-2">
                      <Target className="w-5 h-5 mx-auto mb-1 opacity-90" />
                      <div className="text-xs font-medium opacity-90 uppercase tracking-wide">
                        Match Score
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-5xl font-black">{Math.round(candidate.matchScore)}</div>
                      <div className="text-sm opacity-75">/100</div>
                    </div>
                    
                    <Badge variant="secondary" className={`${scoreConfig.bg} ${scoreConfig.color} border ${scoreConfig.border} text-xs`}>
                      {scoreConfig.label} Match
                    </Badge>
                  </CardContent>
                </Card>

                {/* Score Breakdown */}
                <Card className="border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                      Score Components
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
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

        {/* AI Match Reason */}
      {candidate.matchReason && (
        <Card className="border-primary/20 bg-primary/5 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Why This Match?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {candidate.matchReason.split('\n').filter(line => line.trim()).map((point, idx) => (
                <li key={idx} className="text-sm text-foreground leading-relaxed flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="flex-1">{point.trim()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

        {/* Tabs */}
        <Card className="shadow-sm border-muted">
          <Tabs defaultValue="skills" className="w-full">
            <CardHeader className="pb-3">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="skills" className="text-xs">
                  <Award className="w-3.5 h-3.5 mr-1.5" />
                  Skills
                </TabsTrigger>
                <TabsTrigger value="experience" className="text-xs">
                  <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                  Experience
                </TabsTrigger>
                <TabsTrigger value="education" className="text-xs">
                  <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
                  Education
                </TabsTrigger>
                <TabsTrigger value="certifications" className="text-xs">
                  <Award className="w-3.5 h-3.5 mr-1.5" />
                  Certs
                </TabsTrigger>
                <TabsTrigger value="other" className="text-xs">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Other
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* SKILLS TAB */}
              <TabsContent value="skills" className="mt-0 space-y-6">
                {/* Skills Match Overview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Skills Match Overview</h3>
                    <span className="text-sm font-bold text-primary">
                      {matchedCount}/{totalRequired} Required Skills
                    </span>
                  </div>
                  <Progress value={skillMatchPercentage} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round(skillMatchPercentage)}% coverage of required skills
                  </p>
                </div>

                {/* Matched Skills */}
                {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Matched Skills ({candidate.matchedSkills.length})
                    </h4>
                    <div className="grid gap-2">
                      {candidate.matchedSkills.map((skill, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-green-900">{skill}</span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < getSkillProficiency(skill)
                                    ? "fill-green-600 text-green-600"
                                    : "text-green-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      Missing Skills ({candidate.missingSkills.length})
                    </h4>
                    <div className="grid gap-2">
                      {candidate.missingSkills.map((skill, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-red-900">{skill}</span>
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                            Gap
                          </Badge>
                        </div>
                      ))}
                    </div>
                    
                    {/* Training suggestion */}
                    <Alert className="bg-blue-50 border-blue-200">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm text-blue-900">
                        <span className="font-semibold">Recommendation:</span> Consider training in {candidate.missingSkills.slice(0, 2).join(' and ')} to fill critical gaps.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Bonus Skills */}
                {candidate.bonusSkills && candidate.bonusSkills.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-purple-700">
                      <Sparkles className="w-4 h-4" />
                      Bonus Skills ({candidate.bonusSkills.length})
                    </h4>
                    <div className="grid gap-2">
                      {candidate.bonusSkills.map((skill, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-purple-900">{skill}</span>
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            Extra
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Skills List */}
                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-3">
                      All Skills ({candidate.skills.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* EXPERIENCE TAB */}
              <TabsContent value="experience" className="mt-0 space-y-6">
                {/* Experience Overview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Experience Summary</h3>
                    <div className="text-right">
                      <div className="text-sm font-bold">{candidate.experienceYears || 0} years total</div>
                      {candidate.relevantYears && (
                        <div className="text-xs text-green-600 font-semibold">
                          {candidate.relevantYears} years relevant
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Experience Timeline */}
                {candidate.experience && candidate.experience.length > 0 ? (
                  <div className="space-y-3">
                    {candidate.experience.map((exp, idx) => {
                      const relevance = getExperienceRelevance(exp);
                      const config = {
                        high: { 
                          label: 'Highly Relevant', 
                          color: 'bg-green-500', 
                          bgColor: 'bg-green-50',
                          borderColor: 'border-green-300',
                          textColor: 'text-green-700'
                        },
                        medium: { 
                          label: 'Relevant', 
                          color: 'bg-amber-500', 
                          bgColor: 'bg-amber-50',
                          borderColor: 'border-amber-300',
                          textColor: 'text-amber-700'
                        },
                        low: { 
                          label: 'Less Relevant', 
                          color: 'bg-gray-400', 
                          bgColor: 'bg-gray-50',
                          borderColor: 'border-gray-300',
                          textColor: 'text-gray-600'
                        }
                      }[relevance];

                      return (
                        <Card key={idx} className={`border-l-4 ${config.borderColor.replace('border-', 'border-l-')} ${config.bgColor}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold">{exp.title}</h4>
                                <p className="text-sm text-primary font-medium">{exp.company}</p>
                              </div>
                              <Badge variant="secondary" className={`text-[10px] shrink-0 ${config.bgColor} ${config.textColor}`}>
                                {config.label}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
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

                            {/* Relevance bar */}
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${config.color}`}
                                style={{ 
                                  width: relevance === 'high' ? '100%' : relevance === 'medium' ? '60%' : '25%' 
                                }}
                              />
                            </div>

                            {exp.description && (
                              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                                {exp.description}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState icon={Briefcase} message="No experience data available" />
                )}
              </TabsContent>

              {/* EDUCATION TAB */}
              <TabsContent value="education" className="mt-0">
                {candidate.education && candidate.education.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {candidate.education.map((edu, idx) => (
                      <Card key={idx} className="shadow-sm border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="shrink-0">
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm mb-1">{edu.degree}</h3>
                              <p className="text-sm text-primary font-medium mb-2">{edu.school}</p>
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
                ) : (
                  <EmptyState icon={GraduationCap} message="No education data available" />
                )}
              </TabsContent>

              {/* CERTIFICATIONS TAB */}
              <TabsContent value="certifications" className="mt-0">
                {candidate.certifications && candidate.certifications.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {candidate.certifications.map((cert, idx) => (
                      <Card key={idx} className="shadow-sm border-l-4 border-l-purple-500">
                        <CardContent className="p-3">
                          <h4 className="font-semibold text-sm mb-1">{cert.name}</h4>
                          <p className="text-xs text-purple-600 font-medium mb-1">{cert.issuer}</p>
                          {cert.year && (
                            <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                              {cert.year}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Award} message="No certifications available" />
                )}
              </TabsContent>

              {/* OTHER TAB */}
              <TabsContent value="other" className="mt-0 space-y-6">
                {/* Languages */}
                {candidate.languages && candidate.languages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Languages ({candidate.languages.length})
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {candidate.languages.map((lang, idx) => (
                        <Card key={idx} className="shadow-sm">
                          <CardContent className="p-3 text-center">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                              <Languages className="w-5 h-5 text-amber-600" />
                            </div>
                            <h4 className="font-semibold text-sm">{lang.name}</h4>
                            {lang.level && (
                              <Badge variant="secondary" className="text-xs mt-1">
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
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-3">Additional Information</h3>
                  <div className="space-y-2 text-sm">
                    {candidate.connections && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Network Size</span>
                        <span className="font-medium">{candidate.connections >= 500 ? '500+' : candidate.connections} connections</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Profile Added</span>
                      <span className="font-medium">{new Date(candidate.scrapedAt).toLocaleDateString()}</span>
                    </div>
                    {candidate.scoredAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Last Scored</span>
                        <span className="font-medium">{new Date(candidate.scoredAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

// Score Bar Component
function ScoreBar({ label, score, maxScore, color }: {
  label: string;
  score: number;
  maxScore: number;
  color: string;
}) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{score}/{maxScore}</span>
      </div>
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`absolute inset-y-0 left-0 ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-12">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card className="shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-[1fr_280px] gap-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-48 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}