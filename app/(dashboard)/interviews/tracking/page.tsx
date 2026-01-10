'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  Mail,
  Video,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send,
  RotateCcw,
  Eye,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Interview {
  id: string;
  status: string;
  source: 'SCREENING' | 'SOURCING';
  linkToken: string;
  linkUrl: string;
  linkExpiresAt: string;
  linkSentAt?: string;
  linkOpenedAt?: string;
  startedAt?: string;
  completedAt?: string;
  abandonedAt?: string;
  duration?: number;
  remindersSent: number;
  vapiAssistantId?: string;
  vapiCallId?: string;
  candidate?: {
    id: string;
    name: string;
    email: string;
    matchScore?: number;
  };
  linkedInCandidate?: {
    id: string;
    fullName: string;
    email: string;
    overallScore?: number;
  };
  job?: {
    id: string;
    title: string;
  };
  sourcingJob?: {
    id: string;
    jobTitle: string;
  };
}

export default function InterviewTrackingPage() {
  const api = useApiClient();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Detail modal
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Action states
  const [resending, setResending] = useState<string | null>(null);
  const [reminding, setReminding] = useState<string | null>(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchInterviews();
    const interval = setInterval(fetchInterviews, 30000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  async function fetchInterviews() {
    try {
      const endpoint = statusFilter === 'all'
        ? '/api/interviews'
        : `/api/interviews?status=${statusFilter}`;

      const { data, ok } = await api.get(endpoint);
      if (ok) {
        setInterviews(data || []);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  }

  async function resendInvitation(interviewId: string) {
    setResending(interviewId);
    try {
      const { ok } = await api.post(`/api/interviews/${interviewId}/resend`);
      if (ok) {
        alert('Invitation resent successfully!');
        fetchInterviews();
      } else {
        alert('Failed to resend invitation');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Error resending invitation');
    } finally {
      setResending(null);
    }
  }

  async function sendReminder(interviewId: string, urgency: 'gentle' | 'urgent') {
    setReminding(interviewId);
    try {
      const { ok } = await api.post(`/api/interviews/${interviewId}/remind`, { urgency });
      if (ok) {
        alert(`${urgency === 'gentle' ? 'Gentle' : 'Urgent'} reminder sent successfully!`);
        fetchInterviews();
      } else {
        alert('Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Error sending reminder');
    } finally {
      setReminding(null);
    }
  }

  function getStatusInfo(status: string) {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock },
      LINK_SENT: { label: 'Invitation Sent', color: 'bg-blue-100 text-blue-800', icon: Mail },
      LINK_OPENED: { label: 'Link Opened', color: 'bg-cyan-100 text-cyan-800', icon: Eye },
      IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Video },
      COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      ABANDONED: { label: 'Abandoned', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
      EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: Clock },
      NO_SHOW: { label: 'No Show', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
    };

    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
  }

  function getCandidateName(interview: Interview): string {
    return interview.candidate?.name || interview.linkedInCandidate?.fullName || 'Unknown';
  }

  function getCandidateEmail(interview: Interview): string {
    return interview.candidate?.email || interview.linkedInCandidate?.email || 'N/A';
  }

  function getJobTitle(interview: Interview): string {
    return interview.job?.title || interview.sourcingJob?.jobTitle || 'N/A';
  }

  function canResend(interview: Interview): boolean {
    return ['LINK_SENT', 'LINK_OPENED'].includes(interview.status);
  }

  function canRemind(interview: Interview): boolean {
    return ['LINK_SENT', 'LINK_OPENED'].includes(interview.status);
  }

  function renderInterviewCard(interview: Interview) {
    const statusInfo = getStatusInfo(interview.status);
    const StatusIcon = statusInfo.icon;

    const isExpired = new Date(interview.linkExpiresAt) < new Date();
    const hoursUntilExpiry = (new Date(interview.linkExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60);

    return (
      <Card key={interview.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{getCandidateName(interview)}</h3>
                <p className="text-sm text-muted-foreground">{getCandidateEmail(interview)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getJobTitle(interview)}
                </p>
              </div>

              <Badge className={statusInfo.color}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </div>

            {/* Timeline */}
            <div className="space-y-2 text-sm text-muted-foreground">
              {interview.linkSentAt && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>
                    Sent {formatDistanceToNow(new Date(interview.linkSentAt), { addSuffix: true })}
                  </span>
                </div>
              )}

              {interview.linkOpenedAt && (
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>
                    Opened {formatDistanceToNow(new Date(interview.linkOpenedAt), { addSuffix: true })}
                  </span>
                </div>
              )}

              {interview.startedAt && (
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span>
                    Started {formatDistanceToNow(new Date(interview.startedAt), { addSuffix: true })}
                  </span>
                </div>
              )}

              {interview.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    Completed {formatDistanceToNow(new Date(interview.completedAt), { addSuffix: true })}
                    {interview.duration && ` (${Math.round(interview.duration / 60)} min)`}
                  </span>
                </div>
              )}

              {/* Expiry warning */}
              {!isExpired && hoursUntilExpiry < 24 && ['LINK_SENT', 'LINK_OPENED'].includes(interview.status) && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Expires in {Math.round(hoursUntilExpiry)} hours
                  </span>
                </div>
              )}

              {/* Reminders sent */}
              {interview.remindersSent > 0 && (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  <span>{interview.remindersSent} reminder(s) sent</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedInterview(interview);
                  setShowDetailModal(true);
                }}
              >
                View Details
              </Button>

              {canResend(interview) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resendInvitation(interview.id)}
                  disabled={resending === interview.id}
                >
                  {resending === interview.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Resend
                    </>
                  )}
                </Button>
              )}

              {canRemind(interview) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendReminder(interview.id, hoursUntilExpiry < 12 ? 'urgent' : 'gentle')}
                  disabled={reminding === interview.id || interview.remindersSent >= 2}
                >
                  {reminding === interview.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="mr-1 h-3 w-3" />
                      Remind
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interview Tracking</h1>
          <p className="mt-2 text-muted-foreground">
            Monitor scheduled interviews and their progress
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="LINK_SENT">Invitation Sent</SelectItem>
              <SelectItem value="LINK_OPENED">Link Opened</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ABANDONED">Abandoned</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="NO_SHOW">No Show</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchInterviews}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Video className="h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold">No interviews found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Schedule interviews from the Schedule page
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {interviews.map(renderInterviewCard)}
        </div>
      )}

      {/* Detail Modal */}
      {selectedInterview && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Interview Details</DialogTitle>
              <DialogDescription>
                {getCandidateName(selectedInterview)} - {getJobTitle(selectedInterview)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusInfo(selectedInterview.status).color}>
                    {getStatusInfo(selectedInterview.status).label}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Source</p>
                  <p className="text-sm">{selectedInterview.source}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{getCandidateEmail(selectedInterview)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reminders Sent</p>
                  <p className="text-sm">{selectedInterview.remindersSent}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Link Expires</p>
                  <p className="text-sm">
                    {format(new Date(selectedInterview.linkExpiresAt), 'PPp')}
                  </p>
                </div>

                {selectedInterview.duration && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                    <p className="text-sm">{Math.round(selectedInterview.duration / 60)} minutes</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Interview Link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedInterview.linkUrl}
                    className="flex-1 rounded-md border px-3 py-2 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedInterview.linkUrl);
                      alert('Link copied to clipboard!');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
