'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, ArrowRight, Users, Zap, Shield } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { login } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      router.push(redirect);
    } else if (result.needsVerification) {
      router.push(`/verify-otp?email=${encodeURIComponent(result.email || email)}&type=email_verification`);
    } else if (result.needsPasswordReset) {
      router.push(`/forgot-password?email=${encodeURIComponent(email)}`);
    } else {
      setError(result.error || 'Sign in failed');
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[hsl(var(--landing-primary)/0.15)] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[hsl(var(--landing-accent)/0.1)] blur-[80px]" />

        <div className="relative z-10">
          <Link href="/">
            <Image src="/logo.png" alt="RecruitKar" width={160} height={48} className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight" style={{ color: 'hsl(var(--text-hero))' }}>
              Your AI-powered<br />recruitment platform
            </h1>
            <p className="text-base leading-relaxed" style={{ color: 'hsl(var(--text-hero-muted))' }}>
              Screen resumes, source candidates, run AI interviews, and automate outreach — all in one place.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Users, text: 'Source top talent from LinkedIn automatically' },
              { icon: Zap, text: 'AI-powered screening saves hours per hire' },
              { icon: Shield, text: 'Enterprise-grade security for your data' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ background: 'hsl(var(--landing-primary)/0.15)' }}>
                  <Icon className="h-4 w-4" style={{ color: 'hsl(var(--landing-primary))' }} />
                </div>
                <span className="text-sm" style={{ color: 'hsl(var(--text-hero-muted))' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: 'hsl(var(--text-hero-muted)/0.6)' }}>
          Trusted by 500+ recruiters worldwide
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 flex-col justify-between bg-background">
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center">
              <Link href="/">
                <Image src="/logo.png" alt="RecruitKar" width={140} height={42} className="h-10 w-auto object-contain" />
              </Link>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your RecruitKar account</p>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Sign In
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">New to RecruitKar?</span>
              </div>
            </div>

            {/* Sign up link */}
            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link href="/sign-up">Create an account</Link>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 border-t border-border px-6 py-4">
          <span className="text-xs text-muted-foreground">recruitkar.com</span>
          <span className="text-xs text-muted-foreground/40">|</span>
          <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
