import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../../lib/apiFetch';

export default function KycAppeal() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/kyc/appeal/status', { method: 'GET' })
      .then(r => r.json())
      .then(b => setStatus(b?.status ?? null))
      .catch(() => setStatus(null));
  }, []);

  async function submitAppeal(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/kyc/appeal', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      await res.json();
      setMessage('');
      alert('Appeal sent. Support will contact you.');
      router.push('/kyc/status');
    } catch (err: any) {
      alert(err?.message || 'Failed to send appeal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Appeal KYC decision</h1>
      <p>Current appeal status: {status ?? 'none'}</p>

      <form onSubmit={submitAppeal}>
        <label>
          Explain the issue and attach evidence
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} />
        </label>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send appeal'}</button>
          <button type="button" onClick={() => router.push('/kyc/status')} style={{ marginLeft: 8 }}>Back</button>
        </div>
      </form>
    </main>
  );
}
