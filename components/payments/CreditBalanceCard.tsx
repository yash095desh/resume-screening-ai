'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRazorpay, CreditBalance } from '@/lib/hooks/useRazorpay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Coins, Plus, AlertCircle, Search, FileText, Video, Mail } from 'lucide-react';

// Feature costs (must match backend)
const FEATURE_COSTS = {
  SCREENING: 1,
  SOURCING: 6,
  INTERVIEW: 145,
  OUTREACH: 1,
};

interface CreditBalanceCardProps {
  variant?: 'default' | 'compact';
  showBuyButton?: boolean;
  lowCreditThreshold?: number;
}

export function CreditBalanceCard({
  variant = 'default',
  showBuyButton = true,
  lowCreditThreshold = 10,
}: CreditBalanceCardProps) {
  const { fetchCreditBalance } = useRazorpay();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBalance() {
      setLoading(true);
      const data = await fetchCreditBalance();
      setBalance(data);
      setLoading(false);
    }

    loadBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const credits = balance?.credits ?? 0;
  const isLow = balance !== null && credits <= lowCreditThreshold;

  // Compact variant — single line for sidebar
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div className="flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                {loading ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  <span
                    className={`text-sm font-medium ${
                      isLow ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    {credits} credits
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>You have {credits} credits</p>
            </TooltipContent>
          </Tooltip>

          {showBuyButton && (
            <Link href="/settings/billing">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Default variant — full card with feature breakdown
  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Credits
          {isLow && (
            <span className="text-destructive flex items-center gap-1 text-sm font-normal">
              <AlertCircle className="h-4 w-4" />
              Low credits
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <div className="space-y-1.5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Total balance */}
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-muted-foreground" />
              <span
                className={`text-2xl font-bold ${
                  isLow ? 'text-destructive' : 'text-foreground'
                }`}
              >
                {credits}
              </span>
              <span className="text-sm text-muted-foreground">credits</span>
            </div>

            {/* Feature breakdown */}
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                  <span>Searches</span>
                </div>
                <span className="font-medium">
                  {Math.floor(credits / FEATURE_COSTS.SOURCING)} available
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Screenings</span>
                </div>
                <span className="font-medium">
                  {Math.floor(credits / FEATURE_COSTS.SCREENING)} available
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Video className="h-3.5 w-3.5" />
                  <span>Interviews</span>
                </div>
                <span className="font-medium">
                  {Math.floor(credits / FEATURE_COSTS.INTERVIEW)} available
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Outreach emails</span>
                </div>
                <span className="font-medium">
                  {Math.floor(credits / FEATURE_COSTS.OUTREACH)} available
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
      {showBuyButton && (
        <CardFooter className="pt-0">
          <Link href="/settings/billing" className="w-full">
            <Button variant="outline" className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Buy Credits
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
