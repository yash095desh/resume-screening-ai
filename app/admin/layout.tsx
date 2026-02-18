'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminGuard } from '@/components/admin/AdminGuard';
import {
  Server,
  Import,
  ShieldBan,
  ArrowLeft,
  Users,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  const linkClass = (href: string) =>
    `flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
      isActive(href)
        ? 'bg-primary/10 text-primary font-medium'
        : 'hover:bg-muted text-muted-foreground'
    }`;

  return (
    <AdminGuard>
      <div className="h-screen overflow-hidden bg-background">
        {/* Header */}
        <nav className="border-b border-border bg-card">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <div className="h-5 w-px bg-border" />
              <span className="font-semibold text-sm">Admin Panel</span>
            </div>
          </div>
        </nav>

        <div className="flex h-[calc(100vh-56px)]">
          {/* Sidebar */}
          <aside className="w-56 border-r border-border bg-card flex flex-col">
            <nav className="flex-1 space-y-1 p-3">
              <p className="text-xs font-semibold text-muted-foreground px-4 py-2">
                MAILBOXES
              </p>
              <Link href="/admin/mailboxes" className={linkClass('/admin/mailboxes')}>
                <Server size={18} />
                <span>Dashboard</span>
              </Link>
              <Link href="/admin/mailboxes/import" className={linkClass('/admin/mailboxes/import')}>
                <Import size={18} />
                <span>Bulk Import</span>
              </Link>

              <p className="text-xs font-semibold text-muted-foreground px-4 py-2 pt-6">
                USERS
              </p>
              <Link href="/admin/users" className={linkClass('/admin/users')}>
                <Users size={18} />
                <span>Management</span>
              </Link>

              <p className="text-xs font-semibold text-muted-foreground px-4 py-2 pt-6">
                DELIVERABILITY
              </p>
              <Link href="/admin/suppression" className={linkClass('/admin/suppression')}>
                <ShieldBan size={18} />
                <span>Suppression List</span>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-h-0 overflow-y-auto p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
