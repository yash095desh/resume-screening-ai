'use client';

import { OutreachGuard } from '@/components/OutreachGuard';
import { OutreachStatusBar } from '@/components/OutreachStatusBar';

export default function OutreachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OutreachGuard>
      <OutreachStatusBar />
      {children}
    </OutreachGuard>
  );
}
