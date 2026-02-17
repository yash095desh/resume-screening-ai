'use client';

import { useEffect, useState } from 'react';
import { useParams as useParamsHook, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileText,
  Search,
  Upload,
  Loader2,
  RefreshCw,
  Mail,
  Trash2,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { toast } from "sonner"
import { useApiClient } from '@/lib/api/client';
import QuickEnrollModal from '@/components/outreach/QuickEnrollModal';
import { CreditCostBadge } from '@/components/credits/CreditCostBadge';
import { CreditConfirmDialog } from '@/components/credits/CreditConfirmDialog';
import { useCredits } from '@/lib/credits/credit-context';

interface Candidate {
  id: string;
  name: string;
  email: string | null;
  matchScore: number | null;
  fitVerdict: string | null;
  matchedSkills: string[];
  missingSkills: string[];
  totalExperienceYears: number | null;
  processingStatus: string;
  processingError: string | null;
  resumeUrl: string;
}

interface Job {
  id: string;
  title: string;
  status: string;
  totalCandidates: number;
  candidates: Candidate[];
}

export default function CandidateRankingsPage() {
  const params = useParamsHook();
  const { get, post, del } = useApiClient();
  const { refreshCredits } = useCredits();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [exporting, setExporting] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [showCreditConfirm, setShowCreditConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchJob();
  }, [params.jobId]);

  const fetchJob = async () => {
    try {
      const { res, data } = await get(`/api/jobs/${params.jobId}`);
      if (!res.ok) throw new Error('Failed to fetch job');
      setJob(data);
    } catch (error) {
      toast.error('Failed to load job details.');
      console.log('Failed to load job details.', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const { res } = await post(`/api/jobs/process/${params.jobId}`);
      if (!res.ok) throw new Error('Processing failed');

      await refreshCredits();
      toast.info('Resumes are being analyzed. This may take a few minutes.');

      const interval = setInterval(async () => {
        const { data } = await get(`/api/jobs/${params.jobId}`);
        setJob(data);

        if (data.status === 'completed') {
          clearInterval(interval);
          setProcessing(false);
          const succeeded = data.candidates.filter((c: Candidate) => c.processingStatus === 'completed').length;
          const failed = data.candidates.filter((c: Candidate) => c.processingStatus === 'failed').length;
          if (failed > 0) {
            toast.warning(`Processing complete: ${succeeded} succeeded, ${failed} failed`);
          } else {
            toast.success(`All ${succeeded} candidates analyzed successfully.`);
          }
        }
      }, 5000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process resumes.');
      setProcessing(false);
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    setActionLoading(candidateId);
    try {
      const { res } = await del(`/api/candidates/${candidateId}`);
      if (!res.ok) throw new Error('Delete failed');
      await fetchJob();
      setSelectedCandidates(prev => prev.filter(id => id !== candidateId));
      toast.success('Candidate deleted.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete candidate.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading('bulk-delete');
    try {
      const { res } = await post(`/api/jobs/${params.jobId}/candidates/bulk-delete`, {
        candidateIds: deleteTargets,
      });
      if (!res.ok) throw new Error('Bulk delete failed');
      await fetchJob();
      setSelectedCandidates([]);
      toast.success(`${deleteTargets.length} candidate(s) deleted.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete candidates.');
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(false);
      setDeleteTargets([]);
    }
  };

  const handleRetryCandidate = async (candidateId: string) => {
    setActionLoading(candidateId);
    try {
      const { res } = await post(`/api/candidates/${candidateId}/retry`);
      if (!res.ok) throw new Error('Retry failed');
      await fetchJob();
      toast.success('Candidate reset to pending. Click "Process Candidates" to retry.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to retry candidate.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryAllFailed = async () => {
    setActionLoading('retry-all');
    try {
      const { res, data } = await post(`/api/jobs/${params.jobId}/candidates/retry-failed`);
      if (!res.ok) throw new Error('Retry failed');
      await fetchJob();
      toast.success(`${data.count} failed candidate(s) reset. Click "Process Candidates" to retry.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to retry candidates.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: params.jobId, format }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidates-${params.jobId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Downloaded as ${format.toUpperCase()}.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!job) {
    return <div>Job not found</div>;
  }

  // Filter and sort candidates
  let filteredCandidates = job.candidates.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filterVerdict !== 'all') {
    filteredCandidates = filteredCandidates.filter(
      (c) => c.fitVerdict === filterVerdict
    );
  }

  if (filterStatus !== 'all') {
    filteredCandidates = filteredCandidates.filter(
      (c) => c.processingStatus === filterStatus
    );
  }

  if (sortBy === 'score') {
    filteredCandidates.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  } else if (sortBy === 'name') {
    filteredCandidates.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'experience') {
    filteredCandidates.sort(
      (a, b) => (b.totalExperienceYears || 0) - (a.totalExperienceYears || 0)
    );
  }

  const completedCandidates = job.candidates.filter(
    (c) => c.processingStatus === 'completed'
  );
  const pendingCandidates = job.candidates.filter(
    (c) => c.processingStatus === 'pending'
  );
  const failedCandidates = job.candidates.filter(
    (c) => c.processingStatus === 'failed'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{job.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {completedCandidates.length} of {job.candidates.length} candidates analyzed
            {failedCandidates.length > 0 && (
              <span className="text-red-500 ml-2">
                ({failedCandidates.length} failed)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {failedCandidates.length > 0 && (
            <Button
              variant="outline"
              onClick={handleRetryAllFailed}
              disabled={actionLoading === 'retry-all'}
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              {actionLoading === 'retry-all' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Retry All Failed ({failedCandidates.length})
            </Button>
          )}
          <Link href={`/jobs/${params.jobId}/upload`}>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Add More Resumes
            </Button>
          </Link>
          {pendingCandidates.length > 0 && (
            <div className="flex items-center gap-3">
              <CreditCostBadge feature="SCREENING" quantity={pendingCandidates.length} />
              <Button onClick={() => setShowCreditConfirm(true)} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Process Candidates
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {job.status === 'processing' && (
        <Card className="border-blue-500 bg-blue-50">
          <CardContent className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <div>
              <p className="font-semibold text-blue-900">Processing in progress</p>
              <p className="text-sm text-blue-700">
                Your resumes are being analyzed. This page will update automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Action Bar */}
      {selectedCandidates.length > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-between">
          <span className="text-base text-foreground">
            {selectedCandidates.length} candidate{selectedCandidates.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedCandidates([])}>
              Clear Selection
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => {
                setDeleteTargets(selectedCandidates);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
            <Button onClick={() => setShowOutreachModal(true)}>
              <Mail className="w-4 h-4 mr-2" />
              Start Outreach
            </Button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterVerdict} onValueChange={setFilterVerdict}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by fit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Candidates</SelectItem>
              <SelectItem value="Good Fit">Good Fit</SelectItem>
              <SelectItem value="Moderate Fit">Moderate Fit</SelectItem>
              <SelectItem value="Low Fit">Low Fit</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Match Score</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="experience">Experience</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => handleExport(value as 'csv' | 'pdf')}>
            <SelectTrigger className="w-[140px]" disabled={exporting || completedCandidates.length === 0}>
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="pdf">Export PDF</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Candidates ({filteredCandidates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCandidates.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              {filterStatus !== 'all' || filterVerdict !== 'all' || searchQuery
                ? 'No candidates match your filters.'
                : 'No candidates uploaded yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={filteredCandidates.length > 0 && selectedCandidates.length === filteredCandidates.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCandidates(filteredCandidates.map(c => c.id));
                        } else {
                          setSelectedCandidates([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="w-10">Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Fit</TableHead>
                  <TableHead>Matched Skills</TableHead>
                  <TableHead>Missing Skills</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => (
                  <TableRow
                    key={candidate.id}
                    className={
                      candidate.processingStatus === 'failed'
                        ? 'bg-red-50/50 dark:bg-red-950/10'
                        : ''
                    }
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        className="cursor-pointer"
                        checked={selectedCandidates.includes(candidate.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCandidates([...selectedCandidates, candidate.id]);
                          } else {
                            setSelectedCandidates(selectedCandidates.filter(id => id !== candidate.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                candidate.processingStatus === 'completed'
                                  ? 'bg-green-500'
                                  : candidate.processingStatus === 'failed'
                                  ? 'bg-red-500'
                                  : candidate.processingStatus === 'processing'
                                  ? 'bg-blue-500 animate-pulse'
                                  : 'bg-yellow-500'
                              }`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="capitalize">{candidate.processingStatus}</p>
                            {candidate.processingError && (
                              <p className="text-red-400 text-xs mt-1 max-w-[200px]">
                                {candidate.processingError}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-medium">
                      {candidate.name}
                      {candidate.email && (
                        <p className="text-sm text-muted-foreground">
                          {candidate.email}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {candidate.processingStatus === 'failed' ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Failed
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-[250px] text-xs">
                                {candidate.processingError || 'Processing failed'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : candidate.matchScore !== null ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-2xl font-bold ${
                              candidate.matchScore >= 70
                                ? 'text-green-600'
                                : candidate.matchScore >= 40
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {candidate.matchScore}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            /100
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {candidate.fitVerdict && (
                        <Badge
                          variant={
                            candidate.fitVerdict === 'Good Fit'
                              ? 'default'
                              : candidate.fitVerdict === 'Moderate Fit'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {candidate.fitVerdict}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {candidate.matchedSkills.slice(0, 3).map((skill, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="border-green-500 text-green-700"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {candidate.matchedSkills.length > 3 && (
                          <Badge variant="outline">
                            +{candidate.matchedSkills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {candidate.missingSkills.slice(0, 2).map((skill, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="border-red-500 text-red-700">
                            {skill}
                          </Badge>
                        ))}
                        {candidate.missingSkills.length > 2 && (
                          <Badge variant="outline">
                            +{candidate.missingSkills.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {candidate.totalExperienceYears !== null
                        ? `${candidate.totalExperienceYears} years`
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {candidate.processingStatus === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetryCandidate(candidate.id)}
                            disabled={actionLoading === candidate.id}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Retry processing"
                          >
                            {actionLoading === candidate.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {candidate.processingStatus === 'completed' && (
                          <Link
                            href={`/jobs/${params.jobId}/candidate/${candidate.id}`}
                          >
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        )}
                        <a href={candidate.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteTargets([candidate.id]);
                            setShowDeleteConfirm(true);
                          }}
                          disabled={actionLoading === candidate.id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete candidate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTargets.length === 1 ? 'candidate' : `${deleteTargets.length} candidates`}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTargets.length === 1 ? 'this candidate' : `these ${deleteTargets.length} candidates`} and
              their resume files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading === 'bulk-delete'}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteTargets.length === 1) {
                  handleDeleteCandidate(deleteTargets[0]);
                  setShowDeleteConfirm(false);
                  setDeleteTargets([]);
                } else {
                  handleBulkDelete();
                }
              }}
              disabled={actionLoading === 'bulk-delete'}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === 'bulk-delete' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credit Confirmation Dialog */}
      <CreditConfirmDialog
        open={showCreditConfirm}
        onOpenChange={setShowCreditConfirm}
        featureType="SCREENING"
        quantity={pendingCandidates.length}
        actionLabel={`Screen ${pendingCandidates.length} resume${pendingCandidates.length !== 1 ? 's' : ''}`}
        onConfirm={handleProcess}
      />

      {/* Quick Enroll Modal */}
      <QuickEnrollModal
        open={showOutreachModal}
        onClose={() => setShowOutreachModal(false)}
        jobId={params.jobId as string}
        candidateIds={selectedCandidates}
        onSuccess={() => {
          setSelectedCandidates([]);
          toast.success('Candidates enrolled in sequence');
        }}
      />
    </div>
  );
}
