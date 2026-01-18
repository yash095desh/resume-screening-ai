'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  AlertCircle,
  Inbox,
  Send,
  Reply,
  CheckCircle,
  Briefcase,
  Users,
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  matchScore: number | null;
  source: 'SCREENING' | 'SOURCING';
  sequence: {
    id: string;
    name: string;
    status: string;
    currentStep: number;
    totalSteps: number;
    nextEmailScheduledAt: Date | null;
  } | null;
}

interface Pipeline {
  notContacted: Candidate[];
  inSequence: Candidate[];
  replied: Candidate[];
  interviewSent: Candidate[];
}

function PipelinePageContent() {
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedJob, setSelectedJob] = useState<string | null>(
    searchParams.get('jobId')
  );
  const [jobs, setJobs] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline>({
    notContacted: [],
    inSequence: [],
    replied: [],
    interviewSent: [],
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedSequence, setSelectedSequence] = useState<string>('');

  useEffect(() => {
    fetchJobs();
    fetchSequences();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchPipeline();
      const interval = setInterval(fetchPipeline, 10000); // Auto-refresh every 10s
      return () => clearInterval(interval);
    }
  }, [selectedJob]);

  async function fetchJobs() {
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Fetch both screening jobs and sourcing jobs
      const [screeningResponse, sourcingResponse] = await Promise.all([
        fetch(`${apiUrl}/api/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/sourcing`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const allJobs = [];

      if (screeningResponse.ok) {
        const data = await screeningResponse.json();
        const screeningJobs = (data.jobs || []).map((job: any) => ({
          ...job,
          source: 'SCREENING',
        }));
        allJobs.push(...screeningJobs);
      }

      if (sourcingResponse.ok) {
        const data = await sourcingResponse.json();
        const sourcingJobs = (data.jobs || []).map((job: any) => ({
          ...job,
          source: 'SOURCING',
        }));
        allJobs.push(...sourcingJobs);
      }

      setJobs(allJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  }

  async function fetchSequences() {
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/sequences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSequences(data.sequences || []);
      }
    } catch (err) {
      console.error('Error fetching sequences:', err);
    }
  }

  async function fetchPipeline() {
    if (!selectedJob) return;

    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Find the selected job to determine its source
      const job = jobs.find((j) => j.id === selectedJob);
      if (!job) return;

      // Build query params based on job source
      const queryParam =
        job.source === 'SCREENING'
          ? `jobId=${selectedJob}`
          : `sourcingJobId=${selectedJob}`;

      const response = await fetch(
        `${apiUrl}/api/outreach/pipeline?${queryParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pipeline');
      }

      const data = await response.json();
      setPipeline(data.pipeline);
    } catch (err: any) {
      console.error('Error fetching pipeline:', err);
      setError(err.message || 'Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    if (selected.size === 0 || !selectedSequence) return;

    try {
      setEnrolling(true);
      setError(null);

      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Separate by source
      const candidateIds: string[] = [];
      const linkedInCandidateIds: string[] = [];

      pipeline.notContacted.forEach((c) => {
        if (selected.has(c.id)) {
          if (c.source === 'SCREENING') candidateIds.push(c.id);
          else linkedInCandidateIds.push(c.id);
        }
      });

      const response = await fetch(`${apiUrl}/api/outreach/pipeline/enroll`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateIds,
          linkedInCandidateIds,
          sequenceId: selectedSequence,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to enroll candidates');
      }

      // Reset and refresh
      setSelected(new Set());
      setSelectedSequence('');
      await fetchPipeline();
    } catch (err: any) {
      console.error('Error enrolling candidates:', err);
      setError(err.message || 'Failed to enroll candidates');
    } finally {
      setEnrolling(false);
    }
  }

  function toggleSelect(id: string) {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  }

  if (!selectedJob) {
    const screeningJobs = jobs.filter((j) => j.source === 'SCREENING');
    const sourcingJobs = jobs.filter((j) => j.source === 'SOURCING');

    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-3 mb-8">
          <h1 className="text-4xl font-bold">Pipeline</h1>
          <p className="text-lg text-muted-foreground">
            Manage candidates through your outreach sequences
          </p>
        </div>

        <Tabs defaultValue="screening" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="screening" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Resume Screening ({screeningJobs.length})
            </TabsTrigger>
            <TabsTrigger value="sourcing" className="gap-2">
              <Users className="h-4 w-4" />
              LinkedIn Sourcing ({sourcingJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="screening" className="space-y-4">
            {screeningJobs.length === 0 ? (
              <Card className="p-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Resume Screening Jobs</h3>
                <p className="text-muted-foreground">
                  Create a job and upload resumes to get started
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {screeningJobs.map((job) => (
                  <Card
                    key={job.id}
                    className="p-6 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedJob(job.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg line-clamp-2">{job.title}</h3>
                        <Badge variant="secondary" className="shrink-0">
                          Resume
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{job.totalCandidates || 0} candidates</p>
                        <p className="text-xs">
                          Created {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sourcing" className="space-y-4">
            {sourcingJobs.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No LinkedIn Sourcing Jobs</h3>
                <p className="text-muted-foreground">
                  Create a sourcing job to find candidates on LinkedIn
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sourcingJobs.map((job) => (
                  <Card
                    key={job.id}
                    className="p-6 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedJob(job.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg line-clamp-2">{job.title}</h3>
                        <Badge variant="secondary" className="shrink-0">
                          LinkedIn
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{job.totalProfilesFound || job.profilesSaved || 0} candidates</p>
                        <p className="text-xs">
                          Created {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  const selectedJobData = jobs.find((j) => j.id === selectedJob);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Pipeline</h1>
            <p className="text-lg text-muted-foreground">
              Manage candidates through your outreach sequences
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedJob(null)}>
            ← Back to Jobs
          </Button>
        </div>
      </div>

      {/* Current Job Info */}
      {selectedJobData && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{selectedJobData.title}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  {selectedJobData.source === 'SCREENING' ? 'Resume Screening' : 'LinkedIn Sourcing'}
                </Badge>
                <span>•</span>
                <span>
                  {selectedJobData.totalCandidates || selectedJobData.profilesSaved || 0} total candidates
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Enroll Bar */}
      {selected.size > 0 && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">
              {selected.size} candidate{selected.size !== 1 ? 's' : ''} selected
            </span>

            <div className="flex items-center gap-3">
              <Select value={selectedSequence} onValueChange={setSelectedSequence}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select sequence" />
                </SelectTrigger>
                <SelectContent>
                  {sequences
                    .filter((s) => s.isActive)
                    .map((seq) => (
                      <SelectItem key={seq.id} value={seq.id}>
                        {seq.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleEnroll}
                disabled={!selectedSequence || enrolling}
              >
                {enrolling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  'Enroll in Sequence'
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Pipeline Columns */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PipelineColumn
            title="Not Contacted"
            icon={<Inbox className="h-5 w-5" />}
            candidates={pipeline.notContacted}
            selected={selected}
            onToggleSelect={toggleSelect}
            selectable
          />

          <PipelineColumn
            title="In Sequence"
            icon={<Send className="h-5 w-5" />}
            candidates={pipeline.inSequence}
            selected={selected}
            onToggleSelect={toggleSelect}
          />

          <PipelineColumn
            title="Replied"
            icon={<Reply className="h-5 w-5" />}
            candidates={pipeline.replied}
            selected={selected}
            onToggleSelect={toggleSelect}
          />

          <PipelineColumn
            title="Interview Sent"
            icon={<CheckCircle className="h-5 w-5" />}
            candidates={pipeline.interviewSent}
            selected={selected}
            onToggleSelect={toggleSelect}
          />
        </div>
      )}
    </div>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <PipelinePageContent />
    </Suspense>
  );
}

interface PipelineColumnProps {
  title: string;
  icon: React.ReactNode;
  candidates: Candidate[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  selectable?: boolean;
}

function PipelineColumn({
  title,
  icon,
  candidates,
  selected,
  onToggleSelect,
  selectable = false,
}: PipelineColumnProps) {
  return (
    <div className="space-y-4">
      {/* Column Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <Card key={candidate.id} className="p-4">
            <div className="space-y-3">
              {/* Header with checkbox */}
              <div className="flex items-start gap-3">
                {selectable && (
                  <Checkbox
                    checked={selected.has(candidate.id)}
                    onCheckedChange={() => onToggleSelect(candidate.id)}
                    className="mt-0.5"
                  />
                )}

                <div className="flex-1 space-y-1 min-w-0">
                  <h3 className="font-medium truncate">{candidate.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {candidate.email}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-2 flex-wrap">
                {candidate.matchScore !== null && (
                  <Badge variant="secondary" className="text-xs">
                    {candidate.matchScore}% match
                  </Badge>
                )}

                <Badge variant="outline" className="text-xs">
                  {candidate.source === 'SCREENING' ? 'Resume' : 'LinkedIn'}
                </Badge>
              </div>

              {/* Sequence Info */}
              {candidate.sequence && (
                <div className="pt-2 border-t border-border space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {candidate.sequence.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Step {candidate.sequence.currentStep}/{candidate.sequence.totalSteps}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}

        {candidates.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No candidates
          </div>
        )}
      </div>
    </div>
  );
}
