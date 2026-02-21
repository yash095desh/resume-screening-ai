'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Users, Briefcase, Loader2, ArrowLeft } from 'lucide-react';
import { CreditCostBadge } from '@/components/credits/CreditCostBadge';
import { CreditConfirmDialog } from '@/components/credits/CreditConfirmDialog';
import { useCredits } from '@/lib/credits/credit-context';

interface Job {
  id: string;
  title: string;
  createdAt: string;
  source: 'SCREENING' | 'SOURCING';
  totalCandidates: number;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  matchScore?: number;
  overallScore?: number;
  jobId?: string;
  sourcingJobId?: string;
  job?: {
    id: string;
    title: string;
  };
  sourcingJob?: {
    id: string;
    jobTitle: string;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  bodyHtml: string;
}

interface ReminderTemplate {
  id: string;
  name: string;
  type: string;
}

export default function ScheduleInterviewsPage() {
  const api = useApiClient();
  const { refreshCredits } = useCredits();
  const [activeTab, setActiveTab] = useState<'screening' | 'sourcing'>('screening');

  // Jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  // Drill-in state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  // Templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [reminder24hTemplates, setReminder24hTemplates] = useState<ReminderTemplate[]>([]);
  const [reminder6hTemplates, setReminder6hTemplates] = useState<ReminderTemplate[]>([]);

  // Scheduling
  const [scheduling, setScheduling] = useState(false);

  // Selection
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [expiryHours, setExpiryHours] = useState('48');
  const [sendImmediately, setSendImmediately] = useState(true);

  // Credit confirmation
  const [showCreditConfirm, setShowCreditConfirm] = useState(false);

  // Scheduling states
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Reminder states
  const [enable24hReminder, setEnable24hReminder] = useState(true);
  const [enable6hReminder, setEnable6hReminder] = useState(true);
  const [reminder24hTemplateId, setReminder24hTemplateId] = useState<string>('');
  const [reminder6hTemplateId, setReminder6hTemplateId] = useState<string>('');

  // Fetch jobs and templates on mount
  useEffect(() => {
    fetchJobs();
    fetchTemplates();
  }, []);

  async function fetchJobs() {
    setJobsLoading(true);
    try {
      const [screeningRes, sourcingRes] = await Promise.all([
        api.get('/api/jobs'),
        api.get('/api/sourcing'),
      ]);

      const allJobs: Job[] = [];

      if (screeningRes.ok) {
        // Backend returns array directly for /api/jobs
        const jobsArray = Array.isArray(screeningRes.data) ? screeningRes.data : (screeningRes.data?.jobs || []);
        const screeningJobs: Job[] = jobsArray.map((job: any) => ({
          id: job.id,
          title: job.title,
          createdAt: job.createdAt,
          source: 'SCREENING' as const,
          totalCandidates: job._count?.candidates ?? job.totalCandidates ?? 0,
        }));
        allJobs.push(...screeningJobs);
      }

      if (sourcingRes.ok) {
        const sourcingJobs: Job[] = (sourcingRes.data?.jobs || []).map((job: any) => ({
          id: job.id,
          title: job.title,
          createdAt: job.createdAt,
          source: 'SOURCING' as const,
          totalCandidates: job.totalProfilesFound || job.profilesSaved || 0,
        }));
        allJobs.push(...sourcingJobs);
      }

      setJobs(allJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  }

  async function fetchTemplates() {
    try {
      const [templatesRes, reminder24hRes, reminder6hRes] = await Promise.all([
        api.get('/api/email-templates?type=INTERVIEW_INVITATION'),
        api.get('/api/email-templates?type=REMINDER_24H'),
        api.get('/api/email-templates?type=REMINDER_6H'),
      ]);

      if (templatesRes.ok) {
        setEmailTemplates(templatesRes.data || []);
        if (templatesRes.data?.length > 0) {
          setSelectedTemplateId(templatesRes.data[0].id);
        }
      }

      if (reminder24hRes.ok) {
        setReminder24hTemplates(reminder24hRes.data || []);
        if (reminder24hRes.data?.length > 0) {
          setReminder24hTemplateId(reminder24hRes.data[0].id);
        }
      }

      if (reminder6hRes.ok) {
        setReminder6hTemplates(reminder6hRes.data || []);
        if (reminder6hRes.data?.length > 0) {
          setReminder6hTemplateId(reminder6hRes.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }

  async function fetchCandidatesForJob(job: Job) {
    setCandidatesLoading(true);
    setSelectedCandidates(new Set());
    try {
      const source = job.source === 'SCREENING' ? 'SCREENING' : 'SOURCING';
      const res = await api.get(`/api/candidates?jobId=${job.id}&source=${source}`);
      if (res.ok) {
        // Backend returns { candidates: [...] } when jobId is provided, or array directly when source-only
        const allCandidates: Candidate[] = res.data?.candidates || (Array.isArray(res.data) ? res.data : []);
        // Only show candidates that have an email
        setCandidates(allCandidates.filter((c) => c.email));
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setCandidatesLoading(false);
    }
  }

  function handleJobClick(job: Job) {
    setSelectedJob(job);
    fetchCandidatesForJob(job);
  }

  function handleBackToJobs() {
    setSelectedJob(null);
    setCandidates([]);
    setSelectedCandidates(new Set());
  }

  function toggleCandidate(candidateId: string) {
    const newSelection = new Set(selectedCandidates);
    if (newSelection.has(candidateId)) {
      newSelection.delete(candidateId);
    } else {
      newSelection.add(candidateId);
    }
    setSelectedCandidates(newSelection);
  }

  function selectAll() {
    const newSelection = new Set(selectedCandidates);
    candidates.forEach((c) => newSelection.add(c.id));
    setSelectedCandidates(newSelection);
  }

  function deselectAll() {
    setSelectedCandidates(new Set());
  }

  function openScheduleModal() {
    if (selectedCandidates.size === 0) return;

    if (emailTemplates.length > 0 && selectedTemplateId) {
      const template = emailTemplates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setCustomSubject(template.subject);
        setCustomMessage('');
      }
    }

    setShowModal(true);
  }

  async function scheduleInterviews() {
    if (selectedCandidates.size === 0) return;

    setScheduling(true);

    try {
      const selected = candidates.filter((c) => selectedCandidates.has(c.id));

      const promises = selected.map((candidate) => {
        const payload: any = {
          source: candidate.jobId ? 'SCREENING' : 'SOURCING',
          expiryHours: parseInt(expiryHours),
          sendEmailNow: sendImmediately,
        };

        if (candidate.jobId) {
          payload.candidateId = candidate.id;
          payload.jobId = candidate.jobId;
        } else {
          payload.linkedInCandidateId = candidate.id;
          payload.sourcingJobId = candidate.sourcingJobId;
        }

        if (customSubject) payload.customEmailSubject = customSubject;
        if (customMessage) payload.customEmailBody = customMessage;
        if (selectedTemplateId) payload.emailTemplateId = selectedTemplateId;

        if (!sendImmediately && scheduledDate && scheduledTime) {
          const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
          payload.scheduledSendAt = scheduledDateTime.toISOString();
        }

        payload.enable24hReminder = enable24hReminder;
        payload.enable6hReminder = enable6hReminder;
        if (enable24hReminder && reminder24hTemplateId) {
          payload.reminder24hTemplateId = reminder24hTemplateId;
        }
        if (enable6hReminder && reminder6hTemplateId) {
          payload.reminder6hTemplateId = reminder6hTemplateId;
        }

        return api.post('/api/interviews', payload);
      });

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.ok).length;

      if (successCount > 0) await refreshCredits();

      alert(`Successfully scheduled ${successCount}/${selected.length} interviews! (${successCount * 145} credits reserved — billed at 21 cr/min, unused refunded)`);

      setSelectedCandidates(new Set());
      setShowModal(false);
      setCustomSubject('');
      setCustomMessage('');
      setScheduledDate('');
      setScheduledTime('');
      setSendImmediately(true);
      setEnable24hReminder(true);
      setEnable6hReminder(true);
    } catch (error) {
      console.error('Error scheduling interviews:', error);
      alert('Failed to schedule interviews. Please try again.');
    } finally {
      setScheduling(false);
    }
  }

  // ─── Job Cards Landing View ───────────────────────────────────────────

  if (!selectedJob) {
    const screeningJobs = jobs.filter((j) => j.source === 'SCREENING');
    const sourcingJobs = jobs.filter((j) => j.source === 'SOURCING');

    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold">Schedule Interviews</h1>
          <p className="text-lg text-muted-foreground">
            Select a job to choose candidates for AI-powered interviews
          </p>
        </div>

        {jobsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'screening' | 'sourcing')}
            className="w-full"
          >
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
                      onClick={() => handleJobClick(job)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-lg line-clamp-2">{job.title}</h3>
                          <Badge variant="secondary" className="shrink-0">
                            Resume
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{job.totalCandidates} candidates</p>
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
                      onClick={() => handleJobClick(job)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-lg line-clamp-2">{job.title}</h3>
                          <Badge variant="secondary" className="shrink-0">
                            Sourced
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{job.totalCandidates} candidates</p>
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
        )}
      </div>
    );
  }

  // ─── Candidate List View (drilled into a job) ─────────────────────────

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Schedule Interviews</h1>
            <p className="text-lg text-muted-foreground">
              Select candidates for AI-powered interviews
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToJobs}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </div>

      {/* Current Job Info */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{selectedJob.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">
                {selectedJob.source === 'SCREENING' ? 'Resume Screening' : 'AI Sourcing'}
              </Badge>
              <span>·</span>
              <span>{candidates.length} candidates with email</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedCandidates.size > 0 && (
              <CreditCostBadge feature="INTERVIEW" quantity={selectedCandidates.size} />
            )}
            <Button
              onClick={openScheduleModal}
              disabled={selectedCandidates.size === 0}
              size="lg"
            >
              <Mail className="mr-2 h-4 w-4" />
              Schedule {selectedCandidates.size > 0 && `(${selectedCandidates.size})`}
            </Button>
          </div>
        </div>
      </Card>

      {/* Candidates */}
      {candidatesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No candidates with email</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Only candidates with an email address can be scheduled for interviews.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedCandidates.size > 0
                ? `${selectedCandidates.size} candidate(s) selected`
                : `${candidates.length} candidate(s) available`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Clear
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {candidates.map((candidate) => (
              <Card
                key={candidate.id}
                className={`cursor-pointer transition-all ${
                  selectedCandidates.has(candidate.id)
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:shadow-md'
                }`}
                onClick={() => toggleCandidate(candidate.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedCandidates.has(candidate.id)}
                      onCheckedChange={() => toggleCandidate(candidate.id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{candidate.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {candidate.email}
                          </p>
                        </div>

                        {(candidate.matchScore != null || candidate.overallScore != null) && (
                          <Badge variant="secondary" className="shrink-0">
                            Score: {candidate.matchScore ?? candidate.overallScore ?? 0}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="min-w-5xl min-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Schedule Interviews</DialogTitle>
            <DialogDescription>
              Configure interview details for {selectedCandidates.size} candidate(s)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="grid md:grid-cols-2 gap-6 py-4">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Email Template */}
                <div className="space-y-2">
                  <Label>Email Template</Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Subject */}
                <div className="space-y-2">
                  <Label>Email Subject (optional override)</Label>
                  <Input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Leave empty to use template subject"
                  />
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <Label>Additional Message (optional)</Label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add any custom message to include in the email"
                    rows={3}
                  />
                </div>

                {/* Expiry Hours */}
                <div className="space-y-2">
                  <Label>Link Expiry (hours)</Label>
                  <Input
                    type="number"
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(e.target.value)}
                    min="1"
                    max="168"
                  />
                  <p className="text-xs text-muted-foreground">
                    Interview links will expire after this duration
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Send Immediately */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendImmediately"
                      checked={sendImmediately}
                      onCheckedChange={(checked) => setSendImmediately(checked as boolean)}
                    />
                    <Label htmlFor="sendImmediately" className="cursor-pointer">
                      Send invitation emails immediately
                    </Label>
                  </div>

                  {/* Schedule Send */}
                  {!sendImmediately && (
                    <div className="pl-6 space-y-3 border-l-2 border-border">
                      <Label className="text-sm font-semibold">Schedule Send</Label>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="scheduledDate" className="text-xs">Date</Label>
                          <Input
                            id="scheduledDate"
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            required={!sendImmediately}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="scheduledTime" className="text-xs">Time</Label>
                          <Input
                            id="scheduledTime"
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            required={!sendImmediately}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
                            setScheduledDate(oneHourLater.toISOString().split('T')[0]);
                            setScheduledTime(oneHourLater.toTimeString().slice(0, 5));
                          }}
                        >
                          In 1 Hour
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const fourHoursLater = new Date(Date.now() + 4 * 60 * 60 * 1000);
                            setScheduledDate(fourHoursLater.toISOString().split('T')[0]);
                            setScheduledTime(fourHoursLater.toTimeString().slice(0, 5));
                          }}
                        >
                          In 4 Hours
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setHours(9, 0, 0, 0);
                            setScheduledDate(tomorrow.toISOString().split('T')[0]);
                            setScheduledTime('09:00');
                          }}
                        >
                          Tomorrow 9AM
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-3 block">Automated Reminders</Label>

                  {/* 24h Reminder */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enable24hReminder"
                        checked={enable24hReminder}
                        onCheckedChange={(checked) => setEnable24hReminder(checked as boolean)}
                      />
                      <Label htmlFor="enable24hReminder" className="cursor-pointer">
                        Send 24-hour gentle reminder
                      </Label>
                    </div>

                    {enable24hReminder && (
                      <div className="pl-6 space-y-2">
                        <Label htmlFor="reminder24hTemplate" className="text-xs">Template</Label>
                        <Select value={reminder24hTemplateId} onValueChange={setReminder24hTemplateId}>
                          <SelectTrigger id="reminder24hTemplate">
                            <SelectValue placeholder="Select reminder template" />
                          </SelectTrigger>
                          <SelectContent>
                            {reminder24hTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* 6h Reminder */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enable6hReminder"
                        checked={enable6hReminder}
                        onCheckedChange={(checked) => setEnable6hReminder(checked as boolean)}
                      />
                      <Label htmlFor="enable6hReminder" className="cursor-pointer">
                        Send 6-hour urgent reminder
                      </Label>
                    </div>

                    {enable6hReminder && (
                      <div className="pl-6 space-y-2">
                        <Label htmlFor="reminder6hTemplate" className="text-xs">Template</Label>
                        <Select value={reminder6hTemplateId} onValueChange={setReminder6hTemplateId}>
                          <SelectTrigger id="reminder6hTemplate">
                            <SelectValue placeholder="Select reminder template" />
                          </SelectTrigger>
                          <SelectContent>
                            {reminder6hTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => { setShowModal(false); setShowCreditConfirm(true); }} disabled={scheduling}>
              {scheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {scheduling ? 'Scheduling...' : 'Schedule Interviews'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Confirmation Dialog */}
      <CreditConfirmDialog
        open={showCreditConfirm}
        onOpenChange={setShowCreditConfirm}
        featureType="INTERVIEW"
        quantity={selectedCandidates.size}
        actionLabel={`Schedule ${selectedCandidates.size} interview${selectedCandidates.size !== 1 ? 's' : ''}`}
        onConfirm={scheduleInterviews}
      />
    </div>
  );
}
