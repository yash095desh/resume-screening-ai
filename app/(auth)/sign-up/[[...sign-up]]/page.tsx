'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, Eye, EyeOff, ArrowRight,
  Users, Zap, Shield, Globe,
} from 'lucide-react';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-destructive' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-400' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-yellow-400' };
  if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-green-400' };
  return { score: 5, label: 'Very strong', color: 'bg-green-500' };
}

export default function SignUpPage() {
  const router = useRouter();
  const { signup } = useAuthContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const result = await signup({
      name,
      email,
      password,
      companyName: companyName || undefined,
    });

    if (result.success) {
      router.push(`/verify-otp?email=${encodeURIComponent(result.email || email)}&type=email_verification`);
    } else {
      setError(result.error || 'Signup failed');
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative flex-col justify-between p-12 text-white overflow-hidden">
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
              Start hiring smarter<br />in minutes
            </h1>
            <p className="text-base leading-relaxed" style={{ color: 'hsl(var(--text-hero-muted))' }}>
              Join hundreds of recruiters who have streamlined their hiring with AI-powered tools.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Zap, text: 'Free plan includes 200 credits to get started' },
              { icon: Users, text: 'Screen, source & interview candidates with AI' },
              { icon: Globe, text: 'Upgrade to unlock email outreach sequences' },
              { icon: Shield, text: 'No credit card required to sign up' },
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
          Set up in under 2 minutes
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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your details to get started
              </p>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
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
                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= passwordStrength.score ? passwordStrength.color : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Company name{' '}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used in outreach email templates. Individual recruiters can leave this blank.
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Create Account
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link href="/sign-in">Sign in</Link>
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
