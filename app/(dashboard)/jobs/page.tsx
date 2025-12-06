import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { auth } from '@clerk/nextjs/server';

export default async function JobsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const jobs = await prisma.job.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { candidates: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Jobs</h1>
        <Link href="/jobs/new">
          <Button>Create New Job</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold">No jobs yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating your first job.
            </p>
            <Link href="/jobs/new">
              <Button className="mt-4">Create New Job</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold line-clamp-1">{job.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {job.description?.substring(0, 100)}...
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{job._count.candidates}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDistanceToNow(new Date(job.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Badge
                        variant={
                          job.status === 'completed'
                            ? 'default'
                            : job.status === 'processing'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}