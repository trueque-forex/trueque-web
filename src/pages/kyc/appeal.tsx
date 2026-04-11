// src/pages/kyc/appeal.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';

type ApiResponse = { ok?: boolean; error?: string;[k: string]: any };

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
    } finally {
      setLoading(false);
    }
  }

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
