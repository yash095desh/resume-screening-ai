'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Save, ArrowLeft, Info, Edit3, Eye } from 'lucide-react';

const AVAILABLE_VARIABLES = [
  { key: '{{candidate_name}}', description: 'Name of the candidate' },
  { key: '{{candidate_email}}', description: 'Email of the candidate' },
  { key: '{{job_title}}', description: 'Title of the job position' },
  { key: '{{interview_link}}', description: 'Unique interview link' },
  { key: '{{expiry_date}}', description: 'When the interview link expires' },
  { key: '{{company_name}}', description: 'Your company name' },
  { key: '{{recruiter_name}}', description: 'Name of the recruiter' },
];

export default function EditTemplatePage() {
  const api = useApiClient();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<string>('INVITATION');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  async function fetchTemplate() {
    setLoading(true);
    try {
      const { data, ok } = await api.get(`/api/email-templates/${templateId}`);
      if (ok && data) {
        setName(data.name);
        setType(data.type);
        setSubject(data.subject);
        setBodyHtml(data.bodyHtml);
        setIsDefault(data.isDefault);
      } else {
        setError('Failed to load template');
      }
    } catch (err) {
      console.error('Error fetching template:', err);
      setError('An error occurred while loading the template');
    } finally {
      setLoading(false);
    }
  }

  function insertVariable(variable: string, field: 'subject' | 'body') {
    if (field === 'subject') {
      setSubject(prev => prev + ' ' + variable);
    } else {
      // Use TipTap editor API to insert at cursor position
      if (editor) {
        editor.chain().focus().insertContent(` ${variable} `).run();
      }
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

      const { ok } = await api.put(`/api/email-templates/${templateId}`, payload);

      if (ok) {
        router.push('/templates');
      } else {
        setError('Failed to update template');
      }
    } catch (err) {
      console.error('Error updating template:', err);
      setError('An error occurred while updating the template');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/templates')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-4xl font-bold">Edit Email Template</h1>
        <p className="text-lg text-muted-foreground">
          Update your email template for interview invitations or reminders
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isDefault && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This is a default template. Changes will only affect your account.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Template Basic Info */}
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Template Details</h2>
            <p className="text-sm text-muted-foreground">
              Basic information about your email template
            </p>
          </div>

          <div className="space-y-4">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
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
              <Label htmlFor="type">Template Type</Label>
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
          </div>
        </Card>

        {/* Email Content with Tabs */}
        <Card className="overflow-hidden">
          <div className="bg-muted/50 border-b border-border p-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Email Content</h2>
              <p className="text-sm text-muted-foreground">
                Compose your email with subject and body
              </p>
            </div>
          </div>

          <div className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
              {/* Tab Triggers */}
              <TabsList className="mb-6">
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              {/* Edit Tab */}
              <TabsContent value="edit" className="space-y-6 mt-0">
                {/* Subject Line */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Interview Invitation for {{job_title}}"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Click variables to insert them into your subject
                  </p>
                  <div className="flex flex-wrap gap-2">
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
                  <Label>Email Body</Label>
                  <RichTextEditor
                    value={bodyHtml}
                    onChange={setBodyHtml}
                    placeholder="Enter your email content here..."
                    onEditorReady={setEditor}
                  />
                  <p className="text-xs text-muted-foreground">
                    Click variables to insert them into your email body
                  </p>
                  <div className="flex flex-wrap gap-2">
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

                {/* Variables Guide */}
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Available Variables
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      {AVAILABLE_VARIABLES.map(variable => (
                        <div key={variable.key}>
                          <code className="bg-background px-2 py-1 rounded text-xs border border-border">
                            {variable.key}
                          </code>
                          <p className="text-muted-foreground mt-1">{variable.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Subject:</p>
                    <p className="text-base font-medium">{subject || 'No subject yet'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Body:</p>
                    <div
                      className="bg-muted/30 rounded-lg border border-border p-6 text-sm leading-relaxed min-h-96"
                      dangerouslySetInnerHTML={{
                        __html: bodyHtml || '<p class="text-muted-foreground">No content yet</p>'
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/templates')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
