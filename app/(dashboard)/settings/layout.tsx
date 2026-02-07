'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, CreditCard, History } from 'lucide-react';

const settingsTabs = [
  {
    name: 'Profile',
    href: '/settings',
    icon: User,
  },
  {
    name: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determine active tab
  const isActive = (href: string) => {
    if (href === '/settings') {
      return pathname === '/settings';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, billing, and preferences
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-4" aria-label="Settings tabs">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{children}</div>
    </div>
  );
}
