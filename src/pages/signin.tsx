<<<<<<< HEAD
// src/pages/signin.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../lib/apiFetch';

export default function Signin() {
=======
import React, { useState } from 'react';
import { useRouter } from 'next/router';

type SigninResponse = {
  userId?: string;
  kycStatus?: string | null;
  error?: string;
  [k: string]: any;
};

export default function Signin(): React.JSX.Element {
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
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
<<<<<<< HEAD
      const { json } = await apiFetch<{ kycStatus?: string }>(
        '/api/auth/signin',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
        { timeoutMs: 8000 }
      );
=======
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      let json: SigninResponse = {};
      try {
        json = (await res.json()) as SigninResponse;
      } catch {
        json = {};
      }

      if (!res.ok) {
        setError(json?.error ?? `Sign in failed (${res.status})`);
        return;
      }
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

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
<<<<<<< HEAD
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
=======
        <label style={{ display: 'block', marginBottom: 8 }}>
          Email
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            required
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Password
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            required
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>

        {error && (
          <div role="alert" style={{ color: 'crimson', marginBottom: 8 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}