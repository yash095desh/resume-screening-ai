'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Users,
  Search,
  CheckSquare,
  Square,
  UserCheck,
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string | null;
  matchScore: number;
  type: 'regular' | 'linkedin';
  jobTitle?: string;
  headline?: string;
  alreadyEnrolled?: boolean;
}

export default function EnrollmentPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sequenceId = params.id as string;

  const [sequenceName, setSequenceName] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [showOnlyWithEmail, setShowOnlyWithEmail] = useState(true);
  const [showAlreadyEnrolled, setShowAlreadyEnrolled] = useState(false);
  const [startImmediately, setStartImmediately] = useState(false);

  useEffect(() => {
    fetchData();
  }, [sequenceId]);

  useEffect(() => {
    applyFilters();
  }, [candidates, searchQuery, minMatchScore, showOnlyWithEmail, showAlreadyEnrolled]);

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

      // Fetch all jobs and candidates
      const jobsResponse = await fetch(`${apiUrl}/api/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const sourcingResponse = await fetch(`${apiUrl}/api/sourcing?include=candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!jobsResponse.ok || !sourcingResponse.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const jobsData = await jobsResponse.json();
      const sourcingData = await sourcingResponse.json();

      // Combine all candidates
      const allCandidates: Candidate[] = [];

      // Regular candidates from jobs
      if(jobsData?.jobs){
          for (const job of jobsData?.jobs) {
            const candidatesResponse = await fetch(`${apiUrl}/api/candidates?jobId=${job.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (candidatesResponse.ok) {
              const candidatesData = await candidatesResponse.json();
              for (const candidate of candidatesData.candidates || []) {
                allCandidates.push({
                  id: candidate.id,
                  name: candidate.name,
                  email: candidate.email,
                  matchScore: candidate.matchScore || 0,
                  type: 'regular',
                  jobTitle: job.title,
                  alreadyEnrolled: enrolledIds.has(candidate.id),
                });
              }
            }
          }
      }

      // LinkedIn candidates from sourcing jobs
      if(sourcingData?.jobs){
        for (const sourcingJob of sourcingData?.jobs) {
          if (sourcingJob.candidates && Array.isArray(sourcingJob.candidates)) {
            for (const candidate of sourcingJob.candidates) {
              allCandidates.push({
                id: candidate.id,
                name: candidate.name,
                email: candidate.email,
                matchScore: candidate.matchScore || 0,
                type: 'linkedin',
                jobTitle: sourcingJob.title,
                headline: candidate.headline,
                alreadyEnrolled: enrolledIds.has(candidate.id),
              });
            }
          }
        }
      }

      setCandidates(allCandidates);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...candidates];

    // Filter by email
    if (showOnlyWithEmail) {
      filtered = filtered.filter((c) => c.email && c.email.trim() !== '');
    }

    // Filter by already enrolled
    if (!showAlreadyEnrolled) {
      filtered = filtered.filter((c) => !c.alreadyEnrolled);
    }

    // Filter by match score
    if (minMatchScore > 0) {
      filtered = filtered.filter((c) => c.matchScore >= minMatchScore);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.jobTitle && c.jobTitle.toLowerCase().includes(query)) ||
          (c.headline && c.headline.toLowerCase().includes(query))
      );
    }

    setFilteredCandidates(filtered);
  }

  function toggleCandidate(candidateId: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
    } else {
      newSelected.add(candidateId);
    }
    setSelectedIds(newSelected);
  }

  function selectAll() {
    const newSelected = new Set<string>();
    filteredCandidates.forEach((c) => {
      if (!c.alreadyEnrolled) {
        newSelected.add(c.id);
      }
    });
    setSelectedIds(newSelected);
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function handleEnroll() {
    if (selectedIds.size === 0) {
      setError('Please select at least one candidate');
      return;
    }

    try {
      setEnrolling(true);
      setError(null);

      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Separate regular and LinkedIn candidates
      const selectedCandidates = candidates.filter((c) => selectedIds.has(c.id));
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
            startImmediately,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to enroll candidates');
      }

      const result = await response.json();

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

  const selectableCandidates = filteredCandidates.filter((c) => !c.alreadyEnrolled);
  const selectedCount = selectedIds.size;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="space-y-2 mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-4xl font-bold">Enroll Candidates</h1>
        <p className="text-lg text-muted-foreground">
          Select candidates to enroll in &ldquo;{sequenceName}&rdquo;
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters & Actions */}
      <Card className="p-6 mb-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Filters & Selection</h2>
          <p className="text-sm text-muted-foreground">
            Filter and select candidates to enroll in this sequence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or job..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Min Match Score */}
          <div className="space-y-2">
            <Label htmlFor="matchScore">Min Match Score</Label>
            <Select
              value={minMatchScore.toString()}
              onValueChange={(v) => setMinMatchScore(parseInt(v))}
            >
              <SelectTrigger id="matchScore">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any Score</SelectItem>
                <SelectItem value="50">50% or higher</SelectItem>
                <SelectItem value="60">60% or higher</SelectItem>
                <SelectItem value="70">70% or higher</SelectItem>
                <SelectItem value="80">80% or higher</SelectItem>
                <SelectItem value="90">90% or higher</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Checkbox Filters */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="hasEmail"
              checked={showOnlyWithEmail}
              onCheckedChange={(checked) => setShowOnlyWithEmail(checked as boolean)}
            />
            <Label htmlFor="hasEmail" className="text-sm font-normal cursor-pointer">
              Only show candidates with email addresses
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="showEnrolled"
              checked={showAlreadyEnrolled}
              onCheckedChange={(checked) => setShowAlreadyEnrolled(checked as boolean)}
            />
            <Label htmlFor="showEnrolled" className="text-sm font-normal cursor-pointer">
              Show already enrolled candidates (for reference)
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="startImmediately"
              checked={startImmediately}
              onCheckedChange={(checked) => setStartImmediately(checked as boolean)}
            />
            <Label htmlFor="startImmediately" className="text-sm font-normal cursor-pointer">
              Start sequence immediately (send first email now)
            </Label>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAll}
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
              {selectedCount} candidate{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <Button
              onClick={handleEnroll}
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
                  Enroll {selectedCount} Candidate{selectedCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Candidates Table */}
      {filteredCandidates.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Try adjusting your filters or add candidates to your jobs first
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Job</TableHead>
                <TableHead className="text-center">Match Score</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
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
                        checked={selectedIds.has(candidate.id)}
                        onCheckedChange={() => toggleCandidate(candidate.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{candidate.name}</div>
                      {candidate.headline && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {candidate.headline}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {candidate.email || (
                        <span className="text-muted-foreground italic">No email</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{candidate.jobTitle}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{candidate.matchScore}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={candidate.type === 'linkedin' ? 'default' : 'secondary'}>
                      {candidate.type === 'linkedin' ? 'LinkedIn' : 'Resume'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {candidate.alreadyEnrolled ? (
                      <Badge variant="outline">Already Enrolled</Badge>
                    ) : (
                      <Badge variant="secondary">Available</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
