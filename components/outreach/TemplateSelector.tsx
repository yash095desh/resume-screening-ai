'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, FileText } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
}

interface TemplateSelectorProps {
  onSelect: (template: EmailTemplate | null) => void;
  label?: string;
  placeholder?: string;
}

export function TemplateSelector({
  onSelect,
  label = 'Email Template (Optional)',
  placeholder = 'Select a template or write custom email',
}: TemplateSelectorProps) {
  const { getToken } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/email-templates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(value: string) {
    setSelectedId(value);

    if (value === 'none') {
      onSelect(null);
      return;
    }

    const template = templates.find((t) => t.id === value);
    if (template) {
      onSelect(template);
    }
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="template-selector">{label}</Label>

      {loading ? (
        <div className="flex items-center gap-2 h-10 px-3 py-2 border border-border rounded-md bg-background">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading templates...</span>
        </div>
      ) : (
        <>
          <Select value={selectedId} onValueChange={handleSelect}>
            <SelectTrigger id="template-selector">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>No template (write custom)</span>
                </div>
              </SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{template.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {templates.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No templates available. Create templates in Email Templates section.
            </p>
          )}

          {selectedId && selectedId !== 'none' && (
            <p className="text-xs text-muted-foreground">
              Template selected. You can customize the content below.
            </p>
          )}
        </>
      )}
    </div>
  );
}
