import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { LayoutDashboard, Settings, Upload, Search } from 'lucide-react';

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