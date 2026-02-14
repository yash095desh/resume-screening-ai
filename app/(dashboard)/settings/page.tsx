'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/lib/auth/auth-context';
import { useUser } from '@/lib/auth/hooks';
import { useApiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertCircle,
  Coins,
  Search,
  FileText,
  Video,
  Mail,
  History,
  Calendar,
  Check,
  Loader2,
  Pencil,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// Feature costs (must match backend)
const FEATURE_COSTS = {
  SOURCING: 6,
  SCREENING: 1,
  INTERVIEW: 145,
  OUTREACH: 1,
};

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-rose-600',
  'bg-amber-600', 'bg-cyan-600', 'bg-pink-600', 'bg-indigo-600',
];

function getInitials(name: string | null | undefined, email: string | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
}

function getAvatarColor(id: string | undefined): string {
  if (!id) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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
  const { user: authUser, refreshUser } = useAuthContext();
  const { user, isLoaded: isUserLoaded } = useUser();
  const api = useApiClient();

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [saving, setSaving] = useState(false);

  // Credit/subscription state
  const [credits, setCredits] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [isLoadingSub, setIsLoadingSub] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const avatarColor = getAvatarColor(authUser?.id);
  const initials = getInitials(authUser?.name, authUser?.email);

  useEffect(() => {
    fetchCredits();
    fetchSubscription();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEditing() {
    setEditName(authUser?.name || '');
    setEditCompany(authUser?.companyName || '');
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    const { data, ok } = await api.patch('/api/auth/me', {
      name: editName,
      companyName: editCompany,
    });

    if (ok) {
      await refreshUser();
      setEditing(false);
      toast.success('Profile updated');
    } else {
      toast.error(data?.error || 'Failed to update profile');
    }
    setSaving(false);
  }

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
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Card */}
      <Card className="border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-foreground">Profile</h3>
            <p className="text-sm text-muted-foreground">Your personal information</p>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="editName">Full name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="editCompany">
                Company name <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="editCompany"
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
                placeholder="Your company"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label>Email address</Label>
              <Input value={authUser?.email || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed as it is your login identifier.</p>
            </div>

            {/* Workspace URL (read-only) */}
            <div className="space-y-2">
              <Label>Workspace URL</Label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{authUser?.domainSlug}</span>.recruitkar.com
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Workspace URL cannot be changed as it is tied to your email infrastructure.</p>
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving || !editName.trim()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-6">
            {/* Avatar display */}
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarFallback className={`${avatarColor} text-white text-2xl font-semibold`}>
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Info grid */}
            <div className="flex-1 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</p>
                <p className="text-base text-foreground">{authUser?.name || 'Not set'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Address</p>
                <p className="text-base text-foreground">{authUser?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Company</p>
                <p className="text-base text-foreground">{authUser?.companyName || 'Not set'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Workspace URL</p>
                <p className="text-base text-foreground">{authUser?.domainSlug ? `${authUser.domainSlug}.recruitkar.com` : 'Not set'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Member Since</p>
                <p className="text-base text-foreground">
                  {authUser?.createdAt ? formatDate(authUser.createdAt) : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Plan</p>
                <div className="flex items-center gap-2">
                  {subscription && (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        {subscription.plan.name}
                      </Badge>
                      {subscription.plan.priceInRupees > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ₹{subscription.plan.priceInRupees.toLocaleString('en-IN')}/month
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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
    </div>
  );
}
