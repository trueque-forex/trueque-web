// src/pages/account/profile.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

type ProfileResponse = { userId?: string; email?: string; name?: string;[k: string]: any };

export default function ProfilePage(): React.JSX.Element {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/account/profile', { credentials: 'same-origin' });
        // explicitly type the parsed JSON so TypeScript knows the shape
        const json = (await res.json()) as ProfileResponse;

        if (!res.ok) {
          const message = json?.error ?? `Request failed: ${res.status} ${res.statusText}`;
          throw new Error(message);
        }

        if (mounted) setProfile(json);
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) return <main style={{ padding: 16 }}>Loading profile…</main>;

  return (
    <main style={{ padding: 16 }}>
      <h1>Account profile</h1>

      {error && (
        <div role="alert" style={{ color: 'crimson', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {profile ? (
        <div>
          <p>
            <strong>User ID</strong>: {profile.userId ?? '—'}
          </p>
          <p>
            <strong>Name</strong>: {profile.name ?? '—'}
          </p>
          <p>
            <strong>Email</strong>: {profile.email ?? '—'}
          </p>
          <pre style={{ background: '#f7f7f7', padding: 12, marginTop: 12 }}>
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      ) : (
        <p>No profile data available.</p>
      )}
    </main>
  );
}