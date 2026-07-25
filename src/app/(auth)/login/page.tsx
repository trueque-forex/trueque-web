'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Invalid credentials');
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-brand rounded-[10px] flex items-center justify-center shadow-md">
          <span className="text-white font-extrabold text-sm leading-none">S</span>
        </div>
        <span className="text-primary font-bold text-xl tracking-tight">Symmetri</span>
      </Link>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-sm">
        <h1 className="text-2xl font-bold text-primary mb-2 text-center">Welcome back</h1>
        <p className="text-secondary text-sm text-center mb-8">
          Sign in to your account to send a voucher.
        </p>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-primary text-sm font-semibold mb-2">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-gray-200 rounded-xl px-4 py-3 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all placeholder:text-gray-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-primary text-sm font-semibold">Password</label>
              <Link href="/forgot-password" className="text-brand hover:text-blue-600 text-xs font-medium">
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-gray-200 rounded-xl px-4 py-3 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all placeholder:text-gray-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-sm mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-secondary text-sm text-center mt-8">
          Don't have an account?{' '}
          <Link href="/register" className="text-brand hover:text-blue-600 font-semibold">
            Create one free
          </Link>
        </p>
      </div>

    </div>
  );
}
