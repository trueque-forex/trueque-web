<<<<<<< HEAD
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
=======
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

type KYCStatus = 'pending' | 'approved' | 'rejected' | 'unknown';

export default function KycStatusPage(): React.JSX.Element {
  const [status, setStatus] = useState<KYCStatus>('unknown');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/kyc/status');
        if (!res.ok) throw new Error('bad response');
        const json = await res.json();
        setStatus((json.status as KYCStatus) ?? 'unknown');
      } catch (e) {
        console.error('Failed to fetch KYC status', e);
        setStatus('unknown');
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  const handleContinue = () => {
    if (status === 'approved') router.push('/send');
    else router.push('/kyc');
  };

  if (loading) return <div style={{ padding: 24 }}>Loading KYC status…</div>;

  return (
    <main style={{ padding: 24 }}>
      <h1>KYC Verification Status</h1>

      {status === 'pending' && (
        <div>
          <p>Your verification is pending. A reviewer will check your documents shortly.</p>
          <button onClick={handleContinue}>Back to KYC</button>
        </div>
      )}

      {status === 'approved' && (
        <div>
          <p>Your identity has been verified. You can now send funds.</p>
          <button onClick={handleContinue}>Proceed to Send</button>
        </div>
      )}

      {status === 'rejected' && (
        <div>
          <p>Your verification was rejected. Please re-submit documents or contact support.</p>
          <button onClick={handleContinue}>Retry KYC</button>
        </div>
      )}

      {status === 'unknown' && (
        <div>
          <p>We could not determine your KYC status. Try again or contact support.</p>
          <button onClick={() => router.push('/start')}>Back to Start</button>
        </div>
      )}
    </main>
  );
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
