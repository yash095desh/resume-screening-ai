import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, Users, TrendingUp, Upload, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { auth } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Fetch stats for resume screening
  const totalJobs = await prisma.job.count({ where: { userId } });
  const totalCandidates = await prisma.candidate.count({
    where: { job: { userId } },
  });
  const completedJobs = await prisma.job.count({
    where: { userId, status: 'completed' },
  });

  // Fetch stats for sourcing
  const totalSourcingJobs = await prisma.sourcingJob.count({ where: { userId } });
  const totalSourcedCandidates = await prisma.linkedInCandidate.count({
    where: { sourcingJob: { userId } },
  });
  const completedSourcingJobs = await prisma.sourcingJob.count({
    where: { userId, status: 'COMPLETED' },
  });

  // Fetch recent jobs from both features
  const recentJobs = await prisma.job.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      _count: {
        select: { candidates: true },
      },
    },
  });

  const recentSourcingJobs = await prisma.sourcingJob.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      _count: {
        select: { candidates: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Manage your recruitment workflows
        </p>
      </div>

      {/* Feature Cards - Two Main Options */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Resume Screening Feature */}
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <Link href="/jobs/new">
                <Button size="sm">Create Job</Button>
              </Link>
            </div>
            <CardTitle className="text-xl mt-4">Resume Screening</CardTitle>
            <CardDescription>
              Upload candidate resumes and get AI-powered matching scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Jobs</span>
                <span className="font-semibold">{totalJobs}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Candidates Screened</span>
                <span className="font-semibold">{totalCandidates}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold">{completedJobs}</span>
              </div>
              <Link href="/jobs" className="block mt-4">
                <Button variant="outline" className="w-full">
                  View All Jobs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* LinkedIn Sourcing Feature */}
        <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
              <Link href="/sourcing/new">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Start Sourcing
                </Button>
              </Link>
            </div>
            <CardTitle className="text-xl mt-4">
              LinkedIn Sourcing
              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                NEW
              </span>
            </CardTitle>
            <CardDescription>
              Automatically find and score LinkedIn candidates matching your job description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sourcing Jobs</span>
                <span className="font-semibold">{totalSourcingJobs}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Candidates Found</span>
                <span className="font-semibold">{totalSourcedCandidates}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold">{completedSourcingJobs}</span>
              </div>
              <Link href="/sourcing" className="block mt-4">
                <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                  View All Sourcing Jobs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combined Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">
              Total Candidates
            </CardTitle>
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
            <CardTitle className="text-sm font-medium">
              Completed Jobs
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs + completedSourcingJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedJobs} screening + {completedSourcingJobs} sourcing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Resume Screening Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Recent Resume Screening
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No jobs yet</p>
                <Link href="/jobs/new">
                  <Button size="sm">Create First Job</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                      <div>
                        <h3 className="font-semibold text-sm">{job.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {job._count.candidates} candidates
                        </p>
                      </div>
                      <span
                        className={`text-xs rounded-full px-2 py-1 ${
                          job.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : job.status === 'processing'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sourcing Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-purple-600" />
              Recent LinkedIn Sourcing
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSourcingJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No sourcing jobs yet</p>
                <Link href="/sourcing/new">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Start Sourcing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSourcingJobs.map((job) => (
                  <Link key={job.id} href={`/sourcing/${job.id}`}>
                    <div className="flex items-center justify-between rounded-lg border border-purple-100 p-3 hover:bg-purple-50 transition-colors">
                      <div>
                        <h3 className="font-semibold text-sm">{job.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {job._count.candidates} candidates
                        </p>
                      </div>
                      <span
                        className={`text-xs rounded-full px-2 py-1 ${
                          job.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : job.status === 'FAILED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {job.status === 'COMPLETED' ? 'Completed' : 
                         job.status === 'FAILED' ? 'Failed' : 'Processing'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}