"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ExternalLink,
  Filter,
  Trash2,
  AlertCircle,
  TrendingUp,
  Users,
  Clock,
  Search,
  Star,
  Building2,
  Target,
  X,
  RefreshCw,
  Award,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Candidate {
  id: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  profileUrl: string;
  photoUrl: string | null;
  
  currentPosition: string | null;
  currentCompany: string | null;
  currentCompanyLogo: string | null;
  experienceYears: number | null;
  seniorityLevel: string | null;
  
  matchedSkills: string[] | null;
  missingSkills: string[] | null;
  bonusSkills: string[] | null;
  
  matchScore: number;
  skillsScore: number;
  experienceScore: number;
  
  email: string | null;
  phone: string | null;
  hasContactInfo: boolean;
  
  isOpenToWork: boolean;
  isDuplicate: boolean;
}

interface JobData {
  id: string;
  title: string;
  status: string;
  currentStage?: string;
  totalProfilesFound: number;
  profilesScored: number;
  createdAt: string;
  errorMessage: string | null;
  progress: {
    percentage: number;
  };
  candidates: Candidate[];
}

export default function SourcingJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScore, setFilterScore] = useState<string>("all");
  const [filterSeniority, setFilterSeniority] = useState<string>("all");
  const [filterContact, setFilterContact] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("score-desc");

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource(`/api/sourcing/${jobId}/stream`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "update") {
          setJob((prev) => ({
            ...prev!,
            status: data.status,
            currentStage: data.currentStage,
            totalProfilesFound: data.progress?.totalFound || prev?.totalProfilesFound || 0,
            profilesScored: data.progress?.scored || prev?.profilesScored || 0,
            progress: {
              percentage: data.progress?.percentage || 0,
            },
            candidates: data.candidates || prev?.candidates || [],
          }));
          setIsLoading(false);
        } else if (data.type === "complete") {
          eventSource?.close();
          fetchJobData();
        } else if (data.type === "error") {
          setError(data.message);
          setIsLoading(false);
          eventSource?.close();
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        setTimeout(fetchJobData, 5000);
      };
    };

    fetchJobData();
    connectSSE();

    return () => {
      eventSource?.close();
    };
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      const response = await fetch(`/api/sourcing/${jobId}?include=candidates`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch job");
      }

      setJob(data);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sourcing/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      router.push("/sourcing");
    } catch (err: any) {
      alert(err.message);
      setIsDeleting(false);
    }
  };

  const handleRetry = async () => {
    try {
      setError(null);
      
      const response = await fetch(`/api/sourcing/${jobId}/resume`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to resume job");
      }

      fetchJobData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter and sort candidates
  const getFilteredAndSortedCandidates = () => {
    if (!job) return [];

    const filtered = job.candidates.filter((candidate) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = candidate.fullName.toLowerCase().includes(query);
        const matchesHeadline = candidate.headline?.toLowerCase().includes(query);
        const matchesCompany = candidate.currentCompany?.toLowerCase().includes(query);
        const matchesPosition = candidate.currentPosition?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesHeadline && !matchesCompany && !matchesPosition) {
          return false;
        }
      }

      if (filterScore === "excellent" && candidate.matchScore < 90) return false;
      if (filterScore === "strong" && (candidate.matchScore < 75 || candidate.matchScore >= 90)) return false;
      if (filterScore === "good" && (candidate.matchScore < 60 || candidate.matchScore >= 75)) return false;
      if (filterScore === "fair" && candidate.matchScore >= 60) return false;

      if (filterSeniority !== "all" && candidate.seniorityLevel !== filterSeniority) return false;

      if (filterContact === "with" && !candidate.hasContactInfo) return false;
      if (filterContact === "without" && candidate.hasContactInfo) return false;

      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score-desc":
          return b.matchScore - a.matchScore;
        case "score-asc":
          return a.matchScore - b.matchScore;
        case "experience-desc":
          return (b.experienceYears || 0) - (a.experienceYears || 0);
        case "experience-asc":
          return (a.experienceYears || 0) - (b.experienceYears || 0);
        case "name-asc":
          return a.fullName.localeCompare(b.fullName);
        case "name-desc":
          return b.fullName.localeCompare(a.fullName);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredCandidates = getFilteredAndSortedCandidates();

  const hasActiveFilters = searchQuery || filterScore !== "all" || filterSeniority !== "all" || 
                          filterContact !== "all" || sortBy !== "score-desc";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterScore("all");
    setFilterSeniority("all");
    setFilterContact("all");
    setSortBy("score-desc");
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error || "Job not found"}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="ml-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const isProcessing = !["COMPLETED", "FAILED"].includes(job.status);

  // Calculate stats
  const avgScore = job.candidates.length > 0
    ? job.candidates.reduce((sum, c) => sum + c.matchScore, 0) / job.candidates.length
    : 0;
  const excellentMatches = job.candidates.filter(c => c.matchScore >= 90).length;
  const strongMatches = job.candidates.filter(c => c.matchScore >= 75 && c.matchScore < 90).length;
  const withContact = job.candidates.filter(c => c.hasContactInfo).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Compact Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <Link href="/sourcing">
              <Button variant="ghost" size="sm" className="text-muted-foreground h-8">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Back
              </Button>
            </Link>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={isDeleting}
                  className="text-muted-foreground hover:text-destructive h-8"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Job?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this job and all {job.candidates.length} candidates. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Job"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold mb-0.5">{job.title}</h1>
              <p className="text-xs text-muted-foreground">
                {new Date(job.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>

            {isProcessing && (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-muted rounded-md">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {getSimpleStatusMessage(job.status)}
                </span>
              </div>
            )}

            {job.status === "COMPLETED" && (
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-xs h-6">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}

            {job.status === "FAILED" && (
              <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 text-xs h-6">
                <XCircle className="w-3 h-3 mr-1" />
                Failed
              </Badge>
            )}
          </div>
        </div>

        {/* Compact Progress Bar */}
        {isProcessing && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {job.profilesScored} of {job.totalProfilesFound} processed
              </span>
              <span className="text-xs font-medium">{job.progress.percentage}%</span>
            </div>
            <Progress value={job.progress.percentage} className="h-1" />
          </div>
        )}

        {/* Error Alert */}
        {job.status === "FAILED" && job.errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="flex items-center justify-between text-xs">
              <span>{job.errorMessage}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="h-7"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground">Total Found</span>
                <Users className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-xl font-semibold">{job.totalProfilesFound}</div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground">Top Matches</span>
                <Award className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-semibold">{excellentMatches}</span>
                {strongMatches > 0 && (
                  <span className="text-[10px] text-muted-foreground">+{strongMatches}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground">Avg Score</span>
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-semibold">{Math.round(avgScore)}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground">Contact Info</span>
                <Mail className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-xl font-semibold">{withContact}</div>
            </CardContent>
          </Card>
        </div>

        {/* Compact Filters */}
        {job.candidates.length > 0 && (
          <Card className="border-muted mb-4">
            <CardContent className="p-3">
              <div className="space-y-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search candidates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-4 gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score-desc">Highest Score</SelectItem>
                      <SelectItem value="score-asc">Lowest Score</SelectItem>
                      <SelectItem value="experience-desc">Most Experience</SelectItem>
                      <SelectItem value="experience-asc">Least Experience</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterScore} onValueChange={setFilterScore}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Scores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="excellent">90-100</SelectItem>
                      <SelectItem value="strong">75-89</SelectItem>
                      <SelectItem value="good">60-74</SelectItem>
                      <SelectItem value="fair">Below 60</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterSeniority} onValueChange={setFilterSeniority}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="Entry">Entry</SelectItem>
                      <SelectItem value="Mid">Mid</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterContact} onValueChange={setFilterContact}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Contact Info" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="with">With Contact</SelectItem>
                      <SelectItem value="without">No Contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Results Count */}
                {hasActiveFilters && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-[10px] text-muted-foreground">
                      Showing {filteredCandidates.length} of {job.candidates.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-6 text-[10px]"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Candidates List */}
        {filteredCandidates.length === 0 ? (
          <Card className="border-muted shadow-sm">
            <CardContent className="py-20">
              <div className="text-center">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <h3 className="text-sm font-medium mb-1">
                  {job.candidates.length === 0 ? "No candidates yet" : "No matches found"}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {job.candidates.length === 0
                    ? "Candidates will appear as they're processed"
                    : "Try adjusting your search or filters"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="h-7 text-xs">
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredCandidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} jobId={jobId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Candidate Card with larger fonts and prominent score
function CandidateCard({ candidate, jobId }: { candidate: Candidate; jobId: string }) {
  return (
    <Link href={`/sourcing/${jobId}/candidates/${candidate.id}`}>
      <Card className="border-muted hover:border-primary/40 transition-all cursor-pointer group shadow-sm hover:shadow-md mb-1">
        <CardContent className="p-3.5">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={candidate.photoUrl || undefined} alt={candidate.fullName} />
              <AvatarFallback className="text-sm bg-muted font-medium">
                {candidate.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Name & Score */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                    {candidate.fullName}
                  </h3>
                  {candidate.headline && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {candidate.headline}
                    </p>
                  )}
                </div>

                {/* Prominent Score with Primary Color */}
                <div className="flex flex-col items-center shrink-0 bg-primary/10 rounded-lg px-3 py-2">
                  <div className="text-2xl font-bold text-primary leading-none">
                    {Math.round(candidate.matchScore)}
                  </div>
                  <div className="text-[9px] text-primary/70 mt-0.5 font-medium">SCORE</div>
                </div>
              </div>

              {/* Current Role */}
              {(candidate.currentPosition || candidate.currentCompany) && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground truncate font-medium">
                    {candidate.currentPosition}
                    {candidate.currentPosition && candidate.currentCompany && " at "}
                    {candidate.currentCompany}
                  </span>
                </div>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {candidate.location && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {candidate.location}
                  </span>
                )}
                {candidate.experienceYears && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Briefcase className="w-3 h-3" />
                    {candidate.experienceYears} years
                  </span>
                )}
                {candidate.seniorityLevel && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {candidate.seniorityLevel}
                  </Badge>
                )}
              </div>

              {/* Skills */}
              {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {candidate.matchedSkills.slice(0, 4).map((skill, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-[10px] h-5 px-2 bg-green-50 text-green-700 border-green-200 font-medium"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {candidate.matchedSkills.length > 4 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-muted">
                      +{candidate.matchedSkills.length - 4}
                    </Badge>
                  )}
                </div>
              )}

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                {candidate.hasContactInfo && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-2">
                    <Mail className="w-2.5 h-2.5 mr-1" />
                    Contact
                  </Badge>
                )}
                {candidate.isOpenToWork && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-blue-50 text-blue-700 border-blue-200">
                    <Target className="w-2.5 h-2.5 mr-1" />
                    Open
                  </Badge>
                )}
              </div>
            </div>

            {/* External Link */}
            <a
              href={candidate.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Simplified status messages
function getSimpleStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    CREATED: "Starting...",
    FORMATTING_JD: "Analyzing...",
    SEARCHING_PROFILES: "Finding...",
    SCRAPING_PROFILES: "Collecting...",
    PARSING_PROFILES: "Processing...",
    SAVING_PROFILES: "Saving...",
    SCORING_PROFILES: "Evaluating...",
  };
  
  return messages[status] || "Processing...";
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="mb-4">
          <Skeleton className="h-7 w-64 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
        
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-muted">
              <CardContent className="p-3">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-6 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-muted shadow-sm">
              <CardContent className="p-3.5">
                <div className="flex gap-3">
                  <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}