'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SequenceStepEditor } from '@/components/outreach/SequenceStepEditor';
import {
  Plus,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface Step {
  id: string;
  stepNumber: number;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  delayDays: number;
  delayHours: number;
  emailTemplateId?: string | null;
}

export default function NewSequencePage() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<Step[]>([
    {
      id: crypto.randomUUID(),
      stepNumber: 1,
      subject: '',
      bodyHtml: '',
      bodyText: '',
      delayDays: 0,
      delayHours: 0,
      emailTemplateId: null,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addStep() {
    const newStep: Step = {
      id: crypto.randomUUID(),
      stepNumber: steps.length + 1,
      subject: '',
      bodyHtml: '',
      bodyText: '',
      delayDays: 3, // Default to 3 days for new steps
      delayHours: 0,
      emailTemplateId: null,
    };
    setSteps([...steps, newStep]);
  }

  function removeStep(stepId: string) {
    const updatedSteps = steps
      .filter((s) => s.id !== stepId)
      .map((s, index) => ({
        ...s,
        stepNumber: index + 1,
      }));
    setSteps(updatedSteps);
  } 

  function updateStep(stepId: string, field: keyof Step, value: any) {
    // Use functional setState to avoid stale closure issues
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, [field]: value } : step
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError('Sequence name is required');
      return;
    }

    if (steps.length === 0) {
      setError('At least one step is required');
      return;
    }

    // Validate steps
    for (const step of steps) {
      if (!step.subject.trim() && !step.bodyHtml.trim()) {
        setError(`Step ${step.stepNumber}: Subject or body is required`);
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/sequences`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || null,
          delayBetweenSteps: 3, // Kept for backwards compatibility (unused)
          steps: steps.map((step) => ({
            emailTemplateId: step.emailTemplateId || null,
            subject: step.subject,
            bodyHtml: step.bodyHtml,
            bodyText: step.bodyText || null,
            delayDays: step.delayDays,
            delayHours: step.delayHours,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create sequence');
      }

      const data = await response.json();
      router.push(`/outreach/sequences/${data.sequence.id}`);
    } catch (err: any) {
      console.error('Error creating sequence:', err);
      setError(err.message || 'Failed to create sequence');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="space-y-2 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-4xl font-bold">Create Sequence</h1>
        <p className="text-lg text-muted-foreground">
          Build a multi-step email sequence to automate your outreach
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sequence Details */}
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Sequence Details</h2>
            <p className="text-sm text-muted-foreground">
              Basic information about your email sequence
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sequence Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cold Outreach - Software Engineers"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this sequence"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Set delays for each step individually. First step&apos;s delay controls when the initial email is sent after enrollment.
              </p>
            </div>
          </div>
        </Card>

        {/* Sequence Steps */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Email Steps</h2>
              <p className="text-sm text-muted-foreground">
                Build your sequence with multiple email steps
              </p>
            </div>
            <Button type="button" variant="outline" onClick={addStep}>
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <SequenceStepEditor
                key={step.id}
                step={step}
                isFirst={index === 0}
                isOnlyStep={steps.length === 1}
                onUpdate={updateStep}
                onRemove={removeStep}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Sequence
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
