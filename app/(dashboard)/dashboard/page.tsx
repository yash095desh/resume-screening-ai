import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Search,
  Mic,
  Mail,
  Briefcase,
  Users,
  Clock,
  MessageCircle,
  CalendarClock,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { CreditCostBadge } from '@/components/credits/CreditCostBadge';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Calculate current timestamp once at the top (for relative time calculations)
  const currentTimestamp = Date.now();

  // ==========================================
  // FETCH STATS FOR ALL 4 FEATURES
  // ==========================================

  // 1. Resume Screening Stats
  const totalJobs = await prisma.job.count({ where: { userId } });
  const totalCandidates = await prisma.candidate.count({
    where: { job: { userId } },
  });
  const completedJobs = await prisma.job.count({
    where: { userId, status: 'completed' },
  });

  // 2. AI Sourcing Stats
  const totalSourcingJobs = await prisma.sourcingJob.count({ where: { userId } });
  const totalSourcedCandidates = await prisma.linkedInCandidate.count({
    where: { sourcingJob: { userId } },
  });
  const completedSourcingJobs = await prisma.sourcingJob.count({
    where: { userId, status: 'COMPLETED' },
  });

  // 3. AI Interview Stats (Note: model is 'interviews' not 'interview')
  const totalInterviews = await prisma.interviews.count({
    where: { userId }
  });
  const completedInterviews = await prisma.interviews.count({
    where: {
      userId,
      status: 'COMPLETED'
    },
  });
  const pendingInterviews = await prisma.interviews.count({
    where: {
      userId,
      status: { in: ['PENDING', 'LINK_SENT', 'LINK_OPENED', 'IN_PROGRESS'] }
    },
  });

  // 4. Email Outreach Stats
  const totalSequences = await prisma.sequence.count({
    where: { userId, isActive: true }
  });
  const totalEnrolled = await prisma.candidateSequence.count({
    where: {
      sequence: { userId },
      status: { in: ['ACTIVE', 'PAUSED'] }
    }
  });
  const totalReplied = await prisma.candidateSequence.count({
    where: { sequence: { userId }, status: 'REPLIED' }
  });

  // ==========================================
  // FETCH RECENT ACTIVITY (FOR TIMELINE)
  // ==========================================

  // Recent screening jobs
  const recentJobs = await prisma.job.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 2,
    select: {
      id: true,
      title: true,
      createdAt: true,
      status: true,
      _count: { select: { candidates: true } },
    },
  });

  // Recent sourcing jobs
  const recentSourcingJobs = await prisma.sourcingJob.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 2,
    select: {
      id: true,
      title: true,
      createdAt: true,
      status: true,
      _count: { select: { candidates: true } },
    },
  });

  // Recent interviews
  const recentInterviews = await prisma.interviews.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 2,
    select: {
      id: true,
      status: true,
      createdAt: true,
      completedAt: true,
      candidates: { select: { name: true } },
      LinkedInCandidate: { select: { fullName: true } },
    },
  });

  // Recent outreach activity
  const recentSequenceActivity = await prisma.candidateSequence.findMany({
    where: {
      sequence: { userId },
      OR: [
        { status: 'REPLIED' },
        { status: 'ACTIVE' },
      ]
    },
    orderBy: { updatedAt: 'desc' },
    take: 2,
    select: {
      id: true,
      status: true,
      updatedAt: true,
      sequence: { select: { name: true } },
      candidate: { select: { name: true } },
      linkedInCandidate: { select: { fullName: true } },
    },
  });

  // Helper function to format relative times (uses currentTimestamp calculated at top)
  function formatRelativeTime(date: Date | null): string {
    if (!date) return 'Recently';
    const seconds = Math.floor((currentTimestamp - new Date(date).getTime()) / 1000);
    if (seconds < 0) return 'Just now'; // Handle future dates
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  // Combine and sort all activity by time, pre-calculating relative times
  const allActivity = [
    ...recentJobs.map(j => ({
      type: 'screening' as const,
      data: j,
      time: j.createdAt,
      relativeTime: formatRelativeTime(j.createdAt)
    })),
    ...recentSourcingJobs.map(j => ({
      type: 'sourcing' as const,
      data: j,
      time: j.createdAt,
      relativeTime: formatRelativeTime(j.createdAt)
    })),
    ...recentInterviews.map(i => ({
      type: 'interview' as const,
      data: i,
      time: i.completedAt || i.createdAt,
      relativeTime: formatRelativeTime(i.completedAt || i.createdAt)
    })),
    ...recentSequenceActivity.map(s => ({
      type: 'outreach' as const,
      data: s,
      time: s.updatedAt,
      relativeTime: formatRelativeTime(s.updatedAt)
    })),
  ]
    .sort((a, b) => {
      const timeA = a.time ? new Date(a.time).getTime() : 0;
      const timeB = b.time ? new Date(b.time).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 6);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Your complete recruitment workflow - from sourcing to hiring
        </p>
      </div>

      {/* ==========================================
          STAGE 1: TALENT ACQUISITION (Top Row)
          ========================================== */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">
          Talent Acquisition
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Resume Screening */}
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <Link href="/jobs/new">
                  <Button size="sm">Create Job</Button>
                </Link>
              </div>
              <CardTitle className="text-xl mt-4">Resume Screening</CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                Upload resumes and get AI-powered matching scores
                <CreditCostBadge feature="SCREENING" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Jobs</span>
                    <span className="text-2xl font-bold">{totalJobs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Candidates Screened</span>
                    <span className="text-2xl font-bold">{totalCandidates}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed Jobs</span>
                    <span className="text-2xl font-bold">{completedJobs}</span>
                  </div>
                </div>
                <Link href="/jobs" className="block">
                  <Button variant="outline" className="w-full">
                    View All Jobs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* AI Sourcing */}
          <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Search className="h-6 w-6 text-purple-600" />
                </div>
                <Link href="/sourcing/new">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Start Sourcing
                  </Button>
                </Link>
              </div>
              <CardTitle className="text-xl mt-4">AI Candidate Sourcing</CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                Find and score top candidates automatically
                <CreditCostBadge feature="SOURCING" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sourcing Jobs</span>
                    <span className="text-2xl font-bold">{totalSourcingJobs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Candidates Found</span>
                    <span className="text-2xl font-bold">{totalSourcedCandidates}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed Jobs</span>
                    <span className="text-2xl font-bold">{completedSourcingJobs}</span>
                  </div>
                </div>
                <Link href="/sourcing" className="block">
                  <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                    View All Sourcing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ==========================================
          STAGE 2: CANDIDATE ENGAGEMENT (Bottom Row)
          ========================================== */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">
          Candidate Engagement
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* AI Interviews */}
          <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-green-600" />
                </div>
                <Link href="/interviews/schedule">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    Schedule
                  </Button>
                </Link>
              </div>
              <CardTitle className="text-xl mt-4">AI-Powered Interviews</CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                Voice interviews with automated analysis and scoring
                <CreditCostBadge feature="INTERVIEW" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Scheduled</span>
                    <span className="text-2xl font-bold">{totalInterviews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="text-2xl font-bold">{completedInterviews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <span className="text-2xl font-bold">{pendingInterviews}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/interviews/tracking" className="block">
                    <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50 text-xs">
                      Track Status
                    </Button>
                  </Link>
                  <Link href="/interviews/results" className="block">
                    <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50 text-xs">
                      View Results
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Outreach */}
          <Card className="border-2 border-orange-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-orange-600" />
                </div>
                <Link href="/outreach/sequences/new">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                    Create Sequence
                  </Button>
                </Link>
              </div>
              <CardTitle className="text-xl mt-4">Email Outreach</CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                Multi-step email campaigns with automated follow-ups
                <CreditCostBadge feature="OUTREACH" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Sequences</span>
                    <span className="text-2xl font-bold">{totalSequences}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Candidates Enrolled</span>
                    <span className="text-2xl font-bold">{totalEnrolled}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Received Replies</span>
                    <span className="text-2xl font-bold">{totalReplied}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/outreach/inbox" className="block">
                    <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 text-xs">
                      View Inbox
                    </Button>
                  </Link>
                  <Link href="/outreach/pipeline" className="block">
                    <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 text-xs">
                      View Pipeline
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ==========================================
          COMBINED OVERVIEW STATS
          ========================================== */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs + totalSourcingJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalJobs} screening + {totalSourcingJobs} sourcing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates + totalSourcedCandidates}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCandidates} screened + {totalSourcedCandidates} sourced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInterviews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedInterviews} completed · {pendingInterviews} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Email Outreach</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrolled}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalReplied} replied · {totalSequences} sequences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ==========================================
          UNIFIED ACTIVITY TIMELINE
          ========================================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Cross-feature activity from all your recruitment workflows
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allActivity.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No recent activity</p>
              <p className="text-sm text-muted-foreground">
                Get started by creating your first job or sourcing candidates
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allActivity.map((activity) => {
                if (activity.type === 'screening') {
                  const job = activity.data as typeof recentJobs[0];
                  return (
                    <Link key={`screening-${job.id}`} href={`/jobs/${job.id}`}>
                      <div className="flex items-start gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Resume screening job created</p>
                          <p className="text-sm text-muted-foreground truncate">{job.title}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {job._count?.candidates || 0} candidates
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {activity.relativeTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                } else if (activity.type === 'sourcing') {
                  const job = activity.data as typeof recentSourcingJobs[0];
                  return (
                    <Link key={`sourcing-${job.id}`} href={`/sourcing/${job.id}`}>
                      <div className="flex items-start gap-4 p-3 rounded-lg border border-purple-100 hover:bg-purple-50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Search className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">AI sourcing job started</p>
                          <p className="text-sm text-muted-foreground truncate">{job.title}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                              {job._count?.candidates || 0} candidates
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {activity.relativeTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                } else if (activity.type === 'interview') {
                  const interview = activity.data as typeof recentInterviews[0];
                  const candidateName = interview.candidates?.name || interview.LinkedInCandidate?.fullName || 'Unknown';
                  return (
                    <Link key={`interview-${interview.id}`} href="/interviews/tracking">
                      <div className="flex items-start gap-4 p-3 rounded-lg border border-green-100 hover:bg-green-50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Mic className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            Interview {interview.status === 'COMPLETED' ? 'completed' : 'scheduled'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{candidateName}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                interview.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {interview.status.toLowerCase().replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {activity.relativeTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                } else if (activity.type === 'outreach') {
                  const sequence = activity.data as typeof recentSequenceActivity[0];
                  const candidateName = sequence.candidate?.name || sequence.linkedInCandidate?.fullName || 'Unknown';
                  return (
                    <Link key={`outreach-${sequence.id}`} href="/outreach/inbox">
                      <div className="flex items-start gap-4 p-3 rounded-lg border border-orange-100 hover:bg-orange-50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {sequence.status === 'REPLIED' ? 'Candidate replied' : 'Candidate enrolled in sequence'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{candidateName}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge
                              variant="secondary"
                              className="text-xs bg-orange-100 text-orange-700"
                            >
                              {sequence.sequence.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {activity.relativeTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                }
                return null;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}