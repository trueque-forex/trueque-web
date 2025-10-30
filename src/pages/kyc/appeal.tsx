<<<<<<< HEAD
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
=======
import React, { useState } from 'react';
import { useRouter } from 'next/router';

type ApiResponse = { ok?: boolean; error?: string; [k: string]: any };

export default function KycAppealPage(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitAppeal(data: { reason: string }) {
    setLoading(true);
    setMessage(null);

    try {
      const r = await fetch('/api/kyc/appeal', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const parsed = (await r.json()) as ApiResponse;

      if (!r.ok) {
        throw new Error(parsed?.error ?? `Request failed: ${r.status} ${r.statusText}`);
      }

      if (parsed?.ok) {
        setMessage('Appeal submitted successfully');
      } else {
        setMessage(parsed?.error ?? 'Unexpected response from server');
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'Failed to submit appeal');
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    } finally {
      setLoading(false);
    }
  }

<<<<<<< HEAD
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
=======
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const reason = String(formData.get('reason') ?? '');

    await submitAppeal({ reason });
  }

  return (
    <main style={{ padding: 16 }}>
      <h1>KYC Appeal</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="reason">Reason</label>
          <br />
          <textarea id="reason" name="reason" rows={4} style={{ width: '100%' }} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => router.back()} disabled={loading}>
            Back
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Appeal'}
          </button>
        </div>
      </form>

      {message && (
        <div style={{ marginTop: 16 }}>
          <strong>{message}</strong>
        </div>
      )}
    </main>
  );
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
