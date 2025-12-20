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
  // Award,
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
  Sparkles,
  Target,
  // ChevronDown,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";

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
  experienceYears: number | null;
  seniorityLevel: string | null;
  
  skills: Array<{ name: string; endorsements?: number }>;
  matchedSkills: string[] | null;
  missingSkills: string[] | null;
  bonusSkills: string[] | null;
  
  matchScore: number;
  skillsScore: number;
  experienceScore: number;
  industryScore: number;
  titleScore: number;
  niceToHaveScore: number;
  
  email: string | null;
  phone: string | null;
  hasContactInfo: boolean;
  
  connections: number | null;
  followers: number | null;
  isPremium: boolean;
  isOpenToWork: boolean;
  
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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScore, setFilterScore] = useState<string>("all");
  const [filterSeniority, setFilterSeniority] = useState<string>("all");
  const [filterContact, setFilterContact] = useState<string>("all");
  const [filterOpenToWork, setFilterOpenToWork] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("score-desc");

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

      eventSource.onerror = () => {
        eventSource?.close();
        fetchJobData();
      };
    };

    fetchJobData();
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

  // Filter and sort candidates
  const getFilteredAndSortedCandidates = () => {
    if (!job) return [];

    const filtered = job.candidates.filter((candidate) => {
      // Search filter
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

      // Score filter
      if (filterScore === "excellent" && candidate.matchScore < 90) return false;
      if (filterScore === "strong" && (candidate.matchScore < 75 || candidate.matchScore >= 90)) return false;
      if (filterScore === "good" && (candidate.matchScore < 60 || candidate.matchScore >= 75)) return false;
      if (filterScore === "fair" && candidate.matchScore >= 60) return false;

      // Seniority filter
      if (filterSeniority !== "all" && candidate.seniorityLevel !== filterSeniority) return false;

      // Contact filter
      if (filterContact === "with" && !candidate.hasContactInfo) return false;
      if (filterContact === "without" && candidate.hasContactInfo) return false;

      // Open to work filter
      if (filterOpenToWork === "yes" && !candidate.isOpenToWork) return false;
      if (filterOpenToWork === "no" && candidate.isOpenToWork) return false;

      return true;
    });

    // Sort candidates
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
                          filterContact !== "all" || filterOpenToWork !== "all" || sortBy !== "score-desc";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterScore("all");
    setFilterSeniority("all");
    setFilterContact("all");
    setFilterOpenToWork("all");
    setSortBy("score-desc");
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !job) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Job not found"}</AlertDescription>
        </Alert>
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
  const openToWork = job.candidates.filter(c => c.isOpenToWork).length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
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
            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Created {new Date(job.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={job.status} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDeleting} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Sourcing Job?</AlertDialogTitle>
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
      </div>

      {/* Progress Section */}
      {isProcessing && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {getStatusMessage(job.status)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {job.profilesScored} / {job.totalProfilesFound} candidates processed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {job.progress.percentage}%
                  </div>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
              <Progress value={job.progress.percentage} className="h-2.5" />
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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={Users}
          label="Total Candidates"
          value={job.totalProfilesFound}
          color="blue"
        />
        <StatsCard
          icon={Star}
          label="Excellent Matches"
          value={excellentMatches}
          subtitle={strongMatches > 0 ? `+${strongMatches} strong` : undefined}
          color="green"
        />
        <StatsCard
          icon={TrendingUp}
          label="Average Score"
          value={Math.round(avgScore)}
          suffix="/100"
          color="purple"
        />
        <StatsCard
          icon={Mail}
          label="Contact Available"
          value={withContact}
          subtitle={openToWork > 0 ? `${openToWork} open to work` : undefined}
          color="orange"
        />
      </div>

      {/* Filters & Search */}
      {job.candidates.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter & Search
              </CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, title, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score-desc">Highest Score First</SelectItem>
                  <SelectItem value="score-asc">Lowest Score First</SelectItem>
                  <SelectItem value="experience-desc">Most Experience</SelectItem>
                  <SelectItem value="experience-asc">Least Experience</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterScore} onValueChange={setFilterScore}>
                <SelectTrigger>
                  <SelectValue placeholder="Score Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="excellent">Excellent (90-100)</SelectItem>
                  <SelectItem value="strong">Strong (75-89)</SelectItem>
                  <SelectItem value="good">Good (60-74)</SelectItem>
                  <SelectItem value="fair">Fair (0-59)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeniority} onValueChange={setFilterSeniority}>
                <SelectTrigger>
                  <SelectValue placeholder="Seniority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Entry">Entry Level</SelectItem>
                  <SelectItem value="Mid">Mid Level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterContact} onValueChange={setFilterContact}>
                <SelectTrigger>
                  <SelectValue placeholder="Contact Info" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Candidates</SelectItem>
                  <SelectItem value="with">With Contact</SelectItem>
                  <SelectItem value="without">Without Contact</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterOpenToWork} onValueChange={setFilterOpenToWork}>
                <SelectTrigger>
                  <SelectValue placeholder="Open to Work" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Candidates</SelectItem>
                  <SelectItem value="yes">Open to Work</SelectItem>
                  <SelectItem value="no">Not Open</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredCandidates.length}</span> of{" "}
                <span className="font-semibold text-foreground">{job.candidates.length}</span> candidates
              </p>
              {hasActiveFilters && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {Object.values({searchQuery, filterScore, filterSeniority, filterContact, filterOpenToWork, sortBy}).filter(v => v && v !== "all" && v !== "score-desc").length} filters active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidates List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="w-5 h-5" />
            Candidates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {job.candidates.length === 0 ? "No candidates yet" : "No matches found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {job.candidates.length === 0
                  ? "Candidates will appear here as they're processed"
                  : "Try adjusting your filters or search query"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[700px] pr-4">
              <div className="space-y-3">
                {filteredCandidates.map((candidate) => (
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

// Enhanced Candidate Card
function CandidateCard({ candidate, jobId }: { candidate: Candidate; jobId: string }) {
  return (
    <Link href={`/sourcing/${jobId}/candidates/${candidate.id}`}>
      <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar with Status Indicators */}
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 border-2 border-background shadow-sm">
                <AvatarImage src={candidate.photoUrl || undefined} alt={candidate.fullName} />
                <AvatarFallback className="text-lg font-semibold bg-linear-to-br from-blue-500 to-purple-500 text-white">
                  {candidate.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {candidate.isPremium && (
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
                  <Star className="w-3.5 h-3.5 text-white fill-white" />
                </div>
              )}
              {candidate.isOpenToWork && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                      {candidate.fullName}
                    </h3>
                    {candidate.seniorityLevel && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {candidate.seniorityLevel}
                      </Badge>
                    )}
                  </div>
                  {candidate.headline && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {candidate.headline}
                    </p>
                  )}
                </div>

                {/* Score Badge */}
                <ScoreBadge score={candidate.matchScore} />
              </div>

              {/* Current Role */}
              {(candidate.currentPosition || candidate.currentCompany) && (
                <div className="flex items-center gap-2 text-sm">
                  {candidate.currentCompanyLogo ? (
                    <img 
                      src={candidate.currentCompanyLogo} 
                      alt={candidate.currentCompany || ""}
                      className="w-5 h-5 rounded object-contain"
                    />
                  ) : (
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-medium text-foreground truncate">
                    {candidate.currentPosition}
                    {candidate.currentPosition && candidate.currentCompany && " @ "}
                    {candidate.currentCompany}
                  </span>
                </div>
              )}

              {/* Meta Info Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {candidate.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {candidate.location}
                  </span>
                )}
                {candidate.experienceYears && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    {candidate.experienceYears} years
                  </span>
                )}
                {candidate.connections && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {candidate.connections.toLocaleString()} connections
                  </span>
                )}
              </div>

              {/* Skills Matching Section */}
              {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-medium text-green-700">
                      {candidate.matchedSkills.length} required skills matched
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.matchedSkills.slice(0, 5).map((skill, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="text-xs bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {candidate.matchedSkills.length > 5 && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        +{candidate.matchedSkills.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Bonus Skills */}
              {candidate.bonusSkills && candidate.bonusSkills.length > 0 && (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs text-purple-700">
                    +{candidate.bonusSkills.length} bonus skills
                  </span>
                </div>
              )}

              {/* Bottom Row - Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {candidate.hasContactInfo && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                    <Mail className="w-3 h-3 mr-1" />
                    Contact Available
                  </Badge>
                )}
                {candidate.email && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                    <Mail className="w-3 h-3 mr-1" />
                    Email
                  </Badge>
                )}
                {candidate.phone && (
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-xs">
                    <Phone className="w-3 h-3 mr-1" />
                    Phone
                  </Badge>
                )}
                {candidate.isOpenToWork && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs font-medium">
                    <Target className="w-3 h-3 mr-1" />
                    Open to Work
                  </Badge>
                )}
                {candidate.isDuplicate && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                    Previously Sourced
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
              className="text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Stats Card Component
function StatsCard({
  icon: Icon,
  label,
  value,
  subtitle,
  suffix,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  subtitle?: string;
  suffix?: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "from-blue-500/10 to-blue-600/10 text-blue-600",
    green: "from-green-500/10 to-green-600/10 text-green-600",
    purple: "from-purple-500/10 to-purple-600/10 text-purple-600",
    orange: "from-orange-500/10 to-orange-600/10 text-orange-600",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className={`h-10 w-10 rounded-lg bg-linear-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {value.toLocaleString()}
          {suffix && <span className="text-lg text-muted-foreground ml-1">{suffix}</span>}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced Score Badge
function ScoreBadge({ score }: { score: number }) {
  const getScoreConfig = () => {
    if (score >= 90) return { 
      bg: "bg-gradient-to-br from-green-500 to-emerald-600", 
      text: "text-white",
      label: "Excellent"
    };
    if (score >= 75) return { 
      bg: "bg-gradient-to-br from-blue-500 to-blue-600", 
      text: "text-white",
      label: "Strong"
    };
    if (score >= 60) return { 
      bg: "bg-gradient-to-br from-yellow-500 to-orange-500", 
      text: "text-white",
      label: "Good"
    };
    return { 
      bg: "bg-gradient-to-br from-gray-400 to-gray-500", 
      text: "text-white",
      label: "Fair"
    };
  };

  const config = getScoreConfig();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-center shrink-0">
            <div className={`${config.bg} ${config.text} rounded-xl px-4 py-2 shadow-md min-w-[70px]`}>
              <div className="text-2xl font-bold leading-none">{Math.round(score)}</div>
              <div className="text-[10px] font-medium opacity-90 mt-0.5">{config.label}</div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="text-xs">Match Score: {Math.round(score)}/100</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { color: string; label: string; icon: any }> = {
    CREATED: { color: "bg-gray-100 text-gray-700", label: "Created", icon: Clock },
    FORMATTING_JD: { color: "bg-blue-100 text-blue-700", label: "Analyzing", icon: Loader2 },
    SEARCHING_PROFILES: { color: "bg-purple-100 text-purple-700", label: "Searching", icon: Loader2 },
    SCRAPING_PROFILES: { color: "bg-indigo-100 text-indigo-700", label: "Scraping", icon: Loader2 },
    SCORING: { color: "bg-amber-100 text-amber-700", label: "Scoring", icon: Loader2 },
    COMPLETED: { color: "bg-green-100 text-green-700", label: "Completed", icon: CheckCircle2 },
    FAILED: { color: "bg-red-100 text-red-700", label: "Failed", icon: XCircle },
  };

  const variant = variants[status] || variants.CREATED;
  const Icon = variant.icon;
  const isAnimated = !["COMPLETED", "FAILED"].includes(status);

  return (
    <Badge className={`${variant.color} flex items-center gap-1.5 px-3 py-1`} variant="secondary">
      <Icon className={`w-4 h-4 ${isAnimated ? "animate-spin" : ""}`} />
      <span className="font-medium">{variant.label}</span>
    </Badge>
  );
}

// Status Messages
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    CREATED: "Initializing pipeline...",
    FORMATTING_JD: "Analyzing job requirements with AI...",
    SEARCHING_PROFILES: "Searching LinkedIn for matching candidates...",
    SCRAPING_PROFILES: "Extracting detailed candidate information...",
    SCORING: "AI is evaluating candidate fit...",
    COMPLETED: "All candidates processed successfully!",
    FAILED: "Processing encountered an error",
  };
  return messages[status] || "Processing...";
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}