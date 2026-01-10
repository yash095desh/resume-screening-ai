'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, ArrowLeft, Info } from 'lucide-react';

const AVAILABLE_VARIABLES = [
  { key: '{{candidate_name}}', description: 'Name of the candidate' },
  { key: '{{candidate_email}}', description: 'Email of the candidate' },
  { key: '{{job_title}}', description: 'Title of the job position' },
  { key: '{{interview_link}}', description: 'Unique interview link' },
  { key: '{{expiry_date}}', description: 'When the interview link expires' },
  { key: '{{company_name}}', description: 'Your company name' },
  { key: '{{recruiter_name}}', description: 'Name of the recruiter' },
];

export default function NewTemplatePage() {
  const api = useApiClient();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<string>('INVITATION');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');

  function insertVariable(variable: string, field: 'subject' | 'body') {
    if (field === 'subject') {
      setSubject(prev => prev + variable);
    } else {
      setBodyHtml(prev => prev + variable);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !type || !subject || !bodyHtml) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name,
        type,
        subject,
        bodyHtml,
        bodyText: bodyHtml.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
      };

      const { ok } = await api.post('/api/email-templates', payload);

      if (ok) {
        router.push('/templates');
      } else {
        setError('Failed to create template');
      }
    } catch (err) {
      console.error('Error creating template:', err);
      setError('An error occurred while creating the template');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/templates')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Email Template</h1>
          <p className="mt-2 text-muted-foreground">
            Design a new email template for interview invitations or reminders
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Template Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Template Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Standard Interview Invitation"
                    required
                  />
                </div>

                {/* Template Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Template Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INVITATION">Initial Invitation</SelectItem>
                      <SelectItem value="REMINDER_24H">24-Hour Reminder</SelectItem>
                      <SelectItem value="REMINDER_6H">6-Hour Urgent Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject Line */}
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Subject Line <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Interview Invitation for {{job_title}}"
                    required
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {AVAILABLE_VARIABLES.slice(0, 4).map(variable => (
                      <Button
                        key={variable.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariable(variable.key, 'subject')}
                      >
                        {variable.key}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Email Body */}
                <div className="space-y-2">
                  <Label htmlFor="bodyHtml">
                    Email Body (HTML) <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="bodyHtml"
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    placeholder="Enter your email content here. Use HTML tags for formatting..."
                    rows={15}
                    className="font-mono text-sm"
                    required
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {AVAILABLE_VARIABLES.map(variable => (
                      <Button
                        key={variable.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariable(variable.key, 'body')}
                      >
                        {variable.key}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Template
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/templates')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar - Preview & Variables */}
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
                <p className="text-sm">{subject || 'No subject yet'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Body:</p>
                <div
                  className="bg-gray-50 rounded-lg p-4 text-sm max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{
                    __html: bodyHtml || '<p class="text-muted-foreground">No content yet</p>'
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Variables Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Available Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {AVAILABLE_VARIABLES.map(variable => (
                  <div key={variable.key}>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {variable.key}
                    </code>
                    <p className="text-muted-foreground mt-1">{variable.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* HTML Tips */}
          <Card>
            <CardHeader>
              <CardTitle>HTML Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>Use these HTML tags for formatting:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><code>&lt;p&gt;</code> for paragraphs</li>
                <li><code>&lt;strong&gt;</code> for bold text</li>
                <li><code>&lt;em&gt;</code> for italic text</li>
                <li><code>&lt;a href=""&gt;</code> for links</li>
                <li><code>&lt;ul&gt;&lt;li&gt;</code> for lists</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
