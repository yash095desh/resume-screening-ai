import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Briefcase, LayoutDashboard, Settings } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600">
            ResumeAI
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white p-4">
          <nav className="space-y-2">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-gray-100"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/jobs"
              className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-gray-100"
            >
              <Briefcase size={20} />
              <span>Jobs</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-gray-100"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}