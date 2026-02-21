'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { useRouter, useParams } from 'next/navigation';
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

import { AttachmentMeta } from '@/components/outreach/StepAttachments';

interface Step {
  id: string;
  stepNumber: number;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments?: AttachmentMeta[];
  delayDays: number;
  delayHours: number;
  emailTemplateId?: string | null;
}

export default function EditSequencePage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sequenceId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [delayBetweenSteps, setDelayBetweenSteps] = useState(3);
  const [steps, setSteps] = useState<Step[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSequence();
  }, [sequenceId]);

  async function fetchSequence() {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/sequences/${sequenceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sequence');
      }

      const data = await response.json();

      // Populate form fields
      setName(data.name);
      setDescription(data.description || '');
      setDelayBetweenSteps(data.delayBetweenSteps);

      // Convert backend steps to frontend format
      const formattedSteps: Step[] = data.steps.map((step: any) => ({
        id: step.id,
        stepNumber: step.stepNumber,
        subject: step.subject || '',
        bodyHtml: step.bodyHtml || '',
        bodyText: step.bodyText || '',
        attachments: step.attachments || [],
        delayDays: step.delayDays,
        delayHours: step.delayHours,
        emailTemplateId: step.emailTemplateId,
      }));

      setSteps(formattedSteps);
    } catch (err: any) {
      console.error('Error fetching sequence:', err);
      setError(err.message || 'Failed to load sequence');
    } finally {
      setLoading(false);
    }
  }

  function addStep() {
    const newStep: Step = {
      id: crypto.randomUUID(),
      stepNumber: steps.length + 1,
      subject: '',
      bodyHtml: '',
      bodyText: '',
      delayDays: delayBetweenSteps,
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
    setSteps(
      steps.map((step) =>
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

      // Update sequence details
      await fetch(`${apiUrl}/api/sequences/${sequenceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || null,
          delayBetweenSteps,
        }),
      });

      // Delete old steps and create new ones
      // First, get current steps from backend
      const currentStepsResponse = await fetch(`${apiUrl}/api/sequences/${sequenceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const currentData = await currentStepsResponse.json();

      // Delete all existing steps
      for (const step of currentData.steps) {
        await fetch(`${apiUrl}/api/sequences/${sequenceId}/steps/${step.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Create new steps
      for (const step of steps) {
        await fetch(`${apiUrl}/api/sequences/${sequenceId}/steps`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailTemplateId: step.emailTemplateId || null,
            subject: step.subject,
            bodyHtml: step.bodyHtml,
            bodyText: step.bodyText || null,
            attachments: step.attachments?.length ? step.attachments : undefined,
            delayDays: step.delayDays,
            delayHours: step.delayHours,
          }),
        });
      }

      // Navigate back to sequence details
      router.push(`/outreach/sequences/${sequenceId}`);
    } catch (err: any) {
      console.error('Error updating sequence:', err);
      setError(err.message || 'Failed to update sequence');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
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
        <h1 className="text-4xl font-bold">Edit Sequence</h1>
        <p className="text-lg text-muted-foreground">
          Update your email sequence settings and steps
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="delayBetweenSteps">
                Default Delay Between Steps (Days)
              </Label>
              <Input
                id="delayBetweenSteps"
                type="number"
                min="0"
                value={delayBetweenSteps}
                onChange={(e) => setDelayBetweenSteps(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                This will be the default delay applied to new steps
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

          {steps.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No steps in this sequence yet
              </p>
              <Button type="button" variant="outline" onClick={addStep}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Step
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {steps.map((step, index) => (
                <SequenceStepEditor
                  key={step.id}
                  step={step}
                  isFirst={index === 0}
                  isOnlyStep={steps.length === 1}
                  sequenceId={sequenceId}
                  onUpdate={updateStep}
                  onRemove={removeStep}
                />
              ))}
            </div>
          )}
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
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
