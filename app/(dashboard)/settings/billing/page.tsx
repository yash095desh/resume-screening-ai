'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useRazorpay,
  SubscriptionPlan,
  CreditBalance,
  FeatureCosts,
  CreditPricing,
} from '@/lib/hooks/useRazorpay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Search,
  FileText,
  Video,
  Mail,
  CreditCard,
  Check,
  Zap,
  Crown,
  Star,
  History,
  Loader2,
  Coins,
  Minus,
  Plus,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCredits } from '@/lib/credits/credit-context';

const FEATURE_INFO = [
  { key: 'SOURCING' as const, label: 'Candidate Searches', icon: Search, unit: 'search' },
  { key: 'SCREENING' as const, label: 'Resume Screenings', icon: FileText, unit: 'resume' },
  { key: 'INTERVIEW' as const, label: 'AI Interviews', icon: Video, unit: 'interview' },
  { key: 'OUTREACH' as const, label: 'Outreach Emails', icon: Mail, unit: 'email' },
];

interface Subscription {
  id: string;
  status: string;
  plan: SubscriptionPlan;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

interface BillingInfo {
  nextBillingDate: string | null;
  lastPaymentStatus: string | null;
  hasRazorpaySubscription: boolean;
  cancelledAt: string | null;
}

export default function BillingPage() {
  const router = useRouter();
  const { refreshCredits } = useCredits();
  const {
    isLoading,
    purchaseCredits,
    subscribeToPlan,
    cancelSubscription,
    fetchFeatureCosts,
    fetchPlans,
    fetchSubscription,
    fetchCreditBalance,
  } = useRazorpay();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [featureCosts, setFeatureCosts] = useState<FeatureCosts | null>(null);
  const [pricing, setPricing] = useState<CreditPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditAmount, setCreditAmount] = useState(100);
  const [purchasing, setPurchasing] = useState(false);
  const [upgradingPlanSlug, setUpgradingPlanSlug] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [billingToggle, setBillingToggle] = useState<'monthly' | 'yearly'>('monthly');

  // Fetch all data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [costsData, plansData, subData, balanceData] = await Promise.all([
          fetchFeatureCosts(),
          fetchPlans(),
          fetchSubscription(),
          fetchCreditBalance(),
        ]);

        if (costsData) {
          setFeatureCosts(costsData.costs);
          setPricing(costsData.pricing);
        }
        setPlans(plansData || []);
        if (subData) {
          setSubscription(subData.subscription);
          setBillingInfo(subData.billingInfo);
        }
        setCreditBalance(balanceData);
      } catch (error) {
        console.error('Error loading billing data:', error);
        toast.error('Failed to load billing information');
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate price for current credit amount
  const priceCalc = useMemo(() => {
    if (!pricing) return null;
    const min = pricing.minPurchase;
    const max = pricing.maxPurchase;
    if (creditAmount < min || creditAmount > max) return null;

    const tier = pricing.tiers.find(
      (t) => creditAmount >= t.min && creditAmount <= t.max
    ) || pricing.tiers[pricing.tiers.length - 1];

    return {
      totalPrice: creditAmount * tier.pricePerCredit,
      pricePerCredit: tier.pricePerCredit,
      tierLabel: tier.label,
    };
  }, [creditAmount, pricing]);

  // Feature breakdown for a given credit count
  const getFeatureBreakdown = (credits: number) => {
    if (!featureCosts) return [];
    return FEATURE_INFO.map((f) => ({
      ...f,
      count: Math.floor(credits / featureCosts[f.key]),
      cost: featureCosts[f.key],
    }));
  };

  // Handle credit purchase
  const handlePurchaseCredits = async () => {
    if (!priceCalc) return;
    setPurchasing(true);
    await purchaseCredits(creditAmount, async (newBalance) => {
      setCreditBalance(newBalance);
      await refreshCredits();
    });
    setPurchasing(false);
  };

  // Handle plan upgrade
  const handleUpgradePlan = async (planSlug: string) => {
    setUpgradingPlanSlug(planSlug);
    await subscribeToPlan(planSlug, async () => {
      const subData = await fetchSubscription();
      if (subData) {
        setSubscription(subData.subscription);
        setBillingInfo(subData.billingInfo);
      }
      const balanceData = await fetchCreditBalance();
      setCreditBalance(balanceData);
      await refreshCredits();
    });
    setUpgradingPlanSlug(null);
  };

  // Handle cancellation
  const handleCancelSubscription = async () => {
    setCancelling(true);
    await cancelSubscription(async () => {
      const subData = await fetchSubscription();
      if (subData) {
        setSubscription(subData.subscription);
        setBillingInfo(subData.billingInfo);
      }
    });
    setCancelling(false);
  };

  // Format price (whole numbers for plan prices)
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format rate (up to 2 decimals for per-credit costs)
  const formatRate = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Effective rate for a plan (price per credit)
  // For annual plans: yearly price / (monthly credits × 12)
  // For monthly plans: monthly price / monthly credits
  const getEffectiveRate = (plan: SubscriptionPlan) => {
    if (plan.priceInRupees === 0) return null;
    const planCycle = (plan as any).billingCycle || 'monthly';
    const totalCredits = planCycle === 'yearly' ? plan.credits * 12 : plan.credits;
    return (plan.priceInRupees / totalCredits).toFixed(2);
  };

  // Best plan recommendation for comparison callout
  // Computes effective per-credit rate accounting for billing cycle
  const bestPlan = useMemo(() => {
    if (!priceCalc || plans.length === 0) return null;
    const paidPlans = plans.filter((p) => p.priceInRupees > 0);
    const getRate = (p: SubscriptionPlan) => {
      const cycle = (p as any).billingCycle || 'monthly';
      const totalCredits = cycle === 'yearly' ? p.credits * 12 : p.credits;
      return p.priceInRupees / totalCredits;
    };
    const cheapest = paidPlans.reduce((best, p) => {
      return getRate(p) < getRate(best) ? p : best;
    }, paidPlans[0]);
    if (!cheapest) return null;
    const planRate = getRate(cheapest);
    const savings = Math.round((1 - planRate / priceCalc.pricePerCredit) * 100);
    if (savings <= 0) return null;
    return { plan: cheapest, rate: planRate, savings };
  }, [plans, priceCalc]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const balance = creditBalance?.credits ?? 0;
  const breakdown = getFeatureBreakdown(balance);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Billing & Credits</h2>
          <p className="text-muted-foreground">
            Manage your subscription and purchase additional credits
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/settings/billing/history')}>
          <History className="mr-2 h-4 w-4" />
          Payment History
        </Button>
      </div>

      {/* Unified Credit Balance */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Your Credits
            </CardTitle>
            {balance <= 10 && (
              <Badge variant="destructive">Low Balance</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-4xl font-bold">{balance.toLocaleString('en-IN')}</div>
          {featureCosts && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">What your credits can do:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {breakdown.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{item.count.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Subscription */}
      {subscription && (
        <Card className="bg-card border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Current Plan: {subscription.plan.name}
                </CardTitle>
                <CardDescription>
                  {subscription.status === 'ACTIVE' && billingInfo?.nextBillingDate && (
                    <>Next billing: {formatDate(billingInfo.nextBillingDate)}</>
                  )}
                  {subscription.status === 'CANCELLED' && subscription.currentPeriodEnd && (
                    <>Access until: {formatDate(subscription.currentPeriodEnd)}</>
                  )}
                </CardDescription>
              </div>
              <Badge
                variant={
                  subscription.status === 'ACTIVE'
                    ? 'default'
                    : subscription.status === 'CANCELLED'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Price</p>
                <p className="font-semibold">
                  {formatPrice(subscription.plan.priceInRupees)}
                  {(subscription.plan as any).billingCycle === 'yearly' ? '/year' : '/month'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Monthly Credits</p>
                <p className="font-semibold">{subscription.plan.credits.toLocaleString('en-IN')}/month</p>
              </div>
              <div>
                <p className="text-muted-foreground">Billing Cycle</p>
                <p className="font-semibold capitalize">{(subscription.plan as any).billingCycle || 'monthly'}</p>
              </div>
            </div>
          </CardContent>
          {subscription.status === 'ACTIVE' && subscription.plan.slug !== 'free' && (
            <CardFooter>
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="text-destructive hover:text-destructive"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      <Separator />

      {/* Tabs for Plans and Buy Credits */}
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="credits">Buy Credits</TabsTrigger>
        </TabsList>

        {/* Subscription Plans */}
        <TabsContent value="plans" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Choose Your Plan</h3>
              <p className="text-muted-foreground">
                {billingToggle === 'yearly' ? 'Annual billing — save 15%' : 'Monthly subscription with credits each billing cycle'}
              </p>
            </div>
            <div className="flex items-center rounded-lg border border-border p-1">
              <button
                onClick={() => setBillingToggle('monthly')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  billingToggle === 'monthly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingToggle('yearly')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  billingToggle === 'yearly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annual
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {plans
              .filter((plan) => {
                // Free plan shows in both toggles
                if (plan.slug === 'free') return billingToggle === 'monthly';
                // Filter by billing cycle
                const planCycle = (plan as any).billingCycle || 'monthly';
                return planCycle === billingToggle;
              })
              .map((plan) => {
              const isCurrentPlan = subscription?.plan.slug === plan.slug;
              const isFreePlan = plan.slug === 'free';
              const isGrowth = plan.slug === 'growth' || plan.slug === 'growth-annual';
              const effectiveRate = getEffectiveRate(plan);
              const planBreakdown = getFeatureBreakdown(plan.credits);
              const planCycle = (plan as any).billingCycle || 'monthly';
              const displayPrice = planCycle === 'yearly'
                ? Math.round(plan.priceInRupees / 12)
                : plan.priceInRupees;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${isGrowth ? 'border-primary shadow-lg' : ''} ${
                    isCurrentPlan ? 'bg-muted/50' : ''
                  }`}
                >
                  {isGrowth && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">
                        <Star className="mr-1 h-3 w-3" /> Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {plan.name}
                      {isCurrentPlan && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Current
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="space-y-1">
                      <span className="text-2xl font-bold">{formatPrice(displayPrice)}</span>
                      {!isFreePlan && (
                        <span className="text-muted-foreground text-sm">
                          {planCycle === 'yearly' ? '/mo' : '/month'}
                        </span>
                      )}
                    </div>
                    {planCycle === 'yearly' && (
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(plan.priceInRupees)}/year
                      </p>
                    )}
                    <p className="text-sm font-medium text-primary">
                      {plan.credits.toLocaleString('en-IN')} credits/month
                    </p>
                    {effectiveRate && (
                      <p className="text-xs text-muted-foreground">
                        {formatRate(Number(effectiveRate))}/credit
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-2 text-sm">
                      {planBreakdown.map((item) => (
                        <li key={item.key} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span>
                            Up to {item.count.toLocaleString('en-IN')} {item.label.toLowerCase()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isGrowth ? 'default' : 'outline'}
                      disabled={isCurrentPlan || isLoading || upgradingPlanSlug !== null}
                      onClick={() => handleUpgradePlan(plan.slug)}
                    >
                      {upgradingPlanSlug === plan.slug ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : isFreePlan ? (
                        'Downgrade'
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Upgrade
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Custom Plan CTA */}
          <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-semibold">Need a custom plan?</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Looking for volume pricing, dedicated support, or a plan tailored to your team? We&apos;ll build one for you.
              </p>
            </div>
            <a href="mailto:info@recruitkar.com">
              <Button variant="outline" className="shrink-0">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </a>
          </Card>
        </TabsContent>

        {/* Buy Credits */}
        <TabsContent value="credits" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold">Buy Credits</h3>
            <p className="text-muted-foreground">
              Purchase additional credits when you need more. Credits never expire.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Credit Input & Purchase */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How many credits do you need?</CardTitle>
                {pricing && (
                  <CardDescription>
                    Min: {pricing.minPurchase} &middot; Max: {pricing.maxPurchase.toLocaleString('en-IN')}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Credit amount input */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCreditAmount((prev) => Math.max(pricing?.minPurchase ?? 10, prev - 10))}
                    disabled={creditAmount <= (pricing?.minPurchase ?? 10)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setCreditAmount(val);
                    }}
                    className="text-center text-xl font-bold h-12"
                    min={pricing?.minPurchase ?? 10}
                    max={pricing?.maxPurchase ?? 5000}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCreditAmount((prev) => Math.min(pricing?.maxPurchase ?? 5000, prev + 10))}
                    disabled={creditAmount >= (pricing?.maxPurchase ?? 5000)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Pricing tiers */}
                {pricing && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pricing Tiers</p>
                    <div className="space-y-1.5">
                      {pricing.tiers.map((tier) => {
                        const isActive = creditAmount >= tier.min && creditAmount <= tier.max;
                        return (
                          <div
                            key={tier.label}
                            className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                              isActive
                                ? 'border-primary bg-primary/5 text-foreground'
                                : 'border-border text-muted-foreground'
                            }`}
                          >
                            <span>
                              {tier.min.toLocaleString('en-IN')}&ndash;{tier.max.toLocaleString('en-IN')} credits
                            </span>
                            <span className="font-semibold">
                              {formatPrice(tier.pricePerCredit)}/credit
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Price summary */}
                {priceCalc ? (
                  <div className="rounded-md border border-border bg-muted/50 p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="font-medium">
                        {formatPrice(priceCalc.pricePerCredit)}/credit ({priceCalc.tierLabel})
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total</span>
                      <span className="text-2xl font-bold">{formatPrice(priceCalc.totalPrice)}</span>
                    </div>
                  </div>
                ) : pricing && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-sm text-destructive">
                      Please enter a value between {pricing.minPurchase} and {pricing.maxPurchase.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}

                {/* Subscription comparison callout */}
                {bestPlan && (
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                    <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      With the <span className="font-semibold text-foreground">{bestPlan.plan.name}</span> plan, get{' '}
                      <span className="font-semibold text-foreground">{bestPlan.plan.credits.toLocaleString('en-IN')} credits/month</span>{' '}
                      at just {formatRate(bestPlan.rate)}/credit &mdash;{' '}
                      <span className="font-semibold text-primary">{bestPlan.savings}% cheaper</span>!
                    </p>
                  </div>
                )}

                {/* Buy button */}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!priceCalc || purchasing || isLoading}
                  onClick={handlePurchaseCredits}
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : priceCalc ? (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Buy Now &mdash; {formatPrice(priceCalc.totalPrice)}
                    </>
                  ) : (
                    'Enter valid amount'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right: Feature Costs Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feature Costs</CardTitle>
                <CardDescription>
                  Credits are shared across all features. Use them however you need.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {featureCosts && FEATURE_INFO.map((feature) => (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between rounded-md border border-border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-muted">
                        <feature.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{feature.label}</p>
                        <p className="text-xs text-muted-foreground">Per {feature.unit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{featureCosts[feature.key]}</p>
                      <p className="text-xs text-muted-foreground">credits</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
