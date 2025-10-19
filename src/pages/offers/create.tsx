// src/pages/offers/create.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../../lib/apiFetch';

export default function CreateOfferPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState(''); // future: maker sets this; for now default to blank and disabled
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // For now the server will use market rate if rate is blank
      const { json } = await apiFetch<{ offerId: string }>(
        '/api/offers/create',
        {
          method: 'POST',
          body: JSON.stringify({ amount: parseFloat(amount), rate: rate ? parseFloat(rate) : null }),
        },
        { timeoutMs: 8000 }
      );
      await router.push(`/offers/${json?.offerId ?? ''}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Create Offer (maker)</h1>
      <form onSubmit={handleCreate}>
        <label>
          Amount (EUR)
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" required />
        </label>
        <label>
          Rate (optional for now)
          <input value={rate} onChange={(e) => setRate(e.target.value)} type="number" step="0.0001" />
        </label>
        {error && <div role="alert" style={{ color: 'crimson' }}>{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Offer'}
        </button>
      </form>
    </main>
  );
}