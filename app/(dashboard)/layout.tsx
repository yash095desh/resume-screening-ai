'use client';

import { useAuthContext } from '@/lib/auth/auth-context';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Settings, Upload, Search, Video, Mail,
  CheckCircle, Inbox, ListChecks, ChevronDown, ChevronRight,
  LogOut, Loader2,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CreditBalanceCard } from '@/components/payments/CreditBalanceCard';
import { CreditProvider } from '@/lib/credits/credit-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoaded, isSignedIn } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [outreachOpen, setOutreachOpen] = useState(true);
  const [interviewsOpen, setInterviewsOpen] = useState(true);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    `flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
      isActive(href)
        ? 'bg-primary/10 text-primary font-medium'
        : 'hover:bg-muted'
    }`;

  const initials = useMemo(() => getInitials(user?.name, user?.email), [user?.name, user?.email]);
  const avatarColor = useMemo(() => getAvatarColor(user?.id), [user?.id]);

  // Redirect to sign-in if auth is loaded but user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while auth is being restored from localStorage
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <CreditProvider>
    <div className="h-screen overflow-hidden bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="RecruitKar"
              className="h-10 w-auto object-contain"
            />
          </Link>
          {/* Header avatar — click navigates to settings/profile */}
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className={`${avatarColor} text-white text-xs font-semibold`}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </nav>

      <div className="mx-auto flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card h-full flex flex-col">
          <nav className="flex-1 overflow-y-auto scrollbar-thin space-y-1 p-4">
            <Link href="/dashboard" className={linkClass('/dashboard')}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>

            {/* Resume Screening Section */}
            <div className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground px-4 mb-2">
                RESUME SCREENING
              </p>
              <Link href="/jobs" className={linkClass('/jobs')}>
                <Upload size={20} />
                <span>Jobs</span>
              </Link>
            </div>

            {/* AI Sourcing Section */}
            <div className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground px-4 mb-2">
                AI SOURCING
              </p>
              <Link href="/sourcing" className={linkClass('/sourcing')}>
                <Search size={20} />
                <span>Sourcing Jobs</span>
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  NEW
                </span>
              </Link>
            </div>

            {/* Outreach Section */}
            <div className="pt-4">
              <Collapsible open={outreachOpen} onOpenChange={setOutreachOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-4 py-2 hover:bg-muted transition-colors">
                  <p className="text-xs font-semibold text-muted-foreground">
                    OUTREACH
                  </p>
                  {outreachOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  <Link href="/outreach/sequences" className={linkClass('/outreach/sequences')}>
                    <ListChecks size={20} />
                    <span>Sequences</span>
                  </Link>
                  <Link href="/outreach/pipeline" className={linkClass('/outreach/pipeline')}>
                    <CheckCircle size={20} />
                    <span>Pipeline</span>
                  </Link>
                  <Link href="/outreach/inbox" className={linkClass('/outreach/inbox')}>
                    <Inbox size={20} />
                    <span>Inbox</span>
                  </Link>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Interviews Section */}
            <div className="pt-4">
              <Collapsible open={interviewsOpen} onOpenChange={setInterviewsOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-4 py-2 hover:bg-muted transition-colors">
                  <p className="text-xs font-semibold text-muted-foreground">
                    INTERVIEWS
                  </p>
                  {interviewsOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  <Link href="/interviews/schedule" className={linkClass('/interviews/schedule')}>
                    <Mail size={20} />
                    <span>Schedule</span>
                  </Link>
                  <Link href="/interviews/tracking" className={linkClass('/interviews/tracking')}>
                    <Video size={20} />
                    <span>Tracking</span>
                  </Link>
                  <Link href="/interviews/results" className={linkClass('/interviews/results')}>
                    <CheckCircle size={20} />
                    <span>Results</span>
                  </Link>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Templates */}
            <div className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground px-4 mb-2">
                CONFIGURATION
              </p>
              <Link href="/templates" className={linkClass('/templates')}>
                <Mail size={20} />
                <span>Email Templates</span>
              </Link>
            </div>

            {/* Settings */}
            <div className="pt-4">
              <Link href="/settings" className={linkClass('/settings')}>
                <Settings size={20} />
                <span>Settings</span>
              </Link>

              {/* Sign Out */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors mt-1">
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out of RecruitKar?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will need to sign in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={logout}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </nav>

          {/* Credit Balance - bottom of sidebar */}
          <div className="border-t border-border p-4">
            <CreditBalanceCard variant="compact" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-8 bg-background">{children}</main>
      </div>
    </div>
    </CreditProvider>
  );
}
