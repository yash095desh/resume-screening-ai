'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Sparkles,
  Clock,
  Briefcase,
  Loader2
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

export default function InterviewResultsPage() {
  const api = useApiClient();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  useEffect(() => {
    fetchCompletedInterviews();
  }, []);

  async function fetchCompletedInterviews() {
    setLoading(true);
    try {
      const { data, ok } = await api.get('/api/interviews?status=COMPLETED');
      if (ok) {
        setInterviews(data || []);
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
        // Update interview with analysis
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

  function getCandidateName(interview: Interview): string {
    return interview.candidate?.name || interview.linkedInCandidate?.fullName || 'Unknown';
  }

  function getJobTitle(interview: Interview): string {
    return interview.job?.title || interview.sourcingJob?.jobTitle || 'N/A';
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

  function renderInterviewCard(interview: Interview) {
    const hasAnalysis = !!interview.analysis;

    return (
      <Card key={interview.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{getCandidateName(interview)}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{getJobTitle(interview)}</p>
            </div>

            {hasAnalysis && interview.analysis && (
              <Badge className={getRecommendationInfo(interview.analysis.recommendation).color}>
                {getRecommendationInfo(interview.analysis.recommendation).label}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {interview.duration ? `${Math.round(interview.duration / 60)} min` : 'N/A'}
              </span>
            </div>
            {interview.completedAt && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(interview.completedAt), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>

          {/* Analysis Summary */}
          {hasAnalysis && interview.analysis ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {interview.analysis.overallScore}
                  </p>
                  <p className="text-xs text-muted-foreground">Overall</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {interview.analysis.technicalScore}
                  </p>
                  <p className="text-xs text-muted-foreground">Technical</p>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    View Full Analysis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{getCandidateName(interview)}</DialogTitle>
                    <DialogDescription>{getJobTitle(interview)}</DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="scores" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="scores">Scores</TabsTrigger>
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                      <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    </TabsList>

                    {/* Scores Tab */}
                    <TabsContent value="scores" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        {renderScoreCard('Overall', interview.analysis.overallScore, Sparkles)}
                        {renderScoreCard('Technical', interview.analysis.technicalScore, Briefcase)}
                        {renderScoreCard('Communication', interview.analysis.communicationScore, CheckCircle)}
                        {renderScoreCard('Culture Fit', interview.analysis.cultureFitScore, CheckCircle)}
                      </div>

                      <Separator />

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2 mb-3">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Strengths
                          </h3>
                          <ul className="space-y-2">
                            {interview.analysis.strengths.map((strength, idx) => (
                              <li key={idx} className="flex gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold flex items-center gap-2 mb-3">
                            <TrendingDown className="h-5 w-5 text-orange-600" />
                            Concerns
                          </h3>
                          <ul className="space-y-2">
                            {interview.analysis.concerns.map((concern, idx) => (
                              <li key={idx} className="flex gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                                <span>{concern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-semibold mb-2">Key Insights</h3>
                        <p className="text-sm text-muted-foreground">
                          {interview.analysis.keyInsights}
                        </p>
                      </div>
                    </TabsContent>

                    {/* Analysis Tab */}
                    <TabsContent value="analysis" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Technical Skills</h3>
                          <p className="text-sm text-muted-foreground">
                            {interview.analysis.detailedAnalysis.technicalSkills}
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="font-semibold mb-2">Problem Solving</h3>
                          <p className="text-sm text-muted-foreground">
                            {interview.analysis.detailedAnalysis.problemSolving}
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="font-semibold mb-2">Communication</h3>
                          <p className="text-sm text-muted-foreground">
                            {interview.analysis.detailedAnalysis.communication}
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="font-semibold mb-2">Experience</h3>
                          <p className="text-sm text-muted-foreground">
                            {interview.analysis.detailedAnalysis.experience}
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="font-semibold mb-2">Culture Fit</h3>
                          <p className="text-sm text-muted-foreground">
                            {interview.analysis.detailedAnalysis.cultureFit}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Transcript Tab */}
                    <TabsContent value="transcript" className="mt-4">
                      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        {interview.transcript ? (
                          <pre className="whitespace-pre-wrap text-sm font-mono">
                            {interview.transcript}
                          </pre>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No transcript available
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                AI analysis not yet performed
              </p>
              <Button
                onClick={() => analyzeInterview(interview.id)}
                disabled={analyzing === interview.id}
              >
                {analyzing === interview.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Interview
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interview Results</h1>
        <p className="mt-2 text-muted-foreground">
          View AI-powered analysis of completed interviews
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {interviews.map(renderInterviewCard)}
        </div>
      )}
    </div>
  );
}
