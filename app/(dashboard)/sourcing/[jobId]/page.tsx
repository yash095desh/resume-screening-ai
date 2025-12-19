"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
// import { Separator } from "@/components/ui/separator";
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
//   Phone,
  MapPin,
  Briefcase,
  Award,
  ExternalLink,
  Filter,
  Trash2,
  AlertCircle,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";

interface Candidate {
  id: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  profileUrl: string;
  photoUrl: string | null;
  currentPosition: string | null;
  currentCompany: string | null;
  skills: string[];
  matchScore: number;
  skillsScore: number;
  experienceScore: number;
  industryScore: number;
  titleScore: number;
  hasContactInfo: boolean;
  isDuplicate: boolean;
  isScored: boolean;
  batchNumber: number;
}

interface JobData {
  id: string;
  title: string;
  status: string;
  totalProfilesFound: number;
  profilesScraped: number;
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

  // Filters
  const [filterScore, setFilterScore] = useState<string>("all");
  const [filterContact, setFilterContact] = useState<string>("all");
  const [filterDuplicate, setFilterDuplicate] = useState<string>("all");

  // Connect to SSE stream for real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource(`/api/sourcing/${jobId}/stream`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          console.log("✅ SSE connected");
        } else if (data.type === "update") {
          setJob((prev) => ({
            ...prev!,
            status: data.status,
            totalProfilesFound: data.progress.totalCandidates,
            profilesScraped: data.progress.scrapedCandidates,
            profilesScored: data.progress.scoredCandidates,
            progress: { percentage: data.progress.percentage },
            candidates: data.candidates,
          }));
          setIsLoading(false);
        } else if (data.type === "complete") {
          console.log("✅ Job completed");
          eventSource?.close();
        } else if (data.type === "error") {
          setError(data.message);
          eventSource?.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error("❌ SSE error:", err);
        eventSource?.close();
        
        // Fallback to polling if SSE fails
        fetchJobData();
      };
    };

    // Initial data fetch
    fetchJobData();
    
    // Connect SSE for real-time updates
    connectSSE();

    return () => {
      eventSource?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Filter candidates
  const filteredCandidates = job?.candidates.filter((candidate) => {
    if (filterScore === "excellent" && candidate.matchScore < 80) return false;
    if (filterScore === "good" && (candidate.matchScore < 60 || candidate.matchScore >= 80))
      return false;
    if (filterScore === "fair" && candidate.matchScore >= 60) return false;

    if (filterContact === "with" && !candidate.hasContactInfo) return false;
    if (filterContact === "without" && candidate.hasContactInfo) return false;

    if (filterDuplicate === "new" && candidate.isDuplicate) return false;
    if (filterDuplicate === "duplicate" && !candidate.isDuplicate) return false;

    return true;
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !job) {
    return (
      <div className="max-w-5xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Job not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isProcessing = !["COMPLETED", "FAILED"].includes(job.status);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sourcing">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <p className="text-gray-600 text-sm mt-1">
              Created {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={job.status} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Sourcing Job?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this job and all {job.candidates.length}{" "}
                  candidates. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
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
      </div>

      {/* Progress Section (shown during processing) */}
      {isProcessing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">
                      {getStatusMessage(job.status)}
                    </p>
                    <p className="text-sm text-blue-700">
                      {job.profilesScored} / {job.totalProfilesFound} candidates processed
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-900">
                  {job.progress.percentage}%
                </span>
              </div>
              <Progress value={job.progress.percentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {job.status === "FAILED" && job.errorMessage && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{job.errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Found</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.totalProfilesFound}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scored</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.profilesScored}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {job.candidates.length > 0
                ? Math.round(
                    job.candidates.reduce((sum, c) => sum + c.matchScore, 0) /
                      job.candidates.length
                  )
                : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">With Contact</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {job.candidates.filter((c) => c.hasContactInfo).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {job.candidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Score Range</label>
                <Select value={filterScore} onValueChange={setFilterScore}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="excellent">Excellent (80-100)</SelectItem>
                    <SelectItem value="good">Good (60-79)</SelectItem>
                    <SelectItem value="fair">Fair (0-59)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Contact Info</label>
                <Select value={filterContact} onValueChange={setFilterContact}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Candidates</SelectItem>
                    <SelectItem value="with">With Contact</SelectItem>
                    <SelectItem value="without">Without Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Duplicates</label>
                <Select value={filterDuplicate} onValueChange={setFilterDuplicate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Candidates</SelectItem>
                    <SelectItem value="new">New Only</SelectItem>
                    <SelectItem value="duplicate">Duplicates Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(filterScore !== "all" ||
              filterContact !== "all" ||
              filterDuplicate !== "all") && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterScore("all");
                    setFilterContact("all");
                    setFilterDuplicate("all");
                  }}
                >
                  Clear Filters
                </Button>
                <span className="text-sm text-gray-600 ml-3">
                  Showing {filteredCandidates?.length} of {job.candidates.length} candidates
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Candidates List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Candidates ({filteredCandidates?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCandidates && filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {job.candidates.length === 0
                  ? "No candidates found yet"
                  : "No candidates match the selected filters"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {filteredCandidates?.map((candidate) => (
                  <CandidateCard key={candidate.id} candidate={candidate} jobId={jobId} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Candidate Card Component
function CandidateCard({ candidate, jobId }: { candidate: Candidate; jobId: string }) {
  return (
    <Link href={`/sourcing/${jobId}/candidates/${candidate.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16">
              <AvatarImage src={candidate.photoUrl || undefined} alt={candidate.fullName} />
              <AvatarFallback className="text-lg bg-linear-to-br from-blue-500 to-purple-500 text-white">
                {candidate.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{candidate.fullName}</h3>
                  {candidate.headline && (
                    <p className="text-sm text-gray-600 mt-1">{candidate.headline}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                    {candidate.currentPosition && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {candidate.currentPosition}
                        {candidate.currentCompany && ` @ ${candidate.currentCompany}`}
                      </span>
                    )}
                    {candidate.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {candidate.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score Badge */}
                <div className="flex flex-col items-end gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <ScoreBadge score={candidate.matchScore} size="large" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-semibold">Score Breakdown:</p>
                          <p>Skills: {candidate.skillsScore}/25</p>
                          <p>Experience: {candidate.experienceScore}/25</p>
                          <p>Industry: {candidate.industryScore}/25</p>
                          <p>Title: {candidate.titleScore}/25</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {candidate.hasContactInfo && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <Mail className="w-3 h-3 mr-1" />
                      Contact
                    </Badge>
                  )}

                  {candidate.isDuplicate && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      Previously Sourced
                    </Badge>
                  )}
                </div>
              </div>

              {/* Skills */}
              {candidate.skills && candidate.skills.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.slice(0, 6).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 6 && (
                      <Badge variant="secondary" className="text-xs">
                        +{candidate.skills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* External Link */}
            <a
              href={candidate.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-blue-600"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Score Badge Component
function ScoreBadge({ score, size = "normal" }: { score: number; size?: "normal" | "large" }) {
  const getColor = () => {
    if (score >= 80) return "bg-green-100 text-green-700 border-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  const sizeClasses = size === "large" ? "text-2xl px-4 py-2" : "text-lg px-3 py-1";

  return (
    <div className={`${getColor()} ${sizeClasses} rounded-lg border-2 font-bold`}>
      {Math.round(score)}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { color: string; label: string; icon: any }> = {
    CREATED: { color: "bg-gray-100 text-gray-700", label: "Created", icon: Clock },
    FORMATTING_JD: { color: "bg-blue-100 text-blue-700", label: "Formatting", icon: Loader2 },
    SEARCHING_PROFILES: { color: "bg-blue-100 text-blue-700", label: "Searching", icon: Loader2 },
    SCRAPING_PROFILES: { color: "bg-purple-100 text-purple-700", label: "Scraping", icon: Loader2 },
    SCORING: { color: "bg-yellow-100 text-yellow-700", label: "Scoring", icon: Loader2 },
    COMPLETED: { color: "bg-green-100 text-green-700", label: "Completed", icon: CheckCircle2 },
    FAILED: { color: "bg-red-100 text-red-700", label: "Failed", icon: XCircle },
  };

  const variant = variants[status] || variants.CREATED;
  const Icon = variant.icon;

  return (
    <Badge className={`${variant.color} flex items-center gap-1`} variant="secondary">
      <Icon className={`w-4 h-4 ${status === "COMPLETED" || status === "FAILED" ? "" : "animate-spin"}`} />
      {variant.label}
    </Badge>
  );
}

// Status message helper
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    CREATED: "Initializing...",
    FORMATTING_JD: "Analyzing job description with AI...",
    SEARCHING_PROFILES: "Searching LinkedIn for matching profiles...",
    SCRAPING_PROFILES: "Extracting candidate details from LinkedIn...",
    SCORING: "AI is scoring candidates...",
    COMPLETED: "Processing complete!",
    FAILED: "Processing failed",
  };
  return messages[status] || "Processing...";
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}