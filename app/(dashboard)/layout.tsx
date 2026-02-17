'use client';

import { useAuthContext } from '@/lib/auth/auth-context';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Settings, Briefcase, Search, Video, Calendar,
  BarChart3, Inbox, ListChecks, ChevronDown, ChevronRight,
  LogOut, Loader2, GitBranch, FileText,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CreditBalanceCard } from '@/components/payments/CreditBalanceCard';
import { CreditProvider } from '@/lib/credits/credit-context';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive(href)
        ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-px'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  const initials = useMemo(() => getInitials(user?.name, user?.email), [user?.name, user?.email]);
  const avatarColor = useMemo(() => getAvatarColor(user?.id), [user?.id]);

  const planSlug = user?.plan?.slug;
  const isFreePlan = !planSlug || planSlug === 'free';

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
        <div className="mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="RecruitKar"
              className="h-9 w-auto object-contain"
            />
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className={`${avatarColor} text-white text-[10px] font-semibold`}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <aside className="w-60 border-r border-border bg-card h-full flex flex-col">
          {/* Scrollable nav */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin space-y-1 px-3 py-4">
            <Link href="/dashboard" className={linkClass('/dashboard')}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <Link href="/jobs" className={linkClass('/jobs')}>
              <Briefcase size={18} />
              <span>Jobs</span>
            </Link>
            <Link href="/sourcing" className={linkClass('/sourcing')}>
              <Search size={18} />
              <span>Sourcing</span>
              <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                NEW
              </span>
            </Link>

            <Separator className="my-3" />

            {/* Outreach Section */}
            <Collapsible open={outreachOpen} onOpenChange={setOutreachOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Outreach
                  </span>
                  {isFreePlan && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                      PRO
                    </Badge>
                  )}
                </div>
                {outreachOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                <Link href="/outreach/sequences" className={linkClass('/outreach/sequences')}>
                  <ListChecks size={18} />
                  <span>Sequences</span>
                </Link>
                <Link href="/outreach/pipeline" className={linkClass('/outreach/pipeline')}>
                  <GitBranch size={18} />
                  <span>Pipeline</span>
                </Link>
                <Link href="/outreach/inbox" className={linkClass('/outreach/inbox')}>
                  <Inbox size={18} />
                  <span>Inbox</span>
                </Link>
              </CollapsibleContent>
            </Collapsible>

            {/* Interviews Section */}
            <Collapsible open={interviewsOpen} onOpenChange={setInterviewsOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Interviews
                </span>
                {interviewsOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                <Link href="/interviews/schedule" className={linkClass('/interviews/schedule')}>
                  <Calendar size={18} />
                  <span>Schedule</span>
                </Link>
                <Link href="/interviews/tracking" className={linkClass('/interviews/tracking')}>
                  <Video size={18} />
                  <span>Tracking</span>
                </Link>
                <Link href="/interviews/results" className={linkClass('/interviews/results')}>
                  <BarChart3 size={18} />
                  <span>Results</span>
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="my-3" />

            <Link href="/templates" className={linkClass('/templates')}>
              <FileText size={18} />
              <span>Templates</span>
            </Link>
          </nav>

          {/* Pinned bottom section */}
          <div className="border-t border-border">
            {/* User info + credits */}
            <div className="px-3 py-3 space-y-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={`${avatarColor} text-white text-xs font-semibold`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                {user?.plan && (
                  <Badge
                    variant={isFreePlan ? 'secondary' : 'default'}
                    className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0"
                  >
                    {user.plan.name}
                  </Badge>
                )}
              </div>

              <CreditBalanceCard variant="compact" />
            </div>

            {/* Settings + Sign Out */}
            <div className="border-t border-border px-3 py-2 flex items-center gap-1">
              <Link
                href="/settings"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Settings size={14} />
                <span>Settings</span>
              </Link>

              <div className="h-4 w-px bg-border" />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                    <LogOut size={14} />
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
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-8 bg-background">{children}</main>
      </div>
    </div>
    </CreditProvider>
  );
}
