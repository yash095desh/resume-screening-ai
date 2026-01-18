'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye } from 'lucide-react';

interface EmailPreviewProps {
  subject: string;
  bodyHtml: string;
  sampleData?: {
    candidateName?: string;
    candidateFirstName?: string;
    jobTitle?: string;
    companyName?: string;
    recruiterName?: string;
  };
  fromAddress?: string;
}

export function EmailPreview({
  subject,
  bodyHtml,
  sampleData = {},
  fromAddress = 'hiring@yourcompany.recruitkar.com',
}: EmailPreviewProps) {
  // Default sample data
  const defaultSampleData = {
    candidateName: 'John Smith',
    candidateFirstName: 'John',
    jobTitle: 'Senior Software Engineer',
    companyName: 'Acme Corp',
    recruiterName: 'Sarah Johnson',
  };

  const data = { ...defaultSampleData, ...sampleData };

  // Interpolate variables
  function interpolate(content: string): string {
    return content
      .replace(/\{\{candidateName\}\}/g, data.candidateName || '')
      .replace(/\{\{candidateFirstName\}\}/g, data.candidateFirstName || '')
      .replace(/\{\{jobTitle\}\}/g, data.jobTitle || '')
      .replace(/\{\{companyName\}\}/g, data.companyName || '')
      .replace(/\{\{recruiterName\}\}/g, data.recruiterName || '')
      .replace(/\{\{unsubscribeLink\}\}/g, '#unsubscribe');
  }

  const interpolatedSubject = interpolate(subject);
  const interpolatedBody = interpolate(bodyHtml);

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 border-b border-border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Email Preview</span>
          <Badge variant="secondary" className="text-xs">
            Sample Data
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Variables are replaced with sample data for preview
        </p>
      </div>

      {/* Email Header */}
      <div className="border-b border-border bg-background">
        <div className="p-4 space-y-3">
          {/* From */}
          <div className="flex items-start gap-3">
            <span className="text-sm text-muted-foreground min-w-16">From:</span>
            <span className="text-sm font-medium">{fromAddress}</span>
          </div>

          {/* To */}
          <div className="flex items-start gap-3">
            <span className="text-sm text-muted-foreground min-w-16">To:</span>
            <span className="text-sm">{data.candidateName} &lt;candidate@example.com&gt;</span>
          </div>

          {/* Subject */}
          <div className="flex items-start gap-3">
            <span className="text-sm text-muted-foreground min-w-16">Subject:</span>
            <span className="text-sm font-semibold">
              {interpolatedSubject || '(No subject)'}
            </span>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="p-6">
        {interpolatedBody ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: interpolatedBody }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Email body will appear here
            </p>
          </div>
        )}
      </div>

      {/* Sample Data Legend */}
      <div className="border-t border-border bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Sample Data Used:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Candidate:</span>{' '}
            <span className="font-mono">{data.candidateName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">First Name:</span>{' '}
            <span className="font-mono">{data.candidateFirstName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Job Title:</span>{' '}
            <span className="font-mono">{data.jobTitle}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Company:</span>{' '}
            <span className="font-mono">{data.companyName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Recruiter:</span>{' '}
            <span className="font-mono">{data.recruiterName}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
