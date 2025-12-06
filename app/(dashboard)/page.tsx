
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { auth } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Fetch stats
  const totalJobs = await prisma.job.count({ where: { userId } });
  const totalCandidates = await prisma.candidate.count({
    where: { job: { userId } },
  });
  const completedJobs = await prisma.job.count({
    where: { userId, status: 'completed' },
  });

  // Fetch recent jobs
  const recentJobs = await prisma.job.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      _count: {
        select: { candidates: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/jobs/new">
          <Button>Create New Job</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
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
            <div className="text-2xl font-bold">{totalCandidates}</div>
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
            <div className="text-2xl font-bold">{completedJobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-muted-foreground">No jobs yet. Create your first job!</p>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {job._count.candidates} candidates
                      </p>
                    </div>
                    <div className="text-sm">
                      <span
                        className={`rounded-full px-3 py-1 ${
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
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}