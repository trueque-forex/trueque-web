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
        // Added credentials: 'same-origin' to ensure auth cookies are sent
        const res = await fetch('/api/kyc/status', { credentials: 'same-origin' });
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
