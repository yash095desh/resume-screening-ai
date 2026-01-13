'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Loader2,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Copy
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
  lastReminderAt?: string;
  scheduledSendAt?: string;
  enable24hReminder: boolean;
  enable6hReminder: boolean;
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

interface GroupedInterviews {
  jobId: string;
  jobTitle: string;
  interviews: Interview[];
  statusCounts: Record<string, number>;
}

export default function InterviewTrackingPage() {
  const api = useApiClient();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showScheduled, setShowScheduled] = useState(true);

  // Detail modal
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Action states
  const [resending, setResending] = useState<string | null>(null);
  const [reminding, setReminding] = useState<string | null>(null);

  // Expansion state
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

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
        // Auto-expand first job
        if (data && data.length > 0 && expandedJobs.size === 0) {
          const firstJobId = getJobId(data[0]);
          if (firstJobId) setExpandedJobs(new Set([firstJobId]));
        }
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

  function getJobId(interview: Interview): string {
    return interview.job?.id || interview.sourcingJob?.id || 'unknown';
  }

  function getJobTitle(interview: Interview): string {
    return interview.job?.title || interview.sourcingJob?.jobTitle || 'Unknown Position';
  }

  function getCandidateName(interview: Interview): string {
    return interview.candidate?.name || interview.linkedInCandidate?.fullName || 'Unknown';
  }

  function getCandidateEmail(interview: Interview): string {
    return interview.candidate?.email || interview.linkedInCandidate?.email || 'N/A';
  }

  function groupInterviewsByJob(): GroupedInterviews[] {
    const grouped = new Map<string, GroupedInterviews>();

    // Filter out scheduled interviews from the main list
    const activeInterviews = interviews.filter(interview => {
      // An interview is "scheduled" if it's PENDING and has scheduledSendAt
      return !(interview.status === 'PENDING' && interview.scheduledSendAt);
    });

    activeInterviews.forEach(interview => {
      const jobId = getJobId(interview);
      const jobTitle = getJobTitle(interview);

      if (!grouped.has(jobId)) {
        grouped.set(jobId, {
          jobId,
          jobTitle,
          interviews: [],
          statusCounts: {},
        });
      }

      const group = grouped.get(jobId)!;
      group.interviews.push(interview);

      // Count statuses
      const status = interview.status;
      group.statusCounts[status] = (group.statusCounts[status] || 0) + 1;
    });

    return Array.from(grouped.values());
  }

  function getScheduledInterviews(): Interview[] {
    return interviews.filter(interview =>
      interview.status === 'PENDING' && interview.scheduledSendAt
    );
  }

  function toggleJobExpansion(jobId: string) {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
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

  function canResend(interview: Interview): boolean {
    return ['LINK_SENT', 'LINK_OPENED'].includes(interview.status);
  }

  function canRemind(interview: Interview): boolean {
    return ['LINK_SENT', 'LINK_OPENED'].includes(interview.status);
  }

  function isExpiringSoon(interview: Interview): boolean {
    const hoursUntilExpiry = (new Date(interview.linkExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilExpiry < 24 && hoursUntilExpiry > 0;
  }

  function openDetailModal(interview: Interview) {
    setSelectedInterview(interview);
    setShowDetailModal(true);
  }

  const groupedInterviews = groupInterviewsByJob();
  const scheduledInterviews = getScheduledInterviews();

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
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
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
        <div className="space-y-6">
          {/* Scheduled Interviews Section */}
          {scheduledInterviews.length > 0 && showScheduled && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Scheduled Invitations
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {scheduledInterviews.length} invitation{scheduledInterviews.length !== 1 ? 's' : ''} scheduled to be sent
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowScheduled(false)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Scheduled Send Time</TableHead>
                      <TableHead>Reminders Enabled</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledInterviews.map(interview => {
                      const scheduledDate = interview.scheduledSendAt ? new Date(interview.scheduledSendAt) : null;
                      const isPastScheduledTime = scheduledDate && scheduledDate < new Date();
                      const hoursUntilSend = scheduledDate
                        ? (scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60)
                        : 0;

                      return (
                        <TableRow key={interview.id} className="hover:bg-blue-100/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{getCandidateName(interview)}</p>
                              <p className="text-xs text-muted-foreground">
                                {getCandidateEmail(interview)}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <p className="text-sm">{getJobTitle(interview)}</p>
                          </TableCell>

                          <TableCell>
                            {scheduledDate ? (
                              <div>
                                <p className="text-sm font-medium">
                                  {format(scheduledDate, 'MMM d, yyyy h:mm a')}
                                </p>
                                {isPastScheduledTime ? (
                                  <Badge variant="outline" className="mt-1 bg-orange-100 text-orange-800 text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Should have sent
                                  </Badge>
                                ) : (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    in {Math.round(hoursUntilSend)}h
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not set</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex gap-1">
                              {interview.enable24hReminder && (
                                <Badge variant="outline" className="text-xs">
                                  24h
                                </Badge>
                              )}
                              {interview.enable6hReminder && (
                                <Badge variant="outline" className="text-xs">
                                  6h
                                </Badge>
                              )}
                              {!interview.enable24hReminder && !interview.enable6hReminder && (
                                <span className="text-xs text-muted-foreground">None</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(interview.linkExpiresAt), 'MMM d, h:mm a')}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDetailModal(interview)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resendInvitation(interview.id)}
                                disabled={resending === interview.id}
                                title="Send now"
                              >
                                {resending === interview.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Active Interviews Section */}
          {groupedInterviews.map(group => (
            <Collapsible
              key={group.jobId}
              open={expandedJobs.has(group.jobId)}
              onOpenChange={() => toggleJobExpansion(group.jobId)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedJobs.has(group.jobId) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            {group.jobTitle}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {group.interviews.length} interview{group.interviews.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {Object.entries(group.statusCounts).map(([status, count]) => {
                          const statusInfo = getStatusInfo(status);
                          return (
                            <Badge key={status} className={statusInfo.color}>
                              {count} {statusInfo.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Timeline</TableHead>
                          <TableHead className="text-center">Reminders</TableHead>
                          <TableHead>Expiry</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.interviews.map(interview => {
                          const statusInfo = getStatusInfo(interview.status);
                          const StatusIcon = statusInfo.icon;
                          const isExpired = new Date(interview.linkExpiresAt) < new Date();
                          const hoursUntilExpiry = (new Date(interview.linkExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
                          const expiringSoon = isExpiringSoon(interview);

                          return (
                            <TableRow key={interview.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div>
                                  <p className="font-medium">{getCandidateName(interview)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {getCandidateEmail(interview)}
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell>
                                <Badge className={statusInfo.color}>
                                  <StatusIcon className="mr-1 h-3 w-3" />
                                  {statusInfo.label}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  {interview.linkSentAt && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      <span>
                                        Sent {formatDistanceToNow(new Date(interview.linkSentAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                  )}
                                  {interview.lastReminderAt && interview.remindersSent > 0 && (
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <Send className="h-3 w-3" />
                                      <span>
                                        Reminder sent {formatDistanceToNow(new Date(interview.lastReminderAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                  )}
                                  {interview.linkOpenedAt && (
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      <span>
                                        Opened {formatDistanceToNow(new Date(interview.linkOpenedAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                  )}
                                  {interview.startedAt && (
                                    <div className="flex items-center gap-1">
                                      <Video className="h-3 w-3" />
                                      <span>
                                        Started {formatDistanceToNow(new Date(interview.startedAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                  )}
                                  {interview.completedAt && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      <span>
                                        Completed {formatDistanceToNow(new Date(interview.completedAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell className="text-center">
                                <Badge variant="outline">
                                  {interview.remindersSent}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                {!isExpired && expiringSoon && ['LINK_SENT', 'LINK_OPENED'].includes(interview.status) ? (
                                  <div className="flex items-center gap-1 text-orange-600 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>{Math.round(hoursUntilExpiry)}h left</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(interview.linkExpiresAt), 'MMM d, h:mm a')}
                                  </span>
                                )}
                              </TableCell>

                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDetailModal(interview)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>

                                  {canResend(interview) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => resendInvitation(interview.id)}
                                      disabled={resending === interview.id}
                                    >
                                      {resending === interview.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}

                                  {canRemind(interview) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => sendReminder(interview.id, hoursUntilExpiry < 12 ? 'urgent' : 'gentle')}
                                      disabled={reminding === interview.id || interview.remindersSent >= 2}
                                    >
                                      {reminding === interview.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Send className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
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

                {selectedInterview.scheduledSendAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scheduled Send</p>
                    <p className="text-sm">
                      {format(new Date(selectedInterview.scheduledSendAt), 'PPp')}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reminders Sent</p>
                  <p className="text-sm">{selectedInterview.remindersSent}</p>
                </div>

                {selectedInterview.lastReminderAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Reminder</p>
                    <p className="text-sm">
                      {format(new Date(selectedInterview.lastReminderAt), 'PPp')}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reminders Enabled</p>
                  <div className="flex gap-1 mt-1">
                    {selectedInterview.enable24hReminder && (
                      <Badge variant="outline" className="text-xs">24h</Badge>
                    )}
                    {selectedInterview.enable6hReminder && (
                      <Badge variant="outline" className="text-xs">6h</Badge>
                    )}
                    {!selectedInterview.enable24hReminder && !selectedInterview.enable6hReminder && (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
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
                    <Copy className="h-4 w-4" />
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
