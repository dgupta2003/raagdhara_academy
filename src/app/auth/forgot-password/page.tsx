'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        // Don't reveal whether the email exists
        setSent(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-headline text-xl font-semibold text-foreground mb-2">Check your inbox</h2>
        <p className="font-body text-sm text-muted-foreground mb-6">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. Check your inbox (and spam folder).
        </p>
        <Link href="/auth/login" className="font-body text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="font-headline text-2xl font-semibold text-foreground mb-1">Reset your password</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block font-body text-sm font-medium text-foreground mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative"
            placeholder="you@example.com"
          />
        </div>

        {error && (
          <p className="font-body text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md py-2.5 px-4 text-sm font-body font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-contemplative"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="font-body text-sm text-center text-muted-foreground mt-6">
        Remember your password?{' '}
        <Link href="/auth/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </>
  );
}
