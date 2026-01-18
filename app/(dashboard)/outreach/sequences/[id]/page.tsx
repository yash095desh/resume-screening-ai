'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Edit,
  Users,
  Mail,
  Send,
  Eye,
  Reply,
  XCircle,
  Loader2,
  AlertCircle,
  MoreVertical,
  Pause,
  Play,
  Ban,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  totalSteps: number;
  steps: Array<{
    id: string;
    stepNumber: number;
    subject: string | null;
    bodyHtml: string | null;
    delayDays: number;
    delayHours: number;
  }>;
  stats: {
    totalEnrolled: number;
    totalEmails: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
  };
}

interface CandidateSequence {
  id: string;
  status: string;
  currentStep: number;
  startedAt: string;
  nextEmailScheduledAt: string | null;
  candidate?: {
    id: string;
    name: string;
    email: string;
    matchScore: number;
  };
  linkedInCandidate?: {
    id: string;
    name: string;
    email: string;
    matchScore: number;
    headline: string;
  };
  emails: Array<{
    id: string;
    status: string;
    sentAt: string | null;
    openedAt: string | null;
  }>;
}

export default function SequenceDetailsPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sequenceId = params.id as string;

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [candidateSequences, setCandidateSequences] = useState<CandidateSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    fetchSequenceDetails();
    fetchEnrolledCandidates();
  }, [sequenceId]);

  async function fetchSequenceDetails() {
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/sequences/${sequenceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sequence');
      }

      const data = await response.json();
      setSequence(data);
    } catch (err: any) {
      console.error('Error fetching sequence:', err);
      setError(err.message || 'Failed to load sequence');
    } finally {
      setLoading(false);
    }
  }

  async function fetchEnrolledCandidates() {
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/sequences/${sequenceId}/candidates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch enrolled candidates');
      }

      const data = await response.json();
      setCandidateSequences(data.candidateSequences);
    } catch (err: any) {
      console.error('Error fetching candidates:', err);
    }
  }

  async function pauseCandidateSequence(csId: string) {
    try {
      setActioningId(csId);
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/sequences/${sequenceId}/candidates/${csId}/pause`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to pause');
      }

      await fetchEnrolledCandidates();
    } catch (err: any) {
      alert(err.message || 'Failed to pause candidate sequence');
    } finally {
      setActioningId(null);
    }
  }

  async function resumeCandidateSequence(csId: string) {
    try {
      setActioningId(csId);
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/sequences/${sequenceId}/candidates/${csId}/resume`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to resume');
      }

      await fetchEnrolledCandidates();
    } catch (err: any) {
      alert(err.message || 'Failed to resume candidate sequence');
    } finally {
      setActioningId(null);
    }
  }

  async function cancelCandidateSequence(csId: string) {
    if (!confirm('Are you sure you want to cancel this enrollment?')) {
      return;
    }

    try {
      setActioningId(csId);
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/sequences/${sequenceId}/candidates/${csId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: 'Cancelled by user' }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel');
      }

      await fetchEnrolledCandidates();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel candidate sequence');
    } finally {
      setActioningId(null);
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      ACTIVE: 'default',
      PAUSED: 'secondary',
      COMPLETED: 'outline',
      CANCELLED: 'destructive',
      REPLIED: 'outline',
      BOUNCED: 'destructive',
      UNSUBSCRIBED: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.toLowerCase()}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Sequence not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="space-y-4 mb-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sequences
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold">{sequence.name}</h1>
              <Badge variant={sequence.isActive ? 'default' : 'secondary'}>
                {sequence.isActive ? 'Active' : 'Paused'}
              </Badge>
            </div>
            {sequence.description && (
              <p className="text-lg text-muted-foreground">
                {sequence.description}
              </p>
            )}
          </div>

          <Button onClick={() => router.push(`/outreach/sequences/${sequenceId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Sequence
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Enrolled</span>
          </div>
          <p className="text-3xl font-bold">{sequence.stats.totalEnrolled}</p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Send className="h-4 w-4" />
            <span className="text-sm font-medium">Sent</span>
          </div>
          <p className="text-3xl font-bold">{sequence.stats.sent}</p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Opened</span>
          </div>
          <p className="text-3xl font-bold">{sequence.stats.opened}</p>
          <p className="text-xs text-muted-foreground">
            {sequence.stats.sent > 0
              ? `${Math.round((sequence.stats.opened / sequence.stats.sent) * 100)}% rate`
              : '0% rate'}
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Reply className="h-4 w-4" />
            <span className="text-sm font-medium">Replied</span>
          </div>
          <p className="text-3xl font-bold">{sequence.stats.replied}</p>
          <p className="text-xs text-muted-foreground">
            {sequence.stats.sent > 0
              ? `${Math.round((sequence.stats.replied / sequence.stats.sent) * 100)}% rate`
              : '0% rate'}
          </p>
        </Card>
      </div>

      {/* Sequence Steps */}
      <Card className="p-6 mb-8 space-y-4">
        <h2 className="text-2xl font-semibold">Sequence Steps</h2>
        <div className="space-y-4">
          {sequence.steps.map((step, index) => (
            <div
              key={step.id}
              className="border border-border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {step.stepNumber}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{step.subject || 'No subject'}</p>
                    {index > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Sent {step.delayDays} days{' '}
                        {step.delayHours > 0 && `${step.delayHours} hours `}
                        after previous step
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Enrolled Candidates */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Enrolled Candidates</h2>
          <Button onClick={() => router.push(`/outreach/sequences/${sequenceId}/enroll`)}>
            <Users className="h-4 w-4 mr-2" />
            Enroll Candidates
          </Button>
        </div>

        {candidateSequences.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No candidates enrolled yet</h3>
            <p className="text-muted-foreground mb-6">
              Start enrolling candidates to begin sending emails
            </p>
            <Button onClick={() => router.push(`/outreach/sequences/${sequenceId}/enroll`)}>
              <Users className="h-4 w-4 mr-2" />
              Enroll Candidates
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Current Step</TableHead>
                <TableHead>Last Email</TableHead>
                <TableHead>Next Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidateSequences.map((cs) => {
                const candidate = cs.candidate || cs.linkedInCandidate;
                const lastEmail = cs.emails[0];

                return (
                  <TableRow key={cs.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{candidate?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {candidate?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(cs.status)}</TableCell>
                    <TableCell className="text-center">
                      {cs.currentStep} / {sequence.totalSteps}
                    </TableCell>
                    <TableCell>
                      {lastEmail ? (
                        <div className="space-y-1">
                          <div className="text-sm">{getStatusBadge(lastEmail.status)}</div>
                          {lastEmail.sentAt && (
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(lastEmail.sentAt), {
                                addSuffix: true,
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No emails yet</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {cs.nextEmailScheduledAt ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDistanceToNow(new Date(cs.nextEmailScheduledAt), {
                            addSuffix: true,
                          })}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actioningId === cs.id}
                          >
                            {actioningId === cs.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {cs.status === 'ACTIVE' && (
                            <DropdownMenuItem
                              onClick={() => pauseCandidateSequence(cs.id)}
                            >
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {cs.status === 'PAUSED' && (
                            <DropdownMenuItem
                              onClick={() => resumeCandidateSequence(cs.id)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </DropdownMenuItem>
                          )}
                          {(cs.status === 'ACTIVE' || cs.status === 'PAUSED') && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => cancelCandidateSequence(cs.id)}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
