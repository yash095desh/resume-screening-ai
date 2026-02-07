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
import { Search, FileText, Video, Mail, Plus, AlertCircle } from 'lucide-react';

interface CreditBalanceCardProps {
  variant?: 'default' | 'compact';
  showBuyButton?: boolean;
  lowCreditThreshold?: number;
}

export function CreditBalanceCard({
  variant = 'default',
  showBuyButton = true,
  lowCreditThreshold = 5,
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

  // Check if any credit is low
  const hasLowCredits =
    balance &&
    (balance.sourcingCredits <= lowCreditThreshold ||
      balance.screeningCredits <= lowCreditThreshold ||
      balance.interviewCredits <= lowCreditThreshold ||
      balance.outreachCredits <= lowCreditThreshold);

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Card className="bg-card">
          <CardContent className="py-3 px-4">
            {loading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : (
              <div className="flex items-center gap-4 text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={
                          balance?.sourcingCredits !== undefined &&
                          balance.sourcingCredits <= lowCreditThreshold
                            ? 'text-destructive font-medium'
                            : ''
                        }
                      >
                        {balance?.sourcingCredits ?? 0}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Search Credits</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={
                          balance?.screeningCredits !== undefined &&
                          balance.screeningCredits <= lowCreditThreshold
                            ? 'text-destructive font-medium'
                            : ''
                        }
                      >
                        {balance?.screeningCredits ?? 0}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Screening Credits</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={
                          balance?.interviewCredits !== undefined &&
                          balance.interviewCredits <= lowCreditThreshold
                            ? 'text-destructive font-medium'
                            : ''
                        }
                      >
                        {balance?.interviewCredits ?? 0}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Interview Credits</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={
                          balance?.outreachCredits !== undefined &&
                          balance.outreachCredits <= lowCreditThreshold
                            ? 'text-destructive font-medium'
                            : ''
                        }
                      >
                        {balance?.outreachCredits ?? 0}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Outreach Credits</TooltipContent>
                </Tooltip>

                {showBuyButton && (
                  <Link href="/settings/billing">
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Credits
          {hasLowCredits && (
            <span className="text-destructive flex items-center gap-1 text-sm font-normal">
              <AlertCircle className="h-4 w-4" />
              Low credits
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span>Search</span>
              </div>
              <span
                className={`font-medium ${
                  balance?.sourcingCredits !== undefined &&
                  balance.sourcingCredits <= lowCreditThreshold
                    ? 'text-destructive'
                    : ''
                }`}
              >
                {balance?.sourcingCredits ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Screening</span>
              </div>
              <span
                className={`font-medium ${
                  balance?.screeningCredits !== undefined &&
                  balance.screeningCredits <= lowCreditThreshold
                    ? 'text-destructive'
                    : ''
                }`}
              >
                {balance?.screeningCredits ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" />
                <span>Interviews</span>
              </div>
              <span
                className={`font-medium ${
                  balance?.interviewCredits !== undefined &&
                  balance.interviewCredits <= lowCreditThreshold
                    ? 'text-destructive'
                    : ''
                }`}
              >
                {balance?.interviewCredits ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>Outreach</span>
              </div>
              <span
                className={`font-medium ${
                  balance?.outreachCredits !== undefined &&
                  balance.outreachCredits <= lowCreditThreshold
                    ? 'text-destructive'
                    : ''
                }`}
              >
                {balance?.outreachCredits ?? 0}
              </span>
            </div>
          </div>
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
