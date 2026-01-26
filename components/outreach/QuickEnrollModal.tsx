'use client';

import { useState, useEffect } from 'react';
import { useApiClient } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Sequence {
  id: string;
  name: string;
  totalSteps: number;
  enrolledCount?: number;
  isActive: boolean;
  _count?: {
    candidateSequences: number;
  };
}

interface QuickEnrollModalProps {
  open: boolean;
  onClose: () => void;
  jobId?: string;
  sourcingJobId?: string;
  candidateIds?: string[];
  linkedInCandidateIds?: string[];
  onSuccess?: () => void;
}

export default function QuickEnrollModal({
  open,
  onClose,
  jobId,
  sourcingJobId,
  candidateIds = [],
  linkedInCandidateIds = [],
  onSuccess
}: QuickEnrollModalProps) {
  const api = useApiClient();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const totalCandidates = candidateIds.length + linkedInCandidateIds.length;

  async function fetchSequences() {
    setLoading(true);
    try {
      // Fetch all sequences for the user (sequences are reusable templates, not job-specific)
      const { ok, data } = await api.get('/api/sequences');
      if (ok) {
        // Backend returns { sequences: [...] }, extract the array
        const sequencesList = data.sequences || data;
        // Only show ACTIVE sequences
        const activeSequences = sequencesList.filter((s: Sequence) => s.isActive === true);
        setSequences(activeSequences);

        if (activeSequences.length === 0) {
          console.log('No active sequences found for user');
        }
      } else {
        console.error('Failed to fetch sequences: API returned not ok');
        toast.error('Failed to load sequences');
      }
    } catch (error) {
      console.error('Failed to fetch sequences:', error);
      toast.error('Failed to load sequences');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    if (!selectedSequence) {
      toast.error('Please select a sequence');
      return;
    }

    setEnrolling(true);
    try {
      // Use enroll-bulk endpoint for multiple candidates
      const { ok, data } = await api.post(`/api/sequences/${selectedSequence}/enroll-bulk`, {
        candidateIds: candidateIds.length > 0 ? candidateIds : undefined,
        linkedInCandidateIds: linkedInCandidateIds.length > 0 ? linkedInCandidateIds : undefined,
        startImmediately: true
      });

      if (ok) {
        const successCount = data.enrolled || 0;
        const failedCount = data.failed || 0;

        if (successCount > 0) {
          toast.success(`Enrolled ${successCount} candidate${successCount > 1 ? 's' : ''}`);
        }
        if (failedCount > 0) {
          toast.warning(`Failed to enroll ${failedCount} candidate${failedCount > 1 ? 's' : ''}`);
        }

        onClose();
        onSuccess?.();
      } else {
        toast.error('Failed to enroll candidates');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll candidates');
    } finally {
      setEnrolling(false);
    }
  }

  useEffect(() => {
    if (open) {
      fetchSequences();
      setSelectedSequence('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Sequence</DialogTitle>
          <DialogDescription>
            Add {totalCandidates} candidate{totalCandidates > 1 ? 's' : ''} to an email sequence
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading sequences...</p>
          </div>
        ) : sequences.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              No active sequences found. Create a sequence to start your outreach.
            </p>
            <Button onClick={() => window.location.href = '/outreach/sequences/new'}>
              Create Sequence
            </Button>
          </div>
        ) : (
          <RadioGroup value={selectedSequence} onValueChange={setSelectedSequence}>
            <div className="space-y-3">
              {sequences.map(seq => (
                <div
                  key={seq.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedSequence(seq.id)}
                >
                  <RadioGroupItem value={seq.id} id={seq.id} className="mt-1" />
                  <Label htmlFor={seq.id} className="flex-1 cursor-pointer">
                    <div className="font-medium text-sm">{seq.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {seq.totalSteps} steps • {seq._count?.candidateSequences || 0} enrolled
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={!selectedSequence || enrolling || sequences.length === 0}
          >
            {enrolling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enrolling...
              </>
            ) : (
              `Enroll ${totalCandidates}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
