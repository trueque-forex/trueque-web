// src/pages/offers.tsx
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import apiFetch from '../lib/apiFetch';

export default function OffersPage() {
  const router = useRouter();
  const { from, to, amountIntent, delivery, userId } = router.query;

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const marketRates: Record<string, number> = {
    'BR-ES': 0.18,
    'MX-ES': 0.052,
    'NG-ES': 0.0015,
    'GH-ES': 0.077,
  };

  const corridorKey = useMemo(() => (from && to ? `${from}-${to}` : null), [from, to]);
  const marketRate = corridorKey ? marketRates[corridorKey] : undefined;
  const intentAmount = parseFloat(Array.isArray(amountIntent) ? amountIntent[0] : (amountIntent as string || '0'));

  const truequeFee = 0.52;
  const transmitterFee = 0.25;
  const offersEUR = [10, 15, 20, 25, 30];

  if (!from || !to) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Offers</h1>
        <p>Missing corridor parameters. Please go back and select from/to.</p>
      </main>
    );
  }

  const handleSelect = async (offerEUR: number) => {
    if (!marketRate) return setError('Market rate unavailable for this corridor.');
    setError(null);
    setLoadingId(String(offerEUR));

    try {
      const requiredSenderAmount = offerEUR / marketRate;
      const totalCost = requiredSenderAmount + truequeFee + transmitterFee;

      // Reserve preview on server: returns reservationId and expiresAt
      const { json } = await apiFetch<{ reservationId: string; expiresAt: string }>(
        '/api/orders/preview',
        {
          method: 'POST',
          body: JSON.stringify({
            corridor: corridorKey,
            offerEUR,
            userId: userId ?? null,
            delivery,
            requiredSenderAmount,
            totalCost,
          }),
        },
        { timeoutMs: 8000 }
      );

      const reservationId = json?.reservationId;
      if (!reservationId) throw new Error('Failed to reserve offer');

      // Navigate to preview with reservationId (server source of truth)
      await router.push({
        pathname: '/preview',
        query: {
          reservationId,
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to reserve offer');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Choose an Offer</h1>
      <p><strong>Corridor:</strong> {from} → {to}</p>
      <p><strong>Intent to Send:</strong> {amountIntent || '-' } {from}</p>
      <p><strong>Delivery Method:</strong> {delivery ?? '-'}</p>

      {!marketRate && (
        <div style={{ color: 'crimson' }}>
          <p>Market rate not available for this corridor.</p>
        </div>
      )}

      {error && <div role="alert" style={{ color: 'crimson' }}>{error}</div>}

      <ul className="space-y-2">
        {offersEUR.map((offer) => {
          const disabled = !marketRate || loadingId !== null;
          return (
            <li key={offer}>
              <button
                onClick={() => handleSelect(offer)}
                disabled={disabled}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                {loadingId === String(offer) ? 'Reserving...' : `Accept Offer: ${offer} ${to}`}
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
