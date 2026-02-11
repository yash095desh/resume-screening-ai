'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useState } from 'react';
import { LayoutDashboard, Settings, Upload, Search, Video, Mail, CheckCircle, Inbox, ListChecks, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CreditBalanceCard } from '@/components/payments/CreditBalanceCard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [outreachOpen, setOutreachOpen] = useState(true);
  const [interviewsOpen, setInterviewsOpen] = useState(true);

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center">
            <img
              src="/logo.png"
              alt="RecruitKar"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="mx-auto flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card h-full flex flex-col">
          <nav className="flex-1 overflow-y-auto scrollbar-thin space-y-1 p-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-muted transition-colors"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>

            {/* Resume Screening Section */}
            <div className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground px-4 mb-2">
                RESUME SCREENING
              </p>
              <Link
                href="/jobs"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-muted transition-colors"
              >
                <Upload size={20} />
                <span>Jobs</span>
              </Link>
            </div>

            {/* AI Sourcing Section */}
            <div className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground px-4 mb-2">
                AI SOURCING
              </p>
              <Link
                href="/sourcing"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-muted transition-colors"
              >
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
                  <Link
                    href="/outreach/sequences"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-muted transition-colors"
                  >
                    <ListChecks size={20} />
                    <span>Sequences</span>
                  </Link>
                  <Link
                    href="/outreach/pipeline"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-muted transition-colors"
                  >
                    <CheckCircle size={20} />
                    <span>Pipeline</span>
                  </Link>
                  <Link
                    href="/outreach/inbox"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-muted transition-colors"
                  >
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
                  <Link
                    href="/interviews/schedule"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-muted transition-colors"
                  >
                    <Mail size={20} />
                    <span>Schedule</span>
                  </Link>
                  <Link
                    href="/interviews/tracking"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-muted transition-colors"
                  >
                    <Video size={20} />
                    <span>Tracking</span>
                  </Link>
                  <Link
                    href="/interviews/results"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-muted transition-colors"
                  >
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
              <Link
                href="/templates"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-muted transition-colors"
              >
                <Mail size={20} />
                <span>Email Templates</span>
              </Link>
            </div>

            {/* Settings */}
            <div className="pt-4">
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-muted transition-colors"
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
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
  );
}