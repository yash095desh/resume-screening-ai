"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  MapPin,
  Briefcase,
  ExternalLink,
  Trash2,
  AlertCircle,
  TrendingUp,
  Users,
  Search,
  Building2,
  Target,
  X,
  RefreshCw,
  Award,
  Eye,
  FileText,
  Calculator,
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
  profilesScraped: number;
  profilesParsed: number;
  profilesSaved: number;
  profilesScored: number;
  createdAt: string;
  errorMessage: string | null;
  lastActivityAt?: string;

  // Rate limit fields
  rateLimitHitAt?: string;
  rateLimitResetAt?: string;
  rateLimitService?: string;

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
    let reconnectAttempts = 0;
    const maxReconnects = 3;

    const connectSSE = () => {
      // Don't connect SSE if job is in terminal or rate-limited state
      if (job && ["COMPLETED", "FAILED", "RATE_LIMITED"].includes(job.status)) {
        console.log(
          "Job in terminal/rate-limited state, skipping SSE connection"
        );
        return;
      }

      eventSource = new EventSource(`/api/sourcing/${jobId}/stream`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("SSE Update received:", data);

        if (data.type === "connected") {
          console.log("SSE connected successfully");
          reconnectAttempts = 0;
        } else if (data.type === "update") {
          setJob((prev) => {
            const updated = {
              ...prev!,
              status: data.status,
              currentStage: data.currentStage,
              totalProfilesFound:
                data.progress?.totalFound ?? prev?.totalProfilesFound ?? 0,
              profilesScraped:
                data.progress?.scraped ?? prev?.profilesScraped ?? 0,
              profilesParsed:
                data.progress?.parsed ?? prev?.profilesParsed ?? 0,
              profilesSaved: data.progress?.saved ?? prev?.profilesSaved ?? 0,
              profilesScored:
                data.progress?.scored ?? prev?.profilesScored ?? 0,
              progress: {
                percentage:
                  data.progress?.percentage ?? prev?.progress?.percentage ?? 0,
              },
              candidates: data.candidates || prev?.candidates || [],
              lastActivityAt: data.lastActivityAt || prev?.lastActivityAt,
              errorMessage: data.errorMessage || prev?.errorMessage,
              rateLimitHitAt: data.rateLimitHitAt || prev?.rateLimitHitAt,
              rateLimitResetAt: data.rateLimitResetAt || prev?.rateLimitResetAt,
              rateLimitService: data.rateLimitService || prev?.rateLimitService,
            };
            return updated;
          });
          setIsLoading(false);
        } else if (data.type === "rate_limited") {
          console.log("Job rate limited:", data);
          setJob((prev) => ({
            ...prev!,
            status: "RATE_LIMITED",
            errorMessage:
              data.message || prev?.errorMessage || "Rate limit reached",
            rateLimitHitAt: data.hitAt,
            rateLimitResetAt: data.resetAt,
            rateLimitService: data.service,
          }));
          setIsLoading(false);
          eventSource?.close();
        } else if (data.type === "complete") {
          console.log("Job complete, closing SSE and fetching final data");
          eventSource?.close();
          fetchJobData();
        } else if (data.type === "error") {
          console.error("SSE Error:", data.message);
          setError(data.message);
          setIsLoading(false);
          eventSource?.close();
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        eventSource?.close();

        reconnectAttempts++;
        if (reconnectAttempts <= maxReconnects) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          console.log(
            `Reconnecting SSE in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnects})`
          );
          setTimeout(() => {
            fetchJobData();
            connectSSE();
          }, delay);
        } else {
          console.log(
            "Max reconnect attempts reached, falling back to polling"
          );
          const pollInterval = setInterval(() => {
            fetchJobData().then((data) => {
              if (
                data &&
                ["COMPLETED", "FAILED", "RATE_LIMITED"].includes(data.status)
              ) {
                clearInterval(pollInterval);
              }
            });
          }, 5000);
        }
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
      return data;
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
      setIsLoading(true);

      const response = await fetch(`/api/sourcing/${jobId}/retry`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to retry job");
      }

      console.log("Job retry initiated:", data);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Filter and sort candidates
  const getFilteredAndSortedCandidates = () => {
    if (!job) return [];

    const filtered = job.candidates.filter((candidate) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = candidate.fullName.toLowerCase().includes(query);
        const matchesHeadline = candidate.headline
          ?.toLowerCase()
          .includes(query);
        const matchesCompany = candidate.currentCompany
          ?.toLowerCase()
          .includes(query);
        const matchesPosition = candidate.currentPosition
          ?.toLowerCase()
          .includes(query);

        if (
          !matchesName &&
          !matchesHeadline &&
          !matchesCompany &&
          !matchesPosition
        ) {
          return false;
        }
      }

      if (filterScore === "excellent" && candidate.matchScore < 90)
        return false;
      if (
        filterScore === "strong" &&
        (candidate.matchScore < 75 || candidate.matchScore >= 90)
      )
        return false;
      if (
        filterScore === "good" &&
        (candidate.matchScore < 60 || candidate.matchScore >= 75)
      )
        return false;
      if (filterScore === "fair" && candidate.matchScore >= 60) return false;

      if (
        filterSeniority !== "all" &&
        candidate.seniorityLevel !== filterSeniority
      )
        return false;

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

  const hasActiveFilters =
    searchQuery ||
    filterScore !== "all" ||
    filterSeniority !== "all" ||
    filterContact !== "all" ||
    sortBy !== "score-desc";

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

  const isProcessing = !["COMPLETED", "FAILED", "RATE_LIMITED"].includes(
    job.status
  );

  // Calculate stats
  const avgScore =
    job.candidates.length > 0
      ? job.candidates.reduce((sum, c) => sum + c.matchScore, 0) /
        job.candidates.length
      : 0;
  const excellentMatches = job.candidates.filter(
    (c) => c.matchScore >= 90
  ).length;
  const strongMatches = job.candidates.filter(
    (c) => c.matchScore >= 75 && c.matchScore < 90
  ).length;
  const withContact = job.candidates.filter((c) => c.hasContactInfo).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Compact Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <Link href="/sourcing">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-8"
              >
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
                    This will permanently delete this job and all{" "}
                    {job.candidates.length} candidates. This action cannot be
                    undone.
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
                {new Date(job.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            {isProcessing && job.status !== "RATE_LIMITED" && (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-muted rounded-md">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {getUserFriendlyStatus(job.currentStage || job.status)}
                </span>
              </div>
            )}

            {job.status === "COMPLETED" && (
              <Badge
                variant="secondary"
                className="bg-green-50 text-green-700 border-green-200 text-xs h-6"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}

            {job.status === "FAILED" && (
              <Badge
                variant="secondary"
                className="bg-red-50 text-red-700 border-red-200 text-xs h-6"
              >
                <XCircle className="w-3 h-3 mr-1" />
                Failed
              </Badge>
            )}

            {job.status === "RATE_LIMITED" && (
              <Badge
                variant="secondary"
                className="bg-orange-50 text-orange-700 border-orange-200 text-xs h-6"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                Paused
              </Badge>
            )}
          </div>
        </div>

        {/* Enhanced Progress Bar with Stage Indicator */}
        {isProcessing && job.status !== "RATE_LIMITED" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStageIcon(job.currentStage || job.status)}
                <span className="text-sm font-medium text-foreground">
                  {getUserFriendlyStatus(job.currentStage || job.status)}
                </span>
              </div>
              <span className="text-sm font-semibold text-primary">
                {job.progress.percentage}%
              </span>
            </div>

            <Progress value={job.progress.percentage} className="h-2 mb-2" />

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>{getDetailedProgress(job)}</div>
              <div className="text-right">
                {job.totalProfilesFound > 0 ? (
                  <>
                    Scraped: {job.profilesScraped} | Parsed:{" "}
                    {job.profilesParsed} | Scored: {job.profilesScored}
                  </>
                ) : (
                  "Initializing..."
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Error and Rate-Limited Alert */}
        {(job.status === "FAILED" || job.status === "RATE_LIMITED") &&
          job.errorMessage && (
            <Alert
              variant={
                job.status === "RATE_LIMITED" ? "default" : "destructive"
              }
              className="mb-4"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="font-medium">
                      {job.status === "RATE_LIMITED"
                        ? "Service temporarily paused"
                        : "Job failed"}
                    </div>
                    <div className="text-muted-foreground">
                      {job.errorMessage}
                    </div>

                    {job.status === "RATE_LIMITED" && job.rateLimitResetAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        <RateLimitCountdown resetAt={job.rateLimitResetAt} />
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="h-7 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground">
                  Total Found
                </span>
                <Users className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-xl font-semibold">
                {job.totalProfilesFound}
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground">
                  Top Matches
                </span>
                <Award className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-semibold">
                  {excellentMatches}
                </span>
                {strongMatches > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{strongMatches}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground">
                  Avg Score
                </span>
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-semibold">
                  {Math.round(avgScore)}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground">
                  Contact Info
                </span>
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
                      <SelectItem value="experience-desc">
                        Most Experience
                      </SelectItem>
                      <SelectItem value="experience-asc">
                        Least Experience
                      </SelectItem>
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

                  <Select
                    value={filterSeniority}
                    onValueChange={setFilterSeniority}
                  >
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

                  <Select
                    value={filterContact}
                    onValueChange={setFilterContact}
                  >
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
                      Showing {filteredCandidates.length} of{" "}
                      {job.candidates.length}
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
                  {job.candidates.length === 0
                    ? "No candidates yet"
                    : "No matches found"}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {job.candidates.length === 0
                    ? "Candidates will appear as they're processed"
                    : "Try adjusting your search or filters"}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 text-xs"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                jobId={jobId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Candidate Card with larger fonts and prominent score
function CandidateCard({
  candidate,
  jobId,
}: {
  candidate: Candidate;
  jobId: string;
}) {
  return (
    <Link href={`/sourcing/${jobId}/candidates/${candidate.id}`}>
      <Card className="border-muted hover:border-primary/40 transition-all cursor-pointer group shadow-sm hover:shadow-md mb-1">
        <CardContent className="p-3.5">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage
                src={candidate.photoUrl || undefined}
                alt={candidate.fullName}
              />
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
                  <div className="text-[9px] text-primary/70 mt-0.5 font-medium">
                    SCORE
                  </div>
                </div>
              </div>

              {/* Current Role */}
              {(candidate.currentPosition || candidate.currentCompany) && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground truncate font-medium">
                    {candidate.currentPosition}
                    {candidate.currentPosition &&
                      candidate.currentCompany &&
                      " at "}
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
              {candidate.matchedSkills &&
                candidate.matchedSkills.length > 0 && (
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
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 px-2 bg-muted"
                      >
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
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5 px-2 bg-blue-50 text-blue-700 border-blue-200"
                  >
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

// Rate Limit Countdown Component
function RateLimitCountdown({ resetAt }: { resetAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const resetTime = new Date(resetAt).getTime();
      const now = Date.now();
      const diff = resetTime - now;

      if (diff <= 0) {
        setTimeLeft("Ready to retry now");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`Resumes in ${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`Resumes in ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`Resumes in ${seconds}s`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [resetAt]);

  return <span>{timeLeft}</span>;
}

// User-friendly status messages
function getUserFriendlyStatus(stage: string): string {
  if (stage?.startsWith("SEARCH_ITERATION_")) {
    const match = stage.match(/SEARCH_ITERATION_(\d+)/);
    return match
      ? `Searching for candidates (round ${match[1]})...`
      : "Searching for candidates...";
  }

  if (stage?.startsWith("ENRICHING_")) {
    return "Verifying contact information...";
  }

  if (stage?.startsWith("SCRAPING_BATCH_")) {
    return "Collecting detailed profiles...";
  }

  if (stage?.startsWith("PARSING_BATCH_")) {
    return "Reviewing candidate backgrounds...";
  }

  if (stage?.startsWith("UPDATING_BATCH_")) {
    return "Organizing candidate information...";
  }

  if (stage?.startsWith("SCORED_")) {
    return "Evaluating candidate fit...";
  }

  const messages: Record<string, string> = {
    CREATED: "Getting started...",
    FORMATTING_JD: "Understanding your requirements...",
    JD_FORMATTED: "Requirements ready",
    QUERY_GENERATED: "Preparing search strategy...",
    ENRICHMENT_COMPLETE: "Candidates ready for review",
    SCRAPING_COMPLETE: "Profile collection complete",
    PARSING_COMPLETE: "Background review complete",
    UPDATE_COMPLETE: "Information organized",
    SCORING_COMPLETE: "Evaluation complete",
    PROCESSING: "Working on it...",
    RATE_LIMITED: "Paused - Will resume automatically",
  };

  return messages[stage] || "Processing...";
}

// Get icon for current stage
function getStageIcon(stage: string) {
  const iconClass = "w-4 h-4 text-primary";

  if (stage?.startsWith("SEARCH_") || stage?.startsWith("ENRICHING_")) {
    return <Search className={iconClass} />;
  }

  if (stage?.startsWith("SCRAPING_")) {
    return <Users className={iconClass} />;
  }

  if (stage?.startsWith("PARSING_")) {
    return <Eye className={iconClass} />;
  }

  if (stage?.startsWith("UPDATING_") || stage === "UPDATE_COMPLETE") {
    return <Users className={iconClass} />;
  }

  if (stage?.startsWith("SCORED_") || stage === "SCORING_COMPLETE") {
    return <Calculator className={iconClass} />;
  }

  switch (stage) {
    case "CREATED":
    case "FORMATTING_JD":
    case "JD_FORMATTED":
    case "QUERY_GENERATED":
      return <FileText className={iconClass} />;

    case "ENRICHMENT_COMPLETE":
      return <Mail className={iconClass} />;

    default:
      return <Loader2 className={`${iconClass} animate-spin`} />;
  }
}

function getDetailedProgress(job: JobData): string {
  const stage = job.currentStage || job.status;
  const total = job.totalProfilesFound;

  if (stage?.startsWith("SEARCH_ITERATION_")) {
    return "Looking for professionals who match your criteria";
  }

  if (stage?.startsWith("ENRICHING_")) {
    const match = stage.match(/ENRICHING_(\d+)_OF_(\d+)/);
    return match
      ? `Found ${match[1]} candidates so far, searching for more...`
      : "Checking candidate availability...";
  }

  if (stage === "ENRICHMENT_COMPLETE") {
    return total > 0
      ? `Ready to analyze ${total} qualified candidates`
      : "Candidates ready for analysis";
  }

  if (stage?.startsWith("SCRAPING_BATCH_")) {
    return total > 0
      ? `Gathering details for ${job.profilesScraped} of ${total} candidates`
      : "Collecting candidate information...";
  }

  if (stage === "SCRAPING_COMPLETE") {
    return `Collected information from ${job.profilesScraped} candidates`;
  }

  if (stage?.startsWith("PARSING_BATCH_")) {
    return total > 0
      ? `Reviewing ${job.profilesParsed} of ${total} professional backgrounds`
      : "Reviewing candidate backgrounds...";
  }

  if (stage === "PARSING_COMPLETE") {
    return `Reviewed ${job.profilesParsed} candidate backgrounds`;
  }

  if (stage?.startsWith("UPDATING_BATCH_")) {
    return total > 0
      ? `Organizing information for ${job.profilesSaved} of ${total} candidates`
      : "Organizing candidate information...";
  }

  if (stage === "UPDATE_COMPLETE") {
    return `Information organized for ${job.profilesSaved} candidates`;
  }

  if (stage?.startsWith("SCORED_")) {
    const match = stage.match(/SCORED_(\d+)_OF_(\d+)/);
    return match
      ? `Evaluated fit for ${match[1]} of ${match[2]} candidates`
      : "Evaluating candidate fit...";
  }

  if (stage === "SCORING_COMPLETE") {
    return `Completed evaluation for ${job.profilesScored} candidates`;
  }

  return getUserFriendlyStatus(stage);
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
