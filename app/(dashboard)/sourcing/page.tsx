import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Loader2,
  AlertCircle,
  Calendar,
  Target,
  Mail,
  SearchX,
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SourcingJobsPage() {
  const { userId } = await auth();

  const jobs = await prisma.sourcingJob.findMany({
    where: { userId: userId! },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      currentStage: true,
      totalProfilesFound: true,
      profilesScraped: true,
      profilesScored: true,
      createdAt: true,
      completedAt: true,
      errorMessage: true,
      _count: {
        select: {
          candidates: true
        },
      },
      candidates: {
        where: { isScored: true },
        select: {
          matchScore: true,
          hasContactInfo: true,
        },
      },
    },
  });

  // Calculate aggregate stats
  const totalCandidates = jobs.reduce((sum, job) => sum + job._count.candidates, 0);
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED").length;
  const avgScore = jobs.reduce((sum, job) => {
    const jobAvg = job.candidates.length > 0
      ? job.candidates.reduce((s, c) => s + c.matchScore, 0) / job.candidates.length
      : 0;
    return sum + jobAvg;
  }, 0) / (jobs.length || 1);
  const candidatesWithContact = jobs.reduce(
    (sum, job) => sum + job.candidates.filter((c) => c.hasContactInfo).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            AI Sourcing Jobs
          </h2>
          <p className="text-muted-foreground mt-1">
            Automatically find and score top candidates for your roles
          </p>
        </div>
        <Link href="/sourcing/new">
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            New Sourcing Job
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedJobs} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgScore)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of 100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">With Contact Info</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidatesWithContact}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCandidates > 0
                ? `${Math.round((candidatesWithContact / totalCandidates) * 100)}% of total`
                : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No sourcing jobs yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first sourcing job to automatically find and score candidates
              matching your job description
            </p>
            <Link href="/sourcing/new">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create First Job
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const avgJobScore = job.candidates.length > 0
              ? Math.round(
                  job.candidates.reduce((sum, c) => sum + c.matchScore, 0) / job.candidates.length
                )
              : 0;
            const withContact = job.candidates.filter((c) => c.hasContactInfo).length;

            return (
              <Link key={job.id} href={`/sourcing/${job.id}`}>
                <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary mb-1">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left Section */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                              {job.title.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">{job.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(job.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              {job.completedAt && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Completed {new Date(job.completedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Candidates</p>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{job._count.candidates}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {avgJobScore > 0 ? avgJobScore : "—"}
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Contact Info</p>
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{withContact}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Progress</p>
                            <div className="flex items-center gap-1.5">
                              <Target className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {job.profilesScored}/{job.totalProfilesFound}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Error Message */}
                        {job.status === "FAILED" && job.errorMessage && (
                          job.currentStage === "NO_CANDIDATES_FOUND" ? (
                            <div className="mt-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
                              <p className="text-xs text-amber-700 dark:text-amber-300">
                                No matching candidates found. Try adjusting job requirements and retry.
                              </p>
                            </div>
                          ) : (
                            <Alert variant="destructive" className="mt-3">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Something went wrong during sourcing. Click to view details and retry.
                              </AlertDescription>
                            </Alert>
                          )
                        )}
                      </div>

                      {/* Right Section - Status */}
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={job.status} currentStage={job.currentStage} />

                        {job.status === "COMPLETED" && avgJobScore > 0 && (
                          <Badge
                            variant="secondary"
                            className={
                              avgJobScore >= 80
                                ? "bg-primary/10 text-primary"
                                : avgJobScore >= 60
                                ? "bg-secondary text-secondary-foreground"
                                : "bg-destructive/10 text-destructive"
                            }
                          >
                            {avgJobScore >= 80 ? "Excellent" : avgJobScore >= 60 ? "Good" : "Fair"} Match
                          </Badge>
                        )}

                        {job.status !== "COMPLETED" && job.status !== "FAILED" && (
                          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                            {Math.round((job.profilesScored / (job.totalProfilesFound || 1)) * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, currentStage }: { status: string; currentStage?: string | null }) {
  const variants: Record<string, { color: string; label: string; icon: any }> = {
    CREATED: {
      color: "bg-muted text-muted-foreground border-border",
      label: "Created",
      icon: Clock
    },
    FORMATTING_JD: {
      color: "bg-secondary text-secondary-foreground border-border",
      label: "Formatting",
      icon: Loader2
    },
    SEARCHING_PROFILES: {
      color: "bg-secondary text-secondary-foreground border-border",
      label: "Searching",
      icon: Loader2
    },
    SCRAPING_PROFILES: {
      color: "bg-secondary text-secondary-foreground border-border",
      label: "Scraping",
      icon: Loader2
    },
    SCORING: {
      color: "bg-secondary text-secondary-foreground border-border",
      label: "Scoring",
      icon: Loader2
    },
    COMPLETED: {
      color: "bg-primary/10 text-primary border-primary/20",
      label: "Completed",
      icon: CheckCircle2
    },
    FAILED: {
      color: "bg-destructive/10 text-destructive border-destructive/20",
      label: "Failed",
      icon: XCircle
    },
  };

  // Override for "no candidates" — show amber "No Results" instead of red "Failed"
  if (status === 'FAILED' && currentStage === 'NO_CANDIDATES_FOUND') {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800 border flex items-center gap-1.5 px-3 py-1">
        <SearchX className="w-3.5 h-3.5" />
        No Results
      </Badge>
    );
  }

  const variant = variants[status] || variants.CREATED;
  const Icon = variant.icon;
  const isProcessing = !["COMPLETED", "FAILED", "CREATED"].includes(status);

  return (
    <Badge className={`${variant.color} border flex items-center gap-1.5 px-3 py-1`}>
      <Icon className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
      {variant.label}
    </Badge>
  );
}
