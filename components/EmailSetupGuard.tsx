'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  Loader2,
  XCircle
} from 'lucide-react';

interface EmailStatus {
  status: 'not_setup' | 'pending_verification' | 'warming_up' | 'ready' | 'paused';
  statusMessage: string;
  canSendNow: boolean;
  emailSubdomain: string | null;
  emailFromAddress: string | null;
  domainVerified: boolean;
  domainVerifiedAt: string | null;
  domainPaused: boolean;
  domainPausedAt: string | null;
  domainPausedReason: string | null;
  dailyEmailLimit: number;
  emailsSentToday: number;
  emailsRemaining: number;
  dailyLimitResetIn: string;
  warmupStartedAt: string | null;
  warmupDaysElapsed: number;
  warmupDaysTotal: number;
  warmupProgress: number;
  isWarmupComplete: boolean;
  recommendedDailyLimit: number;
  setupStages: {
    subdomainAssigned: boolean;
    dnsConfigured: boolean;
    domainVerified: boolean;
    warmupStarted: boolean;
    warmupComplete: boolean;
  };
  setupProgress: number;
  totalEmailsSent: number;
  totalEmailsBounced: number;
  totalSpamComplaints: number;
  bounceRate: number;
  spamRate: number;
}

interface EmailSetupGuardProps {
  /**
   * Show full details about email infrastructure status
   * If false, only shows warning banner when not ready
   */
  showDetails?: boolean;

  /**
   * Block interaction if email infrastructure not ready
   * If true, shows overlay to prevent actions
   */
  blockIfNotReady?: boolean;

  /**
   * Children to render (will be blocked if blockIfNotReady and not ready)
   */
  children?: React.ReactNode;
}

export function EmailSetupGuard({
  showDetails = false,
  blockIfNotReady = false,
  children
}: EmailSetupGuardProps) {
  const { getToken } = useAuth();
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmailStatus() {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          setError('Authentication required');
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        console.log('[EmailSetupGuard] Fetching email status from:', `${apiUrl}/api/user-email-status`);

        const response = await fetch(`${apiUrl}/api/user-email-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('[EmailSetupGuard] Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[EmailSetupGuard] Error response:', errorText);
          throw new Error('Failed to fetch email status');
        }

        const data = await response.json();
        console.log('[EmailSetupGuard] Email status data:', data);
        setEmailStatus(data);
      } catch (err: any) {
        console.error('[EmailSetupGuard] Error fetching email status:', err);
        setError(err.message || 'Failed to load email status');
      } finally {
        setLoading(false);
      }
    }

    fetchEmailStatus();
  }, [getToken]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
        <span className="text-sm text-muted-foreground">Loading email infrastructure status...</span>
      </div>
    );
  }

  // Error state
  if (error || !emailStatus) {
    return (
      <Alert variant="destructive" className="w-full">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="line-clamp-none">Error</AlertTitle>
        <AlertDescription className="break-words whitespace-normal">
          {error || 'Failed to load email infrastructure status'}
        </AlertDescription>
      </Alert>
    );
  }

  // Get status icon and color
  const getStatusIcon = () => {
    switch (emailStatus.status) {
      case 'ready':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warming_up':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending_verification':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'paused':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'not_setup':
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (): any => {
    switch (emailStatus.status) {
      case 'ready':
        return 'default';
      case 'warming_up':
        return 'secondary';
      case 'pending_verification':
        return 'outline';
      case 'paused':
          return 'default';
      case 'not_setup':
          return 'default';
      default:
        return 'destructive';
    }
  };

  // Render detailed status view
  if (showDetails) {
    return (
      <div className="w-full space-y-4">
        {/* Status Banner */}
        <Alert variant={getStatusVariant()} className="w-full">
          {getStatusIcon()}
          <AlertTitle className="flex items-center gap-2 flex-wrap line-clamp-none">
            Email Infrastructure Status
            <Badge variant={getStatusVariant()} className="ml-2">
              {emailStatus.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </AlertTitle>
          <AlertDescription className="break-words whitespace-normal">
            {emailStatus.statusMessage}
          </AlertDescription>
        </Alert>

        {/* Setup Progress */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Setup Progress</h3>
            <span className="text-sm text-muted-foreground">{emailStatus.setupProgress}%</span>
          </div>
          <Progress value={emailStatus.setupProgress} />

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {emailStatus.setupStages.subdomainAssigned ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <Clock className="h-3 w-3 text-gray-400" />
              )}
              <span>Subdomain Assigned</span>
            </div>
            <div className="flex items-center gap-2">
              {emailStatus.setupStages.dnsConfigured ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <Clock className="h-3 w-3 text-gray-400" />
              )}
              <span>DNS Configured</span>
            </div>
            <div className="flex items-center gap-2">
              {emailStatus.setupStages.domainVerified ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <Clock className="h-3 w-3 text-gray-400" />
              )}
              <span>Domain Verified</span>
            </div>
            <div className="flex items-center gap-2">
              {emailStatus.setupStages.warmupStarted ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <Clock className="h-3 w-3 text-gray-400" />
              )}
              <span>Warmup Started</span>
            </div>
            <div className="flex items-center gap-2">
              {emailStatus.setupStages.warmupComplete ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <Clock className="h-3 w-3 text-gray-400" />
              )}
              <span>Warmup Complete</span>
            </div>
          </div>
        </div>

        {/* Warmup Progress (if in warmup) */}
        {emailStatus.status === 'warming_up' && (
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Email Warmup Progress</h3>
              <span className="text-sm text-muted-foreground">
                Day {emailStatus.warmupDaysElapsed}/{emailStatus.warmupDaysTotal}
              </span>
            </div>
            <Progress value={emailStatus.warmupProgress} />
            <p className="text-sm text-muted-foreground">
              Your email domain is warming up to build sender reputation. Daily sending limits will increase gradually over {emailStatus.warmupDaysTotal} days.
            </p>
          </div>
        )}

        {/* Daily Limits */}
        {emailStatus.domainVerified && (
          <div className="p-4 border rounded-lg space-y-3">
            <h3 className="font-semibold">Daily Sending Limits</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Emails sent today:</span>
                <span className="font-medium">{emailStatus.emailsSentToday} / {emailStatus.dailyEmailLimit}</span>
              </div>
              <Progress
                value={(emailStatus.emailsSentToday / emailStatus.dailyEmailLimit) * 100}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{emailStatus.emailsRemaining} emails remaining</span>
                <span>Resets in {emailStatus.dailyLimitResetIn}</span>
              </div>
            </div>
          </div>
        )}

        {/* Email Configuration */}
        {emailStatus.emailSubdomain && (
          <div className="p-4 border rounded-lg space-y-2">
            <h3 className="font-semibold mb-3">Email Configuration</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subdomain:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{emailStatus.emailSubdomain}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">From Address:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{emailStatus.emailFromAddress}</code>
              </div>
            </div>
          </div>
        )}

        {/* Statistics (if emails have been sent) */}
        {emailStatus.totalEmailsSent > 0 && (
          <div className="p-4 border rounded-lg space-y-2">
            <h3 className="font-semibold mb-3">Statistics</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Total Sent</div>
                <div className="text-2xl font-bold">{emailStatus.totalEmailsSent}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Bounce Rate</div>
                <div className="text-2xl font-bold">{emailStatus.bounceRate}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Bounced</div>
                <div className="text-lg font-semibold">{emailStatus.totalEmailsBounced}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Spam Rate</div>
                <div className="text-lg font-semibold">{emailStatus.spamRate}%</div>
              </div>
            </div>
          </div>
        )}

        {children}
      </div>
    );
  }

  // Simple banner mode - only show warning if not ready
  const showWarning = !emailStatus.canSendNow;

  return (
    <div className="w-full space-y-4">
      {showWarning && (
        <Alert variant={getStatusVariant()} className="w-full">
          {getStatusIcon()}
          <AlertTitle className="line-clamp-none">Email Infrastructure Not Ready</AlertTitle>
          <AlertDescription className="break-words whitespace-normal">
            {emailStatus.statusMessage}

            {emailStatus.status === 'pending_verification' && (
              <div className="mt-2 text-xs">
                Domain verification usually takes 5-10 minutes. Please check back shortly.
              </div>
            )}

            {emailStatus.status === 'paused' && emailStatus.domainPausedReason && (
              <div className="mt-2 text-xs">
                Reason: {emailStatus.domainPausedReason}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Block content if not ready and blockIfNotReady is true */}
      {blockIfNotReady && !emailStatus.canSendNow ? (
        <div className="relative opacity-50 pointer-events-none">
          {children}
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
