'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useApiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  CreditCard,
  History,
  Mail,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface CreditBalance {
  sourcingCredits: number;
  screeningCredits: number;
  interviewCredits: number;
  outreachCredits: number;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  priceInRupees: number;
  sourcingCredits: number;
  screeningCredits: number;
  interviewCredits: number;
  outreachCredits: number;
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: Plan;
}

export default function SettingsPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const api = useApiClient();

  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [isLoadingSub, setIsLoadingSub] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCredits();
    fetchSubscription();
  }, []);

  async function fetchCredits() {
    setIsLoadingCredits(true);
    const { data, ok } = await api.get('/api/credits/balance');
    if (ok && data.balance) {
      setCredits(data.balance);
    } else {
      setError(data?.error || 'Failed to load credit balance');
    }
    setIsLoadingCredits(false);
  }

  async function fetchSubscription() {
    setIsLoadingSub(true);
    const { data, ok } = await api.get('/api/subscriptions');
    if (ok && data && data.subscription) {
      setSubscription(data.subscription);
    } else {
      setError(data?.error || 'Failed to load subscription');
    }
    setIsLoadingSub(false);
  }

  function getCreditPercentage(used: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  }

  function getCreditColor(percentage: number): string {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-destructive';
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function getDaysUntilRenewal(): number {
    if (!subscription) return 0;
    const endDate = new Date(subscription.currentPeriodEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const creditCards = credits && subscription && subscription.plan ? [
    {
      label: 'Sourcing',
      icon: TrendingUp,
      used: credits.sourcingCredits,
      total: subscription.plan.sourcingCredits,
      description: 'LinkedIn candidate searches'
    },
    {
      label: 'Screening',
      icon: User,
      used: credits.screeningCredits,
      total: subscription.plan.screeningCredits,
      description: 'Resume parsing & scoring'
    },
    {
      label: 'Interview',
      icon: CreditCard,
      used: credits.interviewCredits,
      total: subscription.plan.interviewCredits,
      description: 'AI-powered interviews'
    },
    {
      label: 'Outreach',
      icon: Mail,
      used: credits.outreachCredits,
      total: subscription.plan.outreachCredits,
      description: 'Email sequence enrollments'
    }
  ] : [];

  if (!isUserLoaded || isLoadingCredits || isLoadingSub) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
            Settings
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Manage your account, credits, and subscription
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile & Plan Card */}
        <Card className="border-border bg-card p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  {user?.fullName || 'User'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
                {subscription && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {subscription.plan.name} Plan
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ₹{subscription.plan.priceInRupees.toLocaleString('en-IN')}/month
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Credit Overview */}
        {subscription && subscription.plan && credits && (
          <Card className="border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-foreground">Credit Overview</h3>
                <p className="text-sm text-muted-foreground">
                  Track your usage across all features
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchCredits}>
                <History className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Credit Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {creditCards.map((credit) => {
                const percentage = getCreditPercentage(credit.used, credit.total);
                const Icon = credit.icon;
                const colorClass = getCreditColor(percentage);
                const isLow = percentage < 20;

                return (
                  <Card key={credit.label} className="border-border bg-muted/30 p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-medium text-foreground">
                            {credit.label}
                          </h4>
                        </div>
                        {isLow && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>

                      {/* Count */}
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-foreground">
                            {credit.used}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            / {credit.total}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {credit.description}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <Progress
                          value={percentage}
                          className="h-2"
                          indicatorClassName={colorClass}
                        />
                        <p className="text-xs text-right font-medium text-muted-foreground">
                          {percentage}% remaining
                        </p>
                      </div>

                      {/* Warning */}
                      {isLow && (
                        <p className="text-xs font-medium text-destructive">
                          Low balance
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Reset Info */}
            <div className="mt-6 flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Credits reset in <span className="font-medium text-foreground">{getDaysUntilRenewal()} days</span>
                {' '}on{' '}
                <span className="font-medium text-foreground">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </p>
            </div>
          </Card>
        )}

        {/* Account Information */}
        <Card className="border-border bg-card p-6">
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-foreground">Account Information</h3>
              <p className="text-sm text-muted-foreground">
                Your account details and membership
              </p>
            </div>

            <Separator className="bg-border" />

            <div className="grid gap-4 md:grid-cols-2">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Email Address
                </label>
                <p className="text-base text-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>

              {/* Member Since */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Member Since
                </label>
                <p className="text-base text-foreground">
                  {user?.createdAt ? formatDate(user.createdAt.toString()) : 'N/A'}
                </p>
              </div>

              {/* Plan */}
              {subscription && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Current Plan
                    </label>
                    <p className="text-base text-foreground">
                      {subscription.plan.name} Plan
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Billing Cycle
                    </label>
                    <p className="text-base text-foreground">
                      ₹{subscription.plan.priceInRupees.toLocaleString('en-IN')}/month
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Current Period
                    </label>
                    <p className="text-base text-foreground">
                      {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Status
                    </label>
                    <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {subscription.status}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
