import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { LayoutDashboard, Settings, Upload, Search, Video, Mail, CheckCircle, Inbox, ListChecks } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-blue-600">
            ResumeAI
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="mx-auto flex ">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white ">
          <nav className="space-y-2 p-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-gray-100"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>

            {/* Resume Screening Section */}
            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-500 px-4 mb-2">
                RESUME SCREENING
              </p>
              <Link
                href="/jobs"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-gray-100"
              >
                <Upload size={20} />
                <span>Jobs</span>
              </Link>
            </div>

            {/* AI Sourcing Section */}
            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-500 px-4 mb-2">
                AI SOURCING
              </p>
              <Link
                href="/sourcing"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-purple-50 hover:text-purple-700"
              >
                <Search size={20} />
                <span>Sourcing Jobs</span>
                <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  NEW
                </span>
              </Link>
            </div>

            {/* Outreach Section */}
            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-500 px-4 mb-2">
                OUTREACH
              </p>
              <Link
                href="/outreach/sequences"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-blue-50 hover:text-blue-700"
              >
                <ListChecks size={20} />
                <span>Sequences</span>
              </Link>
              <Link
                href="/outreach/pipeline"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-blue-50 hover:text-blue-700"
              >
                <CheckCircle size={20} />
                <span>Pipeline</span>
              </Link>
              <Link
                href="/outreach/inbox"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-blue-50 hover:text-blue-700"
              >
                <Inbox size={20} />
                <span>Inbox</span>
              </Link>
            </div>

            {/* Interviews Section */}
            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-500 px-4 mb-2">
                INTERVIEWS
              </p>
              <Link
                href="/interviews/schedule"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-green-50 hover:text-green-700"
              >
                <Mail size={20} />
                <span>Schedule</span>
              </Link>
              <Link
                href="/interviews/tracking"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-green-50 hover:text-green-700"
              >
                <Video size={20} />
                <span>Tracking</span>
              </Link>
              <Link
                href="/interviews/results"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-green-50 hover:text-green-700"
              >
                <CheckCircle size={20} />
                <span>Results</span>
              </Link>
            </div>

            {/* Templates */}
            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-500 px-4 mb-2">
                CONFIGURATION
              </p>
              <Link
                href="/templates"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-gray-100"
              >
                <Mail size={20} />
                <span>Email Templates</span>
              </Link>
            </div>

            {/* Settings */}
            <div className="pt-4">
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-gray-100"
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}