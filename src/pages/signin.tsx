// src/pages/signin.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../lib/apiFetch';

export default function Signin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { json } = await apiFetch<{ kycStatus?: string }>(
        '/api/auth/signin',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
        { timeoutMs: 8000 }
      );

      const kycStatus = json?.kycStatus ?? null;

      if (!kycStatus || kycStatus !== 'approved') {
        await router.push('/kyc/status');
        return;
      }

      await router.push('/app');
    } catch (err: any) {
      setError(err?.message ?? 'Signin failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        </label>

        <label>
          Password
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        </label>

        {error && <div role="alert">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}