'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Mail, Plus, Pencil, Trash2, Loader2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const api = useApiClient();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const { data, ok } = await api.get('/api/email-templates');
      if (ok) {
        setTemplates(data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function seedDefaults() {
    setSeeding(true);
    try {
      const { ok } = await api.post('/api/email-templates/seed-defaults');
      if (ok) {
        alert('Default templates created successfully!');
        fetchTemplates();
      } else {
        alert('Failed to seed default templates');
      }
    } catch (error) {
      console.error('Error seeding defaults:', error);
      alert('Error seeding default templates');
    } finally {
      setSeeding(false);
    }
  }

  async function deleteTemplate(id: string) {
    setDeleting(id);
    try {
      const { ok } = await api.del(`/api/email-templates/${id}`);
      if (ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    } finally {
      setDeleting(null);
    }
  }

  function getTemplateTypeInfo(type: string) {
    const typeMap: Record<string, { label: string; color: string }> = {
      INVITATION: { label: 'Invitation', color: 'bg-blue-100 text-blue-800' },
      REMINDER_24H: { label: '24h Reminder', color: 'bg-yellow-100 text-yellow-800' },
      REMINDER_6H: { label: '6h Reminder', color: 'bg-orange-100 text-orange-800' },
    };

    return typeMap[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
  }

  function renderTemplateCard(template: EmailTemplate) {
    const typeInfo = getTemplateTypeInfo(template.type);

    return (
      <Card key={template.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {template.isDefault && (
                  <Badge variant="secondary">Default</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {template.subject}
              </p>
            </div>

            <Badge className={typeInfo.color}>
              {typeInfo.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-hidden">
            <div
              className="text-sm text-muted-foreground line-clamp-3"
              dangerouslySetInnerHTML={{
                __html: template?.bodyHtml?.replace(/<[^>]*>/g, ' ')?.substring(0, 200)
              }}
            />
          </div>

          {/* Meta */}
          <div className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Link href={`/templates/${template.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>

            {!template.isDefault && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deleting === template.id}
                  >
                    {deleting === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Template</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{template.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteTemplate(template.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="mt-2 text-muted-foreground">
            Manage email templates for interview invitations and reminders
          </p>
        </div>

        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button
              variant="outline"
              onClick={seedDefaults}
              disabled={seeding}
            >
              {seeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Seed Defaults'
              )}
            </Button>
          )}

          <Link href="/templates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold">No templates yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first template or seed the default templates
            </p>
            <div className="flex gap-2 mt-4">
              <Button onClick={seedDefaults} disabled={seeding}>
                {seeding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Seed Defaults'
                )}
              </Button>
              <Link href="/templates/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New Template
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(renderTemplateCard)}
        </div>
      )}
    </div>
  );
}
