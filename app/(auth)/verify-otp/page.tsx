'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const RESEND_COOLDOWN = 60; // seconds

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const type = searchParams.get('type') || 'email_verification';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleDigitChange(index: number, value: string) {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (digit && index === 5) {
      const code = [...newDigits.slice(0, 5), digit].join('');
      if (code.length === 6) {
        handleSubmit(code);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    // Focus appropriate input
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if 6 digits pasted
    if (pasted.length === 6) {
      handleSubmit(pasted);
    }
  }

  const handleSubmit = useCallback(async (code?: string) => {
    const finalCode = code || digits.join('');
    if (finalCode.length !== 6) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: finalCode, type }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        // Clear digits on error
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setLoading(false);
        return;
      }

      if (type === 'email_verification' && data.token) {
        localStorage.setItem('auth-token', data.token);
        document.cookie = `auth-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        window.location.href = '/dashboard';
      } else {
        router.push(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(finalCode)}`);
      }
    } catch {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  }, [digits, email, type, router]);

  async function handleResend() {
    if (cooldown > 0) return;
    setResending(true);
    setResent(false);
    try {
      await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      });
      setResent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setError('Failed to resend code');
    }
    setResending(false);
  }

  const isComplete = digits.every((d) => d !== '');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/">
            <Image src="/logo.png" alt="RecruitKar" width={140} height={42} className="h-10 w-auto object-contain" />
          </Link>
        </div>

        {/* Icon + Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Check your email</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We sent a 6-digit verification code to<br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resent confirmation */}
        {resent && (
          <Alert>
            <AlertDescription>A new code has been sent to your email.</AlertDescription>
          </Alert>
        )}

        {/* 6-box OTP input */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg border-2 border-border bg-card text-center text-xl font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/20"
              disabled={loading}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {/* Verify button */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => handleSubmit()}
          disabled={loading || !isComplete}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify Email
        </Button>

        {/* Resend with cooldown */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the code?
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
          >
            {resending
              ? 'Resending...'
              : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : 'Resend code'}
          </Button>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyOtpForm />
    </Suspense>
  );
}
