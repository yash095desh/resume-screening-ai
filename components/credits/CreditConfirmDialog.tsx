'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, AlertCircle, CreditCard, Zap } from 'lucide-react';
import { useCredits } from '@/lib/credits/credit-context';

export type FeatureType = 'SCREENING' | 'SOURCING' | 'INTERVIEW' | 'OUTREACH';

const FEATURE_COSTS: Record<FeatureType, number> = {
  SCREENING: 1,
  SOURCING: 6,
  INTERVIEW: 145,
  OUTREACH: 1,
};

interface CreditConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureType: FeatureType;
  quantity: number;
  actionLabel: string;
  onConfirm: () => void;
}

export function CreditConfirmDialog({
  open,
  onOpenChange,
  featureType,
  quantity,
  actionLabel,
  onConfirm,
}: CreditConfirmDialogProps) {
  const { credits, loading } = useCredits();

  const costPerUnit = FEATURE_COSTS[featureType];
  const totalCost = quantity * costPerUnit;
  const hasEnough = credits !== null && credits >= totalCost;
  const remaining = credits !== null ? credits - totalCost : 0;

  function handleConfirm() {
    onOpenChange(false);
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : hasEnough ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-muted-foreground" />
                Confirm Credit Usage
              </DialogTitle>
              <DialogDescription>{actionLabel}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-semibold">
                  {totalCost} credit{totalCost !== 1 ? 's' : ''}
                  {quantity > 1 && (
                    <span className="text-muted-foreground font-normal ml-1">
                      ({quantity} × {costPerUnit})
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current balance</span>
                <span className="font-medium">{credits} credits</span>
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">After this action</span>
                <span className="font-semibold">{remaining} credits</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>
                <Coins className="mr-2 h-4 w-4" />
                Confirm — {totalCost} cr
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Insufficient Credits
              </DialogTitle>
              <DialogDescription>
                You need {totalCost} credits but only have {credits}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Required</span>
                <span className="font-semibold text-destructive">
                  {totalCost} credits
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your balance</span>
                <span className="font-medium">{credits} credits</span>
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shortfall</span>
                <span className="font-semibold text-destructive">
                  {totalCost - (credits ?? 0)} credits
                </span>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Link href="/settings/billing">
                <Button variant="outline">
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>
              </Link>
              <Link href="/settings/billing?tab=credits">
                <Button>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Buy Credits
                </Button>
              </Link>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
