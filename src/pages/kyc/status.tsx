// src/pages/kyc/status.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../../lib/apiFetch';

type KycStatusShape = {
  tier?: 'basic' | 'enhanced' | string | null;
  status?: 'none' | 'pending' | 'approved' | 'rejected' | string | null;
  lastUpdated?: string | null;
  nextAction?: string | null;
  details?: string | null;
};

export default function KycStatusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState<KycStatusShape | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    apiFetch('/api/kyc/status', { method: 'GET' }, { timeoutMs: 8000 })
      .then(({ json }) => {
        if (!mounted) return;
        setKyc(json || null);
      })
      .catch(err => {
        if (!mounted) return;
        setError(err?.message || 'Failed to load KYC status');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // ... rest of component unchanged (use PrimaryAction/SecondaryAction as before)
  return (
    <main style={{ padding: 20 }}>
      <h1>KYC status</h1>
      {loading && <p>Loading KYC status…</p>}
      {!loading && error && (
        <div role="alert" style={{ color: 'crimson' }}>
          <p><strong>Error:</strong> {error}</p>
          <p>Please sign in or try again later.</p>
        </div>
      )}
      {!loading && !error && !kyc && (
        <div>
          <p>No KYC information available.</p>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => router.push('/')}>Back home</button>
          </div>
        </div>
      )}
      {!loading && kyc && (
        <section aria-live="polite" style={{ marginTop: 12 }}>
          <p><strong>Tier:</strong> {kyc.tier ?? '—'}</p>
          <p><strong>Status:</strong> {kyc.status ?? '—'}</p>
          <p><strong>Last updated:</strong> {kyc.lastUpdated ?? '—'}</p>
          {kyc.nextAction && <p><strong>Next:</strong> {kyc.nextAction}</p>}
          {kyc.details && <p><strong>Notes:</strong> {kyc.details}</p>}
          <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
            {/* Re-use logic from your existing PrimaryAction/SecondaryAction */}
            <button onClick={() => router.push('/app')} className="primary">Continue to app</button>
            <button onClick={() => router.push('/kyc/guide')} className="secondary">What do I need?</button>
          </div>
        </section>
      )}
    </main>
  );
}