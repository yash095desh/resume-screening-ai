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
  History,
  Calendar,
  AlertCircle,
  Coins,
  Search,
  FileText,
  Video,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

// Feature costs (must match backend)
const FEATURE_COSTS = {
  SOURCING: 6,
  SCREENING: 1,
  INTERVIEW: 145,
  OUTREACH: 1,
};

interface Plan {
  id: string;
  name: string;
  slug: string;
  priceInRupees: number;
  credits: number;
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

  const [credits, setCredits] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [isLoadingSub, setIsLoadingSub] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCredits();
    fetchSubscription();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCredits() {
    setIsLoadingCredits(true);
    const { data, ok } = await api.get('/api/credits/balance');
    if (ok) {
      setCredits(data.credits ?? data.balance?.credits ?? 0);
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

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function getDaysUntilRenewal(): number {
    if (!subscription) return 0;
    const endDate = new Date(subscription.currentPeriodEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const planCredits = subscription?.plan?.credits ?? 0;
  const usedCredits = planCredits > 0 && credits !== null ? Math.max(planCredits - credits, 0) : 0;
  const usagePercentage = planCredits > 0 ? Math.round((usedCredits / planCredits) * 100) : 0;
  const currentCredits = credits ?? 0;

  if (!isUserLoaded || isLoadingCredits || isLoadingSub) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold leading-tight text-foreground">Profile</h2>
        <p className="text-base text-muted-foreground">
          Your account information and credit overview
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
                  {subscription.plan.priceInRupees > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ₹{subscription.plan.priceInRupees.toLocaleString('en-IN')}/month
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Credit Overview */}
      <Card className="border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-foreground">Credit Usage</h3>
            <p className="text-sm text-muted-foreground">
              Your unified credit balance and feature breakdown
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCredits}>
            <History className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="space-y-6">
          {/* Balance + Progress */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-muted-foreground" />
              <span
                className={`text-3xl font-bold ${
                  currentCredits <= 10 ? 'text-destructive' : 'text-foreground'
                }`}
              >
                {currentCredits}
              </span>
              {planCredits > 0 && (
                <span className="text-base text-muted-foreground">/ {planCredits} credits</span>
              )}
              {planCredits === 0 && (
                <span className="text-base text-muted-foreground">credits</span>
              )}
            </div>

            {planCredits > 0 && (
              <div className="space-y-1">
                <Progress value={100 - usagePercentage} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {usagePercentage}% used this cycle
                </p>
              </div>
            )}
          </div>

          {/* Feature Breakdown */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground mb-2">What you can do</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                  <span className="text-xs">Searches</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {Math.floor(currentCredits / FEATURE_COSTS.SOURCING)}
                </p>
                <p className="text-xs text-muted-foreground">{FEATURE_COSTS.SOURCING} cr each</p>
              </div>

              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-xs">Screenings</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {Math.floor(currentCredits / FEATURE_COSTS.SCREENING)}
                </p>
                <p className="text-xs text-muted-foreground">{FEATURE_COSTS.SCREENING} cr each</p>
              </div>

              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Video className="h-3.5 w-3.5" />
                  <span className="text-xs">Interviews</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {Math.floor(currentCredits / FEATURE_COSTS.INTERVIEW)}
                </p>
                <p className="text-xs text-muted-foreground">{FEATURE_COSTS.INTERVIEW} cr each</p>
              </div>

              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="text-xs">Outreach</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {Math.floor(currentCredits / FEATURE_COSTS.OUTREACH)}
                </p>
                <p className="text-xs text-muted-foreground">{FEATURE_COSTS.OUTREACH} cr each</p>
              </div>
            </div>
          </div>

          {/* Buy Credits Link */}
          <div className="flex items-center gap-3">
            <Link href="/settings/billing?tab=credits">
              <Button variant="outline" size="sm">
                <Coins className="mr-2 h-4 w-4" />
                Buy Credits
              </Button>
            </Link>
            <Link href="/settings/billing">
              <Button variant="ghost" size="sm">
                View Plans
              </Button>
            </Link>
          </div>

          {/* Renewal Info */}
          {subscription && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Credits reset in{' '}
                <span className="font-medium text-foreground">{getDaysUntilRenewal()} days</span> on{' '}
                <span className="font-medium text-foreground">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Account Information */}
      <Card className="border-border bg-card p-6">
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-foreground">Account Information</h3>
            <p className="text-sm text-muted-foreground">Your account details and membership</p>
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
                  <p className="text-base text-foreground">{subscription.plan.name} Plan</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Billing Cycle
                  </label>
                  <p className="text-base text-foreground">
                    {subscription.plan.priceInRupees > 0
                      ? `₹${subscription.plan.priceInRupees.toLocaleString('en-IN')}/month`
                      : 'Free'}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Current Period
                  </label>
                  <p className="text-base text-foreground">
                    {formatDate(subscription.currentPeriodStart)} -{' '}
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </label>
                  <Badge
                    variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}
                  >
                    {subscription.status}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
