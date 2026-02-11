'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Mail, Users, Briefcase, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CreditCostBadge } from '@/components/credits/CreditCostBadge';
import { CreditConfirmDialog } from '@/components/credits/CreditConfirmDialog';

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
  const [activeTab, setActiveTab] = useState<'screening' | 'sourcing'>('screening');

  // Data states
  const [screeningCandidates, setScreeningCandidates] = useState<Candidate[]>([]);
  const [sourcingCandidates, setSourcingCandidates] = useState<Candidate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [reminder24hTemplates, setReminder24hTemplates] = useState<ReminderTemplate[]>([]);
  const [reminder6hTemplates, setReminder6hTemplates] = useState<ReminderTemplate[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);

  // Selection states
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());

  // Job filtering for sourcing candidates
  const [selectedSourcingJobId, setSelectedSourcingJobId] = useState<string>('all');

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

  // Fetch candidates and templates
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch screening candidates
      const screeningRes = await api.get('/api/candidates?source=SCREENING');
      if (screeningRes.ok) {
        setScreeningCandidates(screeningRes.data || []);
      }

      // Fetch sourcing candidates
      const sourcingRes = await api.get('/api/candidates?source=SOURCING');
      if (sourcingRes.ok) {
        setSourcingCandidates(sourcingRes.data || []);
      }

      // Fetch email templates
      const templatesRes = await api.get('/api/email-templates?type=INTERVIEW_INVITATION');
      if (templatesRes.ok) {
        setEmailTemplates(templatesRes.data || []);
        if (templatesRes.data?.length > 0) {
          setSelectedTemplateId(templatesRes.data[0].id);
        }
      }

      // Fetch 24h reminder templates
      const reminder24hRes = await api.get('/api/email-templates?type=REMINDER_24H');
      if (reminder24hRes.ok) {
        setReminder24hTemplates(reminder24hRes.data || []);
        if (reminder24hRes.data?.length > 0) {
          setReminder24hTemplateId(reminder24hRes.data[0].id);
        }
      }

      // Fetch 6h reminder templates
      const reminder6hRes = await api.get('/api/email-templates?type=REMINDER_6H');
      if (reminder6hRes.ok) {
        setReminder6hTemplates(reminder6hRes.data || []);
        if (reminder6hRes.data?.length > 0) {
          setReminder6hTemplateId(reminder6hRes.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Get unique sourcing jobs
  function getUniqueSourcingJobs() {
    const jobMap = new Map<string, { id: string; title: string; count: number }>();

    sourcingCandidates.forEach(candidate => {
      if (candidate.sourcingJob) {
        const jobId = candidate.sourcingJob.id;
        if (jobMap.has(jobId)) {
          const job = jobMap.get(jobId)!;
          job.count += 1;
        } else {
          jobMap.set(jobId, {
            id: jobId,
            title: candidate.sourcingJob.jobTitle,
            count: 1,
          });
        }
      }
    });

    return Array.from(jobMap.values());
  }

  // Filter sourcing candidates by selected job
  function getFilteredSourcingCandidates() {
    if (selectedSourcingJobId === 'all') {
      return sourcingCandidates;
    }
    return sourcingCandidates.filter(c => c.sourcingJobId === selectedSourcingJobId);
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

  function selectAll(candidates: Candidate[]) {
    const newSelection = new Set(selectedCandidates);
    candidates.forEach(c => newSelection.add(c.id));
    setSelectedCandidates(newSelection);
  }

  function deselectAll() {
    setSelectedCandidates(new Set());
  }

  function openScheduleModal() {
    if (selectedCandidates.size === 0) return;

    // Get first selected candidate to determine source
    const firstSelectedId = Array.from(selectedCandidates)[0];
    const allCandidates = [...screeningCandidates, ...sourcingCandidates];
    const firstCandidate = allCandidates.find(c => c.id === firstSelectedId);

    // Pre-fill with template
    if (emailTemplates.length > 0 && selectedTemplateId) {
      const template = emailTemplates.find(t => t.id === selectedTemplateId);
      if (template) {
        setCustomSubject(template.subject);
        setCustomMessage(''); // Let backend use template
      }
    }

    setShowModal(true);
  }

  async function scheduleInterviews() {
    if (selectedCandidates.size === 0) return;

    setScheduling(true);

    try {
      const allCandidates = [...screeningCandidates, ...sourcingCandidates];
      const selected = allCandidates.filter(c => selectedCandidates.has(c.id));

      // Create interviews for each selected candidate
      const promises = selected.map(candidate => {
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

        // Add scheduling if not sending immediately
        if (!sendImmediately && scheduledDate && scheduledTime) {
          const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
          payload.scheduledSendAt = scheduledDateTime.toISOString();
        }

        // Add reminder settings
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
      const successCount = results.filter(r => r.ok).length;

      alert(`Successfully scheduled ${successCount}/${selected.length} interviews!`);

      // Reset state
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

  function renderCandidateList(candidates: Candidate[], source: 'screening' | 'sourcing') {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (candidates.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold">No candidates found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {source === 'screening'
                ? 'Upload and process resumes to see candidates here.'
                : 'Start a sourcing job to find candidates.'}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedCandidates.size > 0
              ? `${selectedCandidates.size} candidate(s) selected`
              : `${candidates.length} candidate(s) available`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectAll(candidates)}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAll}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {candidates.map(candidate => (
            <Card
              key={candidate.id}
              className={`cursor-pointer transition-all ${
                selectedCandidates.has(candidate.id)
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:shadow-md'
              }`}
              onClick={() => toggleCandidate(candidate.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedCandidates.has(candidate.id)}
                    onCheckedChange={() => toggleCandidate(candidate.id)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{candidate.name}</h3>
                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                      </div>

                      <Badge variant="secondary">
                        Score: {candidate.matchScore || candidate.overallScore || 0}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        <span>
                          {candidate.job?.title || candidate.sourcingJob?.jobTitle || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule Interviews</h1>
          <p className="mt-2 text-muted-foreground">
            Select candidates to schedule AI-powered interviews
          </p>
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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="screening">
            Resume Screening ({screeningCandidates.length})
          </TabsTrigger>
          <TabsTrigger value="sourcing">
            AI Sourcing ({sourcingCandidates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="screening" className="mt-6">
          {renderCandidateList(screeningCandidates, 'screening')}
        </TabsContent>

        <TabsContent value="sourcing" className="mt-6">
          {/* Job Filter Dropdown */}
          {sourcingCandidates.length > 0 && (
            <div className="mb-6">
              <Label htmlFor="jobFilter" className="mb-2 block">
                Filter by Job
              </Label>
              <Select
                value={selectedSourcingJobId}
                onValueChange={(value) => {
                  setSelectedSourcingJobId(value);
                  setSelectedCandidates(new Set()); // Clear selection when switching jobs
                }}
              >
                <SelectTrigger id="jobFilter" className="w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Jobs ({sourcingCandidates.length} candidates)
                  </SelectItem>
                  {getUniqueSourcingJobs().map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} ({job.count} candidates)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {renderCandidateList(getFilteredSourcingCandidates(), 'sourcing')}
        </TabsContent>
      </Tabs>

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
                      {emailTemplates.map(template => (
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
                    <div className="pl-6 space-y-3 border-l-2 border-gray-200">
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
                            {reminder24hTemplates.map(template => (
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
                            {reminder6hTemplates.map(template => (
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
