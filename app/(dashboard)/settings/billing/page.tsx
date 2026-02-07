'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useRazorpay,
  CreditPackage,
  SubscriptionPlan,
  CreditBalance,
} from '@/lib/hooks/useRazorpay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  SOURCING: <Search className="h-5 w-5" />,
  SCREENING: <FileText className="h-5 w-5" />,
  INTERVIEW: <Video className="h-5 w-5" />,
  OUTREACH: <Mail className="h-5 w-5" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  SOURCING: 'Candidate Search',
  SCREENING: 'Resume Screening',
  INTERVIEW: 'AI Interviews',
  OUTREACH: 'Email Outreach',
};

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
  const {
    isLoading,
    purchaseCreditPackage,
    subscribeToPlan,
    cancelSubscription,
    fetchGroupedPackages,
    fetchPlans,
    fetchSubscription,
    fetchCreditBalance,
  } = useRazorpay();

  const [groupedPackages, setGroupedPackages] = useState<Record<string, CreditPackage[]>>({});
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(null);
  const [upgradingPlanSlug, setUpgradingPlanSlug] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [packagesData, plansData, subData, balanceData] = await Promise.all([
          fetchGroupedPackages(),
          fetchPlans(),
          fetchSubscription(),
          fetchCreditBalance(),
        ]);

        setGroupedPackages(packagesData || {});
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

  // Handle package purchase
  const handlePurchasePackage = async (pkg: CreditPackage) => {
    setPurchasingPackageId(pkg.id);
    await purchaseCreditPackage(pkg.id, (newBalance) => {
      setCreditBalance(newBalance);
    });
    setPurchasingPackageId(null);
  };

  // Handle plan upgrade
  const handleUpgradePlan = async (planSlug: string) => {
    setUpgradingPlanSlug(planSlug);
    await subscribeToPlan(planSlug, async () => {
      // Refresh subscription data
      const subData = await fetchSubscription();
      if (subData) {
        setSubscription(subData.subscription);
        setBillingInfo(subData.billingInfo);
      }
      const balanceData = await fetchCreditBalance();
      setCreditBalance(balanceData);
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

  // Format price
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

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

      {/* Credit Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Credits</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditBalance?.sourcingCredits ?? 0}</div>
            <p className="text-xs text-muted-foreground">Candidate searches</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Screening Credits</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditBalance?.screeningCredits ?? 0}</div>
            <p className="text-xs text-muted-foreground">Resume analyses</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Credits</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditBalance?.interviewCredits ?? 0}</div>
            <p className="text-xs text-muted-foreground">AI voice interviews</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outreach Credits</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditBalance?.outreachCredits ?? 0}</div>
            <p className="text-xs text-muted-foreground">Emails to send</p>
          </CardContent>
        </Card>
      </div>

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Monthly Price</p>
                <p className="font-semibold">{formatPrice(subscription.plan.priceInRupees)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Search</p>
                <p className="font-semibold">{subscription.plan.sourcingCredits}/month</p>
              </div>
              <div>
                <p className="text-muted-foreground">Screening</p>
                <p className="font-semibold">{subscription.plan.screeningCredits}/month</p>
              </div>
              <div>
                <p className="text-muted-foreground">Interviews</p>
                <p className="font-semibold">{subscription.plan.interviewCredits}/month</p>
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

      {/* Tabs for Plans and Credit Packs */}
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="credits">Credit Packs</TabsTrigger>
        </TabsList>

        {/* Subscription Plans */}
        <TabsContent value="plans" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold">Choose Your Plan</h3>
            <p className="text-muted-foreground">
              Monthly subscription with credits that reset each billing cycle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.plan.slug === plan.slug;
              const isFreePlan = plan.slug === 'free';
              const isPro = plan.slug === 'pro';

              return (
                <Card
                  key={plan.id}
                  className={`relative ${isPro ? 'border-primary shadow-lg' : ''} ${
                    isCurrentPlan ? 'bg-muted/50' : ''
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">
                        <Star className="mr-1 h-3 w-3" /> Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {isCurrentPlan && (
                        <Badge variant="secondary" className="ml-auto">
                          Current
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="space-y-1">
                      <span className="text-3xl font-bold">{formatPrice(plan.priceInRupees)}</span>
                      {!isFreePlan && <span className="text-muted-foreground">/month</span>}
                    </div>
                    {plan.description && (
                      <CardDescription>{plan.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        {plan.sourcingCredits} search credits
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        {plan.screeningCredits} screening credits
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        {plan.interviewCredits} interview credits
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        {plan.outreachCredits} outreach credits
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isPro ? 'default' : 'outline'}
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
        </TabsContent>

        {/* Credit Packs */}
        <TabsContent value="credits" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold">Buy Credit Packs</h3>
            <p className="text-muted-foreground">
              Purchase additional credits when you need more. Credits never expire.
            </p>
          </div>

          {Object.entries(groupedPackages || {}).map(([category, packages]) => (
            <div key={category} className="space-y-4">
              <h4 className="text-lg font-medium flex items-center gap-2">
                {CATEGORY_ICONS[category]}
                {CATEGORY_LABELS[category] || category}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <Card key={pkg.id} className={pkg.isFeatured ? 'border-primary' : ''}>
                    {pkg.isFeatured && (
                      <div className="absolute -top-2 right-4">
                        <Badge className="bg-primary">Best Value</Badge>
                      </div>
                    )}
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      {pkg.description && (
                        <CardDescription>{pkg.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{pkg.credits}</span>
                        <span className="text-muted-foreground">credits</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-semibold">{formatPrice(pkg.priceInRupees)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(pkg.priceInRupees / pkg.credits)} per credit
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant={pkg.isFeatured ? 'default' : 'outline'}
                        disabled={isLoading || purchasingPackageId !== null}
                        onClick={() => handlePurchasePackage(pkg)}
                      >
                        {purchasingPackageId === pkg.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Buy Now
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groupedPackages || {}).length === 0 && (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Credit Packs Available</h3>
                <p className="text-muted-foreground">
                  Credit packs will be available soon. Check back later!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
