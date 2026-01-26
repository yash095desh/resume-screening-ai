import { redirect } from 'next/navigation';

// Redirect to the main dashboard at /dashboard
// This file exists due to Next.js route group structure but is unreachable
// because app/page.tsx (landing page) takes precedence at "/"
export default function RootDashboardRedirect() {
  redirect('/dashboard');
}
