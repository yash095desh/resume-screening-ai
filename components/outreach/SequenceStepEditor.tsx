'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from './RichTextEditor';
import { EmailPreview } from './EmailPreview';
import { TemplateSelector } from './TemplateSelector';
import { StepAttachments, AttachmentMeta } from './StepAttachments';
import { GripVertical, Trash2, Edit3, Eye } from 'lucide-react';

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

interface SequenceStepEditorProps {
  step: Step;
  isFirst: boolean;
  isOnlyStep: boolean;
  sequenceId?: string;
  onUpdate: (stepId: string, field: keyof Step, value: any) => void;
  onRemove: (stepId: string) => void;
  dragHandleProps?: any; // For drag-and-drop integration
}

export function SequenceStepEditor({
  step,
  isFirst,
  isOnlyStep,
  sequenceId,
  onUpdate,
  onRemove,
  dragHandleProps,
}: SequenceStepEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  function handleTemplateSelect(template: any) {
    if (template) {
      onUpdate(step.id, 'subject', template.subject);
      onUpdate(step.id, 'bodyHtml', template.bodyHtml);
      onUpdate(step.id, 'bodyText', template.bodyText || '');
      onUpdate(step.id, 'emailTemplateId', template.id);
    } else {
      onUpdate(step.id, 'emailTemplateId', null);
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div
              {...dragHandleProps}
              className="cursor-move hover:bg-muted rounded p-1 transition-colors"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Step Info */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Step {step.stepNumber}</h3>
              {isFirst ? (
                <p className="text-sm text-muted-foreground">
                  {step.delayDays === 0 && step.delayHours === 0
                    ? 'Sent immediately upon enrollment'
                    : `Sent ${step.delayDays > 0 ? `${step.delayDays} days ` : ''}${
                        step.delayHours > 0 ? `${step.delayHours} hours ` : ''
                      }after enrollment`}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sent {step.delayDays} days{' '}
                  {step.delayHours > 0 && `${step.delayHours} hours `}
                  after previous step
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isOnlyStep && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(step.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
          {/* Tabs */}
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
            {/* Delay Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`delay-days-${step.id}`}>
                  Delay (Days)
                  {step.stepNumber === 1 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (0 = send immediately)
                    </span>
                  )}
                </Label>
                <Input
                  id={`delay-days-${step.id}`}
                  type="number"
                  min="0"
                  value={step.delayDays}
                  onChange={(e) =>
                    onUpdate(step.id, 'delayDays', parseInt(e.target.value) || 0)
                  }
                />
                {step.stepNumber === 1 && (
                  <p className="text-xs text-muted-foreground">
                    Days to wait before sending first email after enrolling candidate
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`delay-hours-${step.id}`}>Delay (Hours)</Label>
                <Input
                  id={`delay-hours-${step.id}`}
                  type="number"
                  min="0"
                  max="23"
                  value={step.delayHours}
                  onChange={(e) =>
                    onUpdate(step.id, 'delayHours', parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            {/* Template Selector */}
            <TemplateSelector onSelect={handleTemplateSelect} />

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor={`subject-${step.id}`}>Subject Line</Label>
              <Input
                id={`subject-${step.id}`}
                value={step.subject}
                onChange={(e) => onUpdate(step.id, 'subject', e.target.value)}
                placeholder="e.g., Hi {{candidateName}}, interested in {{jobTitle}}?"
              />
              <p className="text-xs text-muted-foreground">
                Use variables: {'{'}{'{'} candidateName {'}'}{'}'}, {'{'}{'{'}jobTitle{'}'}{'}'}, {'{'}{'{'} recruiterName {'}'}{'}'}
              </p>
            </div>

            {/* Body (Rich Text Editor) */}
            <div className="space-y-2">
              <Label>Email Body</Label>
              <RichTextEditor
                value={step.bodyHtml}
                onChange={(value) => onUpdate(step.id, 'bodyHtml', value)}
                placeholder="Write your email content here..."
                minHeight="min-h-64"
              />
            </div>

            {/* Plain Text Body (Optional) */}
            <details className="space-y-2">
              <summary className="text-sm font-medium cursor-pointer hover:text-primary">
                Plain Text Version (Optional, for better deliverability)
              </summary>
              <div className="mt-2 space-y-2">
                <Label htmlFor={`body-text-${step.id}`}>Plain Text Body</Label>
                <textarea
                  id={`body-text-${step.id}`}
                  value={step.bodyText}
                  onChange={(e) => onUpdate(step.id, 'bodyText', e.target.value)}
                  placeholder="Plain text version of your email (optional)..."
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  If not provided, a plain text version will be auto-generated from HTML
                </p>
              </div>
            </details>

            {/* Attachments */}
            <StepAttachments
              attachments={step.attachments || []}
              onChange={(files) => onUpdate(step.id, 'attachments', files)}
              sequenceId={sequenceId}
              stepNumber={step.stepNumber}
            />
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="mt-0">
            <EmailPreview
              subject={step.subject}
              bodyHtml={step.bodyHtml}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
