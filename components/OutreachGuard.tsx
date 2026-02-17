'use client';

import { useAuthContext } from '@/lib/auth/auth-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface OutreachGuardProps {
  children: React.ReactNode;
}

/**
 * Guards outreach pages behind a paid plan requirement.
 * Free users see an upgrade prompt instead of the page content.
 */
export function OutreachGuard({ children }: OutreachGuardProps) {
  const { user, isLoaded } = useAuthContext();

  if (!isLoaded) return null;

  const isFreePlan = !user?.plan || user.plan.slug === 'free';

  if (isFreePlan) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Upgrade to Access Outreach</h2>
            <p className="text-muted-foreground">
              Email outreach is available on paid plans. Upgrade to start sending
              personalized email sequences to candidates.
            </p>
          </div>
          <Alert className="text-left">
            <AlertTitle>What you get with a paid plan</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Dedicated email mailboxes for outreach</li>
                <li>Multi-step automated email sequences</li>
                <li>Reply tracking and inbox management</li>
                <li>More monthly credits for all features</li>
              </ul>
            </AlertDescription>
          </Alert>
          <Link href="/settings/billing">
            <Button size="lg" className="w-full">
              View Plans & Upgrade
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
