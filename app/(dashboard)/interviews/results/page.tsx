'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Sparkles,
  Clock,
  Briefcase,
  Loader2,
  ChevronDown,
  ChevronRight,
  Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface InterviewAnalysis {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  cultureFitScore: number;
  strengths: string[];
  concerns: string[];
  keyInsights: string;
  recommendation: 'STRONG_YES' | 'YES' | 'MAYBE' | 'NO';
  detailedAnalysis: {
    technicalSkills: string;
    problemSolving: string;
    communication: string;
    experience: string;
    cultureFit: string;
  };
}

interface Interview {
  id: string;
  status: string;
  source: 'SCREENING' | 'SOURCING';
  completedAt?: string;
  duration?: number;
  transcript?: string;
  analysis?: InterviewAnalysis;
  candidate?: {
    id: string;
    name: string;
    email: string;
  };
  linkedInCandidate?: {
    id: string;
    fullName: string;
    email: string;
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
  avgScore: number;
  strongYesCount: number;
  yesCount: number;
  maybeCount: number;
  noCount: number;
}

export default function InterviewResultsPage() {
  const api = useApiClient();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCompletedInterviews();
  }, []);

  async function fetchCompletedInterviews() {
    setLoading(true);
    try {
      const { data, ok } = await api.get('/api/interviews?status=COMPLETED');
      if (ok) {
        setInterviews(data || []);
        // Auto-expand first job
        if (data && data.length > 0) {
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

  async function analyzeInterview(interviewId: string) {
    setAnalyzing(interviewId);
    try {
      const { data, ok } = await api.post(`/api/interviews/${interviewId}/analyze`);
      if (ok) {
        setInterviews(prev =>
          prev.map(i => (i.id === interviewId ? { ...i, analysis: data.analysis } : i))
        );
      } else {
        alert('Failed to analyze interview');
      }
    } catch (error) {
      console.error('Error analyzing interview:', error);
      alert('Error analyzing interview');
    } finally {
      setAnalyzing(null);
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

  function groupInterviewsByJob(): GroupedInterviews[] {
    const grouped = new Map<string, GroupedInterviews>();

    interviews.forEach(interview => {
      const jobId = getJobId(interview);
      const jobTitle = getJobTitle(interview);

      if (!grouped.has(jobId)) {
        grouped.set(jobId, {
          jobId,
          jobTitle,
          interviews: [],
          avgScore: 0,
          strongYesCount: 0,
          yesCount: 0,
          maybeCount: 0,
          noCount: 0,
        });
      }

      const group = grouped.get(jobId)!;
      group.interviews.push(interview);

      // Update counts
      if (interview.analysis) {
        const rec = interview.analysis.recommendation;
        if (rec === 'STRONG_YES') group.strongYesCount++;
        else if (rec === 'YES') group.yesCount++;
        else if (rec === 'MAYBE') group.maybeCount++;
        else if (rec === 'NO') group.noCount++;
      }
    });

    // Calculate average scores
    grouped.forEach(group => {
      const scoresSum = group.interviews
        .filter(i => i.analysis)
        .reduce((sum, i) => sum + (i.analysis?.overallScore || 0), 0);
      const analyzedCount = group.interviews.filter(i => i.analysis).length;
      group.avgScore = analyzedCount > 0 ? Math.round(scoresSum / analyzedCount) : 0;
    });

    return Array.from(grouped.values()).sort((a, b) => b.avgScore - a.avgScore);
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

  function getRecommendationInfo(recommendation: string) {
    const recMap: Record<string, { label: string; color: string; icon: any }> = {
      STRONG_YES: { label: 'Strong Yes', color: 'bg-green-500 text-white', icon: CheckCircle },
      YES: { label: 'Yes', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      MAYBE: { label: 'Maybe', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      NO: { label: 'No', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    };

    return recMap[recommendation] || { label: recommendation, color: 'bg-gray-100', icon: AlertCircle };
  }

  function renderScoreCard(title: string, score: number, icon: any) {
    const Icon = icon;
    const color =
      score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${color}`} />
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
            </div>
            <span className={`text-2xl font-bold ${color}`}>{score}</span>
          </div>
          <Progress value={score} className="h-2" />
        </CardContent>
      </Card>
    );
  }

  function parseTranscript(transcript: string): { speaker: string; message: string }[] {
    if (!transcript) return [];

    // Try to parse as structured format (Speaker: Message)
    const lines = transcript.split('\n').filter(line => line.trim());
    const parsed: { speaker: string; message: string }[] = [];

    lines.forEach(line => {
      // Remove optional timestamp prefix like [10:30:45 AM]
      const cleanedLine = line.replace(/^\[[\d:APM\s]+\]\s*/, '');

      // Match various speaker formats: "AI Interviewer:", "Candidate:", "Interviewer:", "AI:", "User:"
      const match = cleanedLine.match(/^(AI\s+Interviewer|Interviewer|Candidate|AI|User|Bot|Assistant):\s*(.+)/i);
      if (match) {
        let speaker = match[1];
        // Normalize speaker names
        if (speaker.toLowerCase().includes('ai') || speaker.toLowerCase().includes('interviewer') || speaker.toLowerCase().includes('bot') || speaker.toLowerCase().includes('assistant')) {
          speaker = 'AI Interviewer';
        } else if (speaker.toLowerCase().includes('candidate') || speaker.toLowerCase().includes('user')) {
          speaker = 'Candidate';
        }

        parsed.push({
          speaker: speaker,
          message: match[2],
        });
      } else {
        // If no match, add to previous message or create unknown speaker
        if (parsed.length > 0) {
          parsed[parsed.length - 1].message += '\n' + cleanedLine;
        } else {
          parsed.push({ speaker: 'Unknown', message: cleanedLine });
        }
      }
    });

    return parsed;
  }

  function openDetailModal(interview: Interview) {
    setSelectedInterview(interview);
    setShowModal(true);
  }

  const groupedInterviews = groupInterviewsByJob();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interview Results</h1>
          <p className="mt-2 text-muted-foreground">
            View AI-powered analysis of completed interviews
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
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
            <FileText className="h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold">No completed interviews</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Completed interviews will appear here for analysis
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
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
                            {group.interviews.length} completed interview{group.interviews.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {group.avgScore > 0 && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{group.avgScore}</p>
                            <p className="text-xs text-muted-foreground">Avg Score</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          {group.strongYesCount > 0 && (
                            <Badge className="bg-green-500 text-white">
                              {group.strongYesCount} Strong Yes
                            </Badge>
                          )}
                          {group.yesCount > 0 && (
                            <Badge className="bg-green-100 text-green-800">
                              {group.yesCount} Yes
                            </Badge>
                          )}
                          {group.maybeCount > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              {group.maybeCount} Maybe
                            </Badge>
                          )}
                          {group.noCount > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                              {group.noCount} No
                            </Badge>
                          )}
                        </div>
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
                          <TableHead className="text-center">Overall</TableHead>
                          <TableHead className="text-center">Technical</TableHead>
                          <TableHead className="text-center">Communication</TableHead>
                          <TableHead className="text-center">Culture Fit</TableHead>
                          <TableHead>Recommendation</TableHead>
                          <TableHead className="text-center">Duration</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.interviews.map(interview => {
                          const hasAnalysis = !!interview.analysis;
                          return (
                            <TableRow key={interview.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div>
                                  <p className="font-medium">{getCandidateName(interview)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {interview.completedAt &&
                                      formatDistanceToNow(new Date(interview.completedAt), {
                                        addSuffix: true,
                                      })}
                                  </p>
                                </div>
                              </TableCell>

                              {hasAnalysis && interview.analysis ? (
                                <>
                                  <TableCell className="text-center">
                                    <span className="text-lg font-bold text-blue-600">
                                      {interview.analysis.overallScore}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-lg font-bold text-purple-600">
                                      {interview.analysis.technicalScore}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-lg font-bold text-green-600">
                                      {interview.analysis.communicationScore}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-lg font-bold text-orange-600">
                                      {interview.analysis.cultureFitScore}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className={
                                        getRecommendationInfo(interview.analysis.recommendation).color
                                      }
                                    >
                                      {
                                        getRecommendationInfo(interview.analysis.recommendation)
                                          .label
                                      }
                                    </Badge>
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell className="text-center" colSpan={5}>
                                    <span className="text-sm text-muted-foreground">
                                      Not analyzed
                                    </span>
                                  </TableCell>
                                </>
                              )}

                              <TableCell className="text-center">
                                <span className="text-sm">
                                  {interview.duration
                                    ? `${Math.round(interview.duration / 60)}m`
                                    : 'N/A'}
                                </span>
                              </TableCell>

                              <TableCell>
                                <div className="flex gap-2">
                                  {hasAnalysis ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openDetailModal(interview)}
                                    >
                                      <FileText className="mr-1 h-3 w-3" />
                                      View
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => analyzeInterview(interview.id)}
                                      disabled={analyzing === interview.id}
                                    >
                                      {analyzing === interview.id ? (
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                      ) : (
                                        <Sparkles className="mr-1 h-3 w-3" />
                                      )}
                                      Analyze
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

      {/* Detailed Analysis Modal - Made Larger */}
      {selectedInterview && selectedInterview.analysis && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="min-w-5xl min-h-[80vh] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl">{getCandidateName(selectedInterview)}</DialogTitle>
              <DialogDescription className="text-base">
                {getJobTitle(selectedInterview)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
               <Tabs defaultValue="scores" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="scores">Scores & Analysis</TabsTrigger>
                <TabsTrigger value="detailed">Detailed Breakdown</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              </TabsList>

              {/* Scores Tab */}
              <TabsContent value="scores" className="space-y-4 mt-4">
                <div className="grid grid-cols-4 gap-4">
                  {renderScoreCard('Overall', selectedInterview.analysis.overallScore, Sparkles)}
                  {renderScoreCard('Technical', selectedInterview.analysis.technicalScore, Briefcase)}
                  {renderScoreCard('Communication', selectedInterview.analysis.communicationScore, CheckCircle)}
                  {renderScoreCard('Culture Fit', selectedInterview.analysis.cultureFitScore, CheckCircle)}
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3 text-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {selectedInterview.analysis.strengths.map((strength, idx) => (
                        <li key={idx} className="flex gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3 text-lg">
                      <TrendingDown className="h-5 w-5 text-orange-600" />
                      Concerns
                    </h3>
                    <ul className="space-y-2">
                      {selectedInterview.analysis.concerns.map((concern, idx) => (
                        <li key={idx} className="flex gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2 text-lg">Key Insights</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedInterview.analysis.keyInsights}
                  </p>
                </div>
              </TabsContent>

              {/* Detailed Analysis Tab */}
              <TabsContent value="detailed" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-lg">Technical Skills</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedInterview.analysis.detailedAnalysis.technicalSkills}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 text-lg">Problem Solving</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedInterview.analysis.detailedAnalysis.problemSolving}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 text-lg">Communication</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedInterview.analysis.detailedAnalysis.communication}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 text-lg">Experience</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedInterview.analysis.detailedAnalysis.experience}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 text-lg">Culture Fit</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedInterview.analysis.detailedAnalysis.cultureFit}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Transcript Tab - Fixed Format */}
              <TabsContent value="transcript" className="mt-4">
                <div className="bg-gray-50 rounded-lg p-6 max-h-[500px] overflow-y-auto space-y-4">
                  {selectedInterview.transcript ? (
                    parseTranscript(selectedInterview.transcript).map((entry, idx) => {
                      const isCandidate = entry.speaker.toLowerCase().includes('candidate') || entry.speaker.toLowerCase().includes('user');
                      const isAI = entry.speaker.toLowerCase().includes('ai') || entry.speaker.toLowerCase().includes('interviewer') || entry.speaker.toLowerCase().includes('bot');

                      return (
                        <div
                          key={idx}
                          className={`flex gap-3 ${isCandidate ? 'flex-row-reverse' : ''}`}
                        >
                          <div
                            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                              isCandidate
                                ? 'bg-blue-600 text-white'
                                : isAI
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-400 text-white'
                            }`}
                          >
                            {isCandidate ? 'C' : isAI ? 'AI' : 'U'}
                          </div>
                          <div className={`flex-1 max-w-[80%] ${isCandidate ? 'text-right' : ''}`}>
                            <p className={`text-xs font-semibold mb-1 ${
                              isCandidate ? 'text-blue-700' : isAI ? 'text-purple-700' : 'text-gray-700'
                            }`}>
                              {entry.speaker}
                            </p>
                            <div
                              className={`rounded-lg p-4 shadow-sm ${
                                isCandidate
                                  ? 'bg-blue-50 border border-blue-200 text-blue-900'
                                  : isAI
                                  ? 'bg-purple-50 border border-purple-200 text-purple-900'
                                  : 'bg-white border border-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No transcript available
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
