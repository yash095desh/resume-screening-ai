'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Download,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from "sonner"
import { useParams } from 'next/navigation';
import { useApiClient } from '@/lib/api/client';

interface Candidate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  matchScore: number | null;
  fitVerdict: string | null;
  matchedSkills: string[];
  missingSkills: string[];
  skills: string[];
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  totalExperienceYears: number | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  resumeUrl: string;
  job: {
    title: string;
    requiredSkills: string[];
    experienceRequired: string | null;
    qualifications: string[];
  };
}

export default function CandidateDetailPage() {
  const params = useParams();
  const { get } = useApiClient();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidate();
  }, [params.candidateId]);

  const fetchCandidate = async () => {
    try {
      const { res , data  } = await get(`/api/candidates/${params.candidateId}`);
      if (!res.ok) throw new Error('Failed to fetch candidate');
      setCandidate(data);
    } catch (error) {
      toast.error( 'Failed to load candidate details.');
      console.log('Failed to load candidate details.', (error as Error).message)
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!candidate) {
    return <div>Candidate not found</div>;
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/jobs/${params.jobId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Rankings
            </Button>
          </Link>
        </div>
        <a
          href={candidate.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download Resume
          </Button>
        </a>
      </div>

      {/* Candidate Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{candidate.name}</h1>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {candidate.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{candidate.email}</span>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.totalExperienceYears !== null && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{candidate.totalExperienceYears} years experience</span>
                    </div>
                  )}
                </div>
              </div>

              {candidate.fitVerdict && (
                <Badge
                  variant={
                    candidate.fitVerdict === 'Good Fit'
                      ? 'default'
                      : candidate.fitVerdict === 'Moderate Fit'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="text-base"
                >
                  {candidate.fitVerdict}
                </Badge>
              )}
            </div>

            {/* Match Score */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Match Score</div>
              <div
                className={`mt-2 text-6xl font-bold ${getScoreColor(
                  candidate.matchScore
                )}`}
              >
                {candidate.matchScore || 'N/A'}
              </div>
              {candidate.matchScore && (
                <div className="text-sm text-muted-foreground">/100</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="comparison">JD Comparison</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Summary */}
          {candidate.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{candidate.summary}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {candidate.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {candidate.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <span className="text-sm">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Matched Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Matched Skills ({candidate.matchedSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.matchedSkills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-green-500 text-green-700"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Missing Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Missing Skills ({candidate.missingSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.missingSkills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-red-500 text-red-700"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Skills */}
          <Card>
            <CardHeader>
              <CardTitle>All Candidate Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {candidate.experience && candidate.experience.length > 0 ? (
                  candidate.experience.map((exp, index) => (
                    <div
                      key={index}
                      className="relative border-l-2 border-blue-500 pl-6 pb-6 last:pb-0"
                    >
                      <div className="absolute -left-2 top-0 h-4 w-4 rounded-full border-2 border-blue-500 bg-white"></div>
                      <div>
                        <h3 className="font-semibold">{exp.role}</h3>
                        <p className="text-sm text-muted-foreground">
                          {exp.company} • {exp.duration}
                        </p>
                        {exp.description && (
                          <p className="mt-2 text-sm">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No experience information available.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {candidate.education && candidate.education.length > 0 ? (
                  candidate.education.map((edu, index) => (
                    <div
                      key={index}
                      className="rounded-lg border p-4"
                    >
                      <h3 className="font-semibold">{edu.degree}</h3>
                      <p className="text-sm text-muted-foreground">
                        {edu.institution}
                        {edu.year && ` • ${edu.year}`}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No education information available.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* JD Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Job Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Job Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Required Skills</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {candidate.job.requiredSkills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {candidate.job.experienceRequired && (
                  <div>
                    <h4 className="font-semibold">Experience Required</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {candidate.job.experienceRequired}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold">Qualifications</h4>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {candidate.job.qualifications.map((qual, index) => (
                      <li key={index}>{qual}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Candidate Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Candidate Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Candidate Skills</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {candidate.skills.slice(0, 10).map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 10 && (
                      <Badge variant="outline">
                        +{candidate.skills.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>

                {candidate.totalExperienceYears !== null && (
                  <div>
                    <h4 className="font-semibold">Total Experience</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {candidate.totalExperienceYears} years
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold">Education</h4>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {candidate.education?.map((edu, index) => (
                      <li key={index}>
                        {edu.degree} - {edu.institution}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Match Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Match Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Skill Match</span>
                    <span className="text-sm text-muted-foreground">
                      {candidate.matchedSkills.length} /{' '}
                      {candidate.job.requiredSkills.length}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{
                        width: `${
                          (candidate.matchedSkills.length /
                            candidate.job.requiredSkills.length) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {candidate.job.experienceRequired &&
                  candidate.totalExperienceYears !== null && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Experience Match
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {candidate.totalExperienceYears} years (Required:{' '}
                          {candidate.job.experienceRequired})
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${Math.min(
                              (candidate.totalExperienceYears /
                                parseInt(candidate.job.experienceRequired)) *
                                100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}