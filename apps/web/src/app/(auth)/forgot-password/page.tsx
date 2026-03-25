'use client';

import Link from 'next/link';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="bg-white dark:bg-white/[0.03] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset your password</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {submitted ? (
        <div className="text-center">
          <div className="bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-sm px-4 py-3 rounded-lg mb-6">
            If an account exists for {email}, a password reset link has been sent.
          </div>
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
