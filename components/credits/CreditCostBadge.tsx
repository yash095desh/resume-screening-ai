'use client';

import { Coins } from 'lucide-react';

export type FeatureType = 'SCREENING' | 'SOURCING' | 'INTERVIEW' | 'OUTREACH';

const FEATURE_CONFIG: Record<FeatureType, { cost: number; unit: string }> = {
  SCREENING: { cost: 1, unit: 'resume' },
  SOURCING: { cost: 6, unit: 'candidate' },
  INTERVIEW: { cost: 145, unit: 'interview' },
  OUTREACH: { cost: 1, unit: 'email' },
};

interface CreditCostBadgeProps {
  feature: FeatureType;
  quantity?: number;
}

export function CreditCostBadge({ feature, quantity }: CreditCostBadgeProps) {
  const config = FEATURE_CONFIG[feature];
  const totalCost = quantity ? quantity * config.cost : config.cost;

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Coins className="h-3 w-3" />
      {quantity ? (
        <span>
          {totalCost} credit{totalCost !== 1 ? 's' : ''}{' '}
          <span className="text-muted-foreground/70">
            ({quantity} × {config.cost})
          </span>
        </span>
      ) : (
        <span>
          {config.cost} credit{config.cost !== 1 ? 's' : ''}/{config.unit}
        </span>
      )}
    </span>
  );
}
