// src/pages/account/profile.tsx
import React, { useEffect, useState } from 'react';
import apiFetch from '../../lib/apiFetch';
import { useRouter } from 'next/router';

type Profile = {
  userId?: string;
  email?: string;
  name?: string;
  needsKYC?: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    apiFetch('/api/profile', { method: 'GET' })
      .then(res => res.json())
      .then(body => {
        if (!mounted) return;
        setProfile(body);
      })
      .catch(err => {
        if (!mounted) return;
        setError(err?.message || 'Failed to load profile');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Account profile</h1>

      {loading && <p>Loading profile…</p>}

      {!loading && error && (
        <div role="alert" style={{ color: 'crimson' }}>
          <p><strong>Error:</strong> {error}</p>
          <button onClick={() => router.push('/signin')}>Sign in</button>
        </div>
      )}

      {!loading && !error && profile && (
        <section>
          <p><strong>User:</strong> {profile.userId}</p>
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Needs KYC:</strong> {profile.needsKYC ? 'Yes' : 'No'}</p>
        </section>
      )}
    </main>
  );
}