'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/auth/hooks';
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
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'name' | 'email' | 'score'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
        // Backend returns array directly for screening jobs (not wrapped in { jobs: [] })
        const jobsArray = Array.isArray(data) ? data : (data.jobs || []);
        const screeningJobs = jobsArray.map((job: any) => ({
          ...job,
          totalCandidates: job._count?.candidates ?? job.totalCandidates ?? 0,
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

  function toggleSort(field: 'name' | 'email' | 'score') {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function filterAndSortCandidates(candidates: Candidate[]) {
    let filtered = candidates;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      if (sortField === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortField === 'email') {
        aVal = a.email.toLowerCase();
        bVal = b.email.toLowerCase();
      } else if (sortField === 'score') {
        aVal = a.matchScore ?? -1;
        bVal = b.matchScore ?? -1;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
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
              AI Sourcing ({sourcingJobs.length})
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
                <h3 className="text-xl font-semibold mb-2">No Sourcing Jobs</h3>
                <p className="text-muted-foreground">
                  Create a sourcing job to find candidates
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
                          Sourced
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
                  {selectedJobData.source === 'SCREENING' ? 'Resume Screening' : 'AI Sourcing'}
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

      {/* Pipeline Tabs */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="not-contacted" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="not-contacted" className="gap-2">
              <Inbox className="h-4 w-4" />
              <span className="hidden sm:inline">Not Contacted</span>
              <span className="sm:hidden">Not Cont.</span>
              <Badge variant="secondary" className="ml-1">
                {pipeline.notContacted.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="in-sequence" className="gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">In Sequence</span>
              <span className="sm:hidden">Sequence</span>
              <Badge variant="secondary" className="ml-1">
                {pipeline.inSequence.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="replied" className="gap-2">
              <Reply className="h-4 w-4" />
              Replied
              <Badge variant="secondary" className="ml-1">
                {pipeline.replied.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="interview-sent" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Interview Sent</span>
              <span className="sm:hidden">Interview</span>
              <Badge variant="secondary" className="ml-1">
                {pipeline.interviewSent.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSort('name')}
                className="gap-1"
              >
                Name
                {sortField === 'name' && (
                  <ArrowUpDown className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSort('score')}
                className="gap-1"
              >
                Score
                {sortField === 'score' && (
                  <ArrowUpDown className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <TabsContent value="not-contacted" className="space-y-0">
            <CandidateListView
              candidates={filterAndSortCandidates(pipeline.notContacted)}
              selected={selected}
              onToggleSelect={toggleSelect}
              selectable
            />
          </TabsContent>

          <TabsContent value="in-sequence" className="space-y-0">
            <CandidateListView
              candidates={filterAndSortCandidates(pipeline.inSequence)}
              selected={selected}
              onToggleSelect={toggleSelect}
            />
          </TabsContent>

          <TabsContent value="replied" className="space-y-0">
            <CandidateListView
              candidates={filterAndSortCandidates(pipeline.replied)}
              selected={selected}
              onToggleSelect={toggleSelect}
            />
          </TabsContent>

          <TabsContent value="interview-sent" className="space-y-0">
            <CandidateListView
              candidates={filterAndSortCandidates(pipeline.interviewSent)}
              selected={selected}
              onToggleSelect={toggleSelect}
            />
          </TabsContent>
        </Tabs>
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

interface CandidateListViewProps {
  candidates: Candidate[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  selectable?: boolean;
}

function CandidateListView({
  candidates,
  selected,
  onToggleSelect,
  selectable = false,
}: CandidateListViewProps) {
  if (candidates.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">No candidates found</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search or check other tabs
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mobile: Cards */}
      <div className="md:hidden space-y-2">
        {candidates.map((candidate) => (
          <Card key={candidate.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                {selectable && (
                  <Checkbox
                    checked={selected.has(candidate.id)}
                    onCheckedChange={() => onToggleSelect(candidate.id)}
                    className="mt-0.5"
                  />
                )}
                <div className="flex-1 space-y-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{candidate.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {candidate.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {candidate.matchScore !== null && (
                  <Badge variant="secondary" className="text-xs">
                    {candidate.matchScore}%
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {candidate.source === 'SCREENING' ? 'Resume' : 'Sourced'}
                </Badge>
              </div>

              {candidate.sequence && (
                <div className="pt-2 border-t border-border space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {candidate.sequence.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Step {Math.min(candidate.sequence.currentStep, candidate.sequence.totalSteps)}/{candidate.sequence.totalSteps}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop: Table */}
      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {selectable && (
                  <th className="w-12 px-4 py-3 text-left">
                    <span className="sr-only">Select</span>
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Sequence
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate, index) => (
                <tr
                  key={candidate.id}
                  className={`
                    border-b border-border last:border-0
                    hover:bg-muted/50 transition-colors
                  `}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(candidate.id)}
                        onCheckedChange={() => onToggleSelect(candidate.id)}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium truncate max-w-xs">
                      {candidate.name}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-muted-foreground truncate max-w-xs">
                      {candidate.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {candidate.matchScore !== null ? (
                      <Badge variant="secondary" className="text-xs">
                        {candidate.matchScore}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {candidate.source === 'SCREENING' ? 'Resume' : 'Sourced'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {candidate.sequence ? (
                      <div className="space-y-1">
                        <p className="text-xs font-medium truncate max-w-xs">
                          {candidate.sequence.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Step {Math.min(candidate.sequence.currentStep, candidate.sequence.totalSteps)}/{candidate.sequence.totalSteps}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
