'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Users,
  Search,
  CheckSquare,
  Square,
  UserCheck,
  ChevronRight,
  ChevronDown,
  Briefcase,
  FileText,
  Target,
} from 'lucide-react';
import { CreditCostBadge } from '@/components/credits/CreditCostBadge';
import { CreditConfirmDialog } from '@/components/credits/CreditConfirmDialog';
import { useCredits } from '@/lib/credits/credit-context';

interface Candidate {
  id: string;
  name: string;
  email: string | null;
  matchScore: number;
  type: 'regular' | 'linkedin';
  jobId: string;
  jobTitle: string;
  headline?: string;
  alreadyEnrolled?: boolean;
}

interface JobGroup {
  id: string;
  title: string;
  source: 'screening' | 'sourcing';
  candidateCount: number;
  candidates: Candidate[];
}

export default function EnrollmentPage() {
  const { getToken } = useAuth();
  const { refreshCredits } = useCredits();
  const router = useRouter();
  const params = useParams();
  const sequenceId = params.id as string;

  const [sequenceName, setSequenceName] = useState('');
  const [sequenceSteps, setSequenceSteps] = useState(1);
  const [jobGroups, setJobGroups] = useState<JobGroup[]>([]);
  const [showCreditConfirm, setShowCreditConfirm] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAlreadyEnrolled, setShowAlreadyEnrolled] = useState(false);

  // Collapsible state for sidebar sections
  const [screeningOpen, setScreeningOpen] = useState(true);
  const [sourcingOpen, setSourcingOpen] = useState(true);

  useEffect(() => {
    fetchData();
  }, [sequenceId]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Fetch sequence details
      const sequenceResponse = await fetch(`${apiUrl}/api/sequences/${sequenceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!sequenceResponse.ok) {
        throw new Error('Failed to fetch sequence');
      }

      const sequenceData = await sequenceResponse.json();
      setSequenceName(sequenceData.name);
      setSequenceSteps(sequenceData.totalSteps || sequenceData.steps?.length || 1);

      // Fetch enrolled candidates
      const enrolledResponse = await fetch(
        `${apiUrl}/api/sequences/${sequenceId}/candidates`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const enrolledData = await enrolledResponse.json();
      const enrolledIds = new Set(
        enrolledData.candidateSequences.map((cs: any) =>
          cs.candidateId || cs.linkedInCandidateId
        )
      );

      // Fetch screening jobs with candidates
      const jobsResponse = await fetch(`${apiUrl}/api/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!jobsResponse.ok) {
        console.error('Failed to fetch jobs:', await jobsResponse.text());
      }

      const jobsData = await jobsResponse.json();
      console.log('Jobs API response:', jobsData);
      const groups: JobGroup[] = [];

      // Group screening candidates by job
      const jobs = Array.isArray(jobsData) ? jobsData : (jobsData?.jobs || []);
      if (jobs.length > 0) {
        console.log('Processing jobs:', jobs.length);
        for (const job of jobs) {
          console.log('Processing job:', job.id, job.title);
          const candidatesResponse = await fetch(
            `${apiUrl}/api/candidates?jobId=${job.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (candidatesResponse.ok) {
            const candidatesData = await candidatesResponse.json();
            console.log('Candidates for job', job.id, ':', candidatesData);
            const allCandidates = candidatesData.candidates || [];
            const candidates: Candidate[] = allCandidates
              .filter((c: any) => c.email && c.email.trim() !== '') // Only candidates with email
              .map((c: any) => ({
                id: c.id,
                name: c.name,
                email: c.email,
                matchScore: c.matchScore || 0,
                type: 'regular' as const,
                jobId: job.id,
                jobTitle: job.title,
                alreadyEnrolled: enrolledIds.has(c.id),
              }));

            console.log('Job', job.title, '- Total candidates:', allCandidates.length, 'With email:', candidates.length);

            // Always add job to list, even if no candidates with email
            groups.push({
              id: job.id,
              title: job.title,
              source: 'screening',
              candidateCount: candidates.length,
              candidates,
            });
          } else {
            console.error('Failed to fetch candidates for job', job.id);
          }
        }
      }

      // Fetch sourcing jobs with candidates
      const sourcingResponse = await fetch(`${apiUrl}/api/sourcing?include=candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const sourcingData = await sourcingResponse.json();

      // Group sourcing candidates by job
      if (sourcingData?.jobs) {
        for (const sourcingJob of sourcingData.jobs) {
          if (sourcingJob.candidates && Array.isArray(sourcingJob.candidates)) {
            const candidates: Candidate[] = sourcingJob.candidates
              .filter((c: any) => c.email && c.email.trim() !== '') // Only candidates with email
              .map((c: any) => ({
                id: c.id,
                name: c.name,
                email: c.email,
                matchScore: c.matchScore || 0,
                type: 'linkedin' as const,
                jobId: sourcingJob.id,
                jobTitle: sourcingJob.title,
                headline: c.headline,
                alreadyEnrolled: enrolledIds.has(c.id),
              }));

            // Always add job to list, even if no candidates with email
            groups.push({
              id: sourcingJob.id,
              title: sourcingJob.title,
              source: 'sourcing',
              candidateCount: candidates.length,
              candidates,
            });
          }
        }
      }

      console.log('Final job groups:', groups);
      setJobGroups(groups);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }

  // Get filtered candidates from selected jobs
  const getFilteredCandidates = (): Candidate[] => {
    if (selectedJobIds.size === 0) return [];

    let filtered: Candidate[] = [];

    // Get candidates from selected jobs
    jobGroups.forEach((group) => {
      if (selectedJobIds.has(group.id)) {
        filtered = filtered.concat(group.candidates);
      }
    });

    // Apply filters
    if (!showAlreadyEnrolled) {
      filtered = filtered.filter((c) => !c.alreadyEnrolled);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          c.jobTitle.toLowerCase().includes(query) ||
          (c.headline && c.headline.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredCandidates = getFilteredCandidates();
  const selectableCandidates = filteredCandidates.filter((c) => !c.alreadyEnrolled);

  function toggleJob(jobId: string) {
    const newSelected = new Set(selectedJobIds);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
      // Deselect all candidates from this job
      const jobCandidates = jobGroups.find((g) => g.id === jobId)?.candidates || [];
      jobCandidates.forEach((c) => selectedCandidateIds.delete(c.id));
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobIds(newSelected);
  }

  function toggleCandidate(candidateId: string) {
    const newSelected = new Set(selectedCandidateIds);
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
    } else {
      newSelected.add(candidateId);
    }
    setSelectedCandidateIds(newSelected);
  }

  function selectAllVisible() {
    const newSelected = new Set(selectedCandidateIds);
    selectableCandidates.forEach((c) => {
      newSelected.add(c.id);
    });
    setSelectedCandidateIds(newSelected);
  }

  function deselectAll() {
    setSelectedCandidateIds(new Set());
  }

  async function handleEnroll() {
    if (selectedCandidateIds.size === 0) {
      setError('Please select at least one candidate');
      return;
    }

    try {
      setEnrolling(true);
      setError(null);

      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Get selected candidates and separate by type
      const allCandidates = jobGroups.flatMap((g) => g.candidates);
      const selectedCandidates = allCandidates.filter((c) =>
        selectedCandidateIds.has(c.id)
      );

      const regularCandidateIds = selectedCandidates
        .filter((c) => c.type === 'regular')
        .map((c) => c.id);
      const linkedInCandidateIds = selectedCandidates
        .filter((c) => c.type === 'linkedin')
        .map((c) => c.id);

      const response = await fetch(
        `${apiUrl}/api/sequences/${sequenceId}/enroll-bulk`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateIds: regularCandidateIds,
            linkedInCandidateIds: linkedInCandidateIds,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to enroll candidates');
      }

      const result = await response.json();

      await refreshCredits();

      // Show success and navigate back
      alert(
        `Successfully enrolled ${result.enrolled} candidate(s)${
          result.failed > 0 ? `. ${result.failed} failed.` : ''
        }`
      );

      router.push(`/outreach/sequences/${sequenceId}`);
    } catch (err: any) {
      console.error('Error enrolling candidates:', err);
      setError(err.message || 'Failed to enroll candidates');
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const screeningJobs = jobGroups.filter((g) => g.source === 'screening');
  const sourcingJobs = jobGroups.filter((g) => g.source === 'sourcing');
  const selectedCount = selectedCandidateIds.size;

  return (
    <div className="container mx-auto max-w-full px-4 py-8">
      {/* Header */}
      <div className="space-y-2 mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Enroll Candidates</h1>
        <p className="text-muted-foreground">
          Select jobs from the sidebar, then choose candidates to enroll in &ldquo;{sequenceName}&rdquo;
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Layout: Candidates (Left/Center) + Job Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Candidates List - Left/Center */}
        <div className="space-y-4 order-2 lg:order-1">
          {/* Filters */}
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email, or headline..."
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="showEnrolled"
                  checked={showAlreadyEnrolled}
                  onCheckedChange={(checked) =>
                    setShowAlreadyEnrolled(checked as boolean)
                  }
                />
                <Label htmlFor="showEnrolled" className="text-sm font-normal cursor-pointer">
                  Show already enrolled
                </Label>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllVisible}
                    disabled={selectableCandidates.length === 0}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Select All ({selectableCandidates.length})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                    disabled={selectedCount === 0}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Deselect All
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {selectedCount} selected
                  </span>
                  {selectedCount > 0 && (
                    <CreditCostBadge feature="OUTREACH" quantity={selectedCount * sequenceSteps} />
                  )}
                  <Button
                    onClick={() => setShowCreditConfirm(true)}
                    disabled={selectedCount === 0 || enrolling}
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Enroll {selectedCount}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Candidates Table */}
          {selectedJobIds.size === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Select Jobs First</h3>
              <p className="text-sm text-muted-foreground">
                Click on jobs in the sidebar to load their candidates
              </p>
            </Card>
          ) : filteredCandidates.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or select different jobs
              </p>
            </Card>
          ) : (
            <Card>
              <ScrollArea className="h-[calc(100vh-400px)] w-full">
                <div className="overflow-x-auto">
                  <Table className="relative">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="text-center w-20">Score</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {filteredCandidates.map((candidate) => (
                    <TableRow
                      key={candidate.id}
                      className={candidate.alreadyEnrolled ? 'opacity-50' : ''}
                    >
                      <TableCell>
                        {!candidate.alreadyEnrolled && (
                          <Checkbox
                            checked={selectedCandidateIds.has(candidate.id)}
                            onCheckedChange={() => toggleCandidate(candidate.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{candidate.name}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {candidate.email || (
                            <span className="text-muted-foreground italic">No email</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{candidate.matchScore}%</Badge>
                      </TableCell>
                      <TableCell>
                        {candidate.alreadyEnrolled ? (
                          <Badge variant="outline">Enrolled</Badge>
                        ) : (
                          <Badge variant="secondary">Available</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </Card>
        )}
      </div>

        {/* Job Selection Sidebar - Right */}
        <Card className="p-4 h-fit sticky top-4 order-1 lg:order-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                SELECT JOBS
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Click jobs to load candidates. Select multiple jobs to enroll from different sources.
              </p>
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-3">
                {/* Screening Jobs Section */}
                <Collapsible open={screeningOpen} onOpenChange={setScreeningOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-accent rounded-md p-2">
                    {screeningOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-sm">Resume Screening</span>
                    <Badge variant="secondary" className="ml-auto">
                      {screeningJobs.length}
                    </Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 mt-2 space-y-1">
                    {screeningJobs.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No jobs</p>
                    ) : (
                      screeningJobs.map((job) => (
                        <button
                          key={job.id}
                          onClick={() => toggleJob(job.id)}
                          disabled={job.candidateCount === 0}
                          className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                            job.candidateCount === 0
                              ? 'opacity-50 cursor-not-allowed'
                              : selectedJobIds.has(job.id)
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'hover:bg-accent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{job.title}</span>
                            <Badge
                              variant="outline"
                              className={`ml-2 ${job.candidateCount === 0 ? 'border-muted' : ''}`}
                            >
                              {job.candidateCount}
                            </Badge>
                          </div>
                        </button>
                      ))
                    )}
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Sourcing Jobs Section */}
                <Collapsible open={sourcingOpen} onOpenChange={setSourcingOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-accent rounded-md p-2">
                    {sourcingOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-sm">Sourced Candidates</span>
                    <Badge variant="secondary" className="ml-auto">
                      {sourcingJobs.length}
                    </Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 mt-2 space-y-1">
                    {sourcingJobs.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No jobs</p>
                    ) : (
                      sourcingJobs.map((job) => (
                        <button
                          key={job.id}
                          onClick={() => toggleJob(job.id)}
                          disabled={job.candidateCount === 0}
                          className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                            job.candidateCount === 0
                              ? 'opacity-50 cursor-not-allowed'
                              : selectedJobIds.has(job.id)
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'hover:bg-accent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{job.title}</span>
                            <Badge
                              variant="outline"
                              className={`ml-2 ${job.candidateCount === 0 ? 'border-muted' : ''}`}
                            >
                              {job.candidateCount}
                            </Badge>
                          </div>
                        </button>
                      ))
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ScrollArea>
          </div>
        </Card>
      </div>

      {/* Credit Confirmation Dialog */}
      <CreditConfirmDialog
        open={showCreditConfirm}
        onOpenChange={setShowCreditConfirm}
        featureType="OUTREACH"
        quantity={selectedCandidateIds.size * sequenceSteps}
        actionLabel={`Enroll ${selectedCandidateIds.size} candidate${selectedCandidateIds.size !== 1 ? 's' : ''} in ${sequenceSteps}-step sequence`}
        onConfirm={handleEnroll}
      />
    </div>
  );
}
