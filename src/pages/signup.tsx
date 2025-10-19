// src/pages/signup.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../lib/apiFetch';

export default function Signup() {
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
      const { json } = await apiFetch<{ needsKyc?: boolean; kycStatus?: string }>(
        '/api/auth/signup',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
        { timeoutMs: 8000 }
      );

      const needsKyc = json?.needsKyc ?? false;
      const kycStatus = json?.kycStatus ?? null;

      if (needsKyc || kycStatus !== 'approved') {
        await router.push('/kyc/status');
        return;
      }

      await router.push('/welcome');
    } catch (err: any) {
      setError(err?.message ?? 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Sign up</h1>
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
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </main>
  );
}