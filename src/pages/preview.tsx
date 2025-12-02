// src/pages/preview.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../lib/apiFetch';

type ReservationView = {
  reservationId?: string;
  expiresAt?: string;
  corridor?: string;
  from?: string;
  to?: string;
  offerEUR?: number;
  requiredSenderAmount?: number;
  totalCost?: number;
  recipientAmount?: number;
  error?: string;
  [k: string]: any;
};

export default function PreviewPage(): React.JSX.Element {
  const router = useRouter();
  const {
    reservationId: reservationIdQuery,
    from: qFrom,
    to: qTo,
    amountSender: qAmountSender,
    delivery: qDelivery,
    marketRate: qMarketRate,
    truequeFee: qTruequeFee,
    transmitterFee: qTransmitterFee,
    totalCost: qTotalCost,
    recipientAmount: qRecipientAmount,
    costIncrease: qCostIncrease,
    userId: qUserId,
  } = router.query;

  const [reservation, setReservation] = useState<ReservationView | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [committing, setCommitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // If reservationId is present, fetch canonical reservation details from server
  useEffect(() => {
    let mounted = true;

    async function loadReservation(id: string) {
      setLoading(true);
      setError(null);
      try {
        const { json } = await apiFetch<ReservationView | null>(
          `/api/orders/reservation?reservationId=${encodeURIComponent(id)}`,
          { method: 'GET' },
          { timeoutMs: 8000 }
        );

        const body = (json ?? null) as ReservationView | null;

        if (!mounted) return;

        if (body && body.reservationId) {
          setReservation(body);
        } else {
          // fallback to minimal reservation view
          setReservation({ reservationId: id });
        }
      } catch (err: any) {
        if (!mounted) return;
        // fallback to minimal reservation view when server endpoint unavailable or auth fails
        setReservation({ reservationId: id });
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    if (reservationIdQuery) {
      const id = Array.isArray(reservationIdQuery) ? reservationIdQuery[0] : String(reservationIdQuery);
      loadReservation(id);
    } else {
      // No reservationId: use legacy query params if present
      const from = Array.isArray(qFrom) ? qFrom[0] : (qFrom as string | undefined);
      const to = Array.isArray(qTo) ? qTo[0] : (qTo as string | undefined);
      const requiredSenderAmount = qAmountSender ? Number(qAmountSender) : undefined;
      const totalCost = qTotalCost ? Number(qTotalCost) : undefined;
      setReservation({
        from,
        to,
        offerEUR: qRecipientAmount ? Number(qRecipientAmount as string) : undefined,
        requiredSenderAmount,
        totalCost,
        recipientAmount: qRecipientAmount ? Number(qRecipientAmount as string) : undefined,
      });
    }

    return () => {
      mounted = false;
    };
  }, [
    reservationIdQuery,
    qFrom,
    qTo,
    qAmountSender,
    qDelivery,
    qMarketRate,
    qTruequeFee,
    qTransmitterFee,
    qTotalCost,
    qRecipientAmount,
  ]);

  async function handleConfirm() {
    setError(null);
    setCommitting(true);

    try {
      // Prefer server-side reservationId commit
      if (reservation?.reservationId) {
        const { json } = await apiFetch<{ orderId?: string; error?: string }>(
          '/api/orders/commit',
          {
            method: 'POST',
            body: JSON.stringify({ reservationId: reservation.reservationId }),
            headers: { 'Content-Type': 'application/json' },
          },
          { timeoutMs: 10000 }
        );

        const orderId = json?.orderId;
        if (!orderId) throw new Error(json?.error || 'Failed to create order');
        await router.push(`/orders/${orderId}`);
        return;
      }

      // Legacy flow: POST minimal payload to create order directly (server should verify and persist)
      const payload = {
        corridor: reservation?.corridor,
        from: reservation?.from,
        to: reservation?.to,
        offerEUR: reservation?.offerEUR,
        requiredSenderAmount: reservation?.requiredSenderAmount,
        totalCost: reservation?.totalCost,
      };

      const { json } = await apiFetch<{ orderId?: string; error?: string }>(
        '/api/orders/commit',
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        },
        { timeoutMs: 10000 }
      );

      const orderId = json?.orderId;
      if (!orderId) throw new Error(json?.error || 'Failed to create order');
      await router.push(`/orders/${orderId}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to confirm order');
    } finally {
      setCommitting(false);
    }
  }

  const displayRate = (() => {
    const mr = (router.query.marketRate ?? qMarketRate) as string | undefined;
    const r = mr ? Number(mr) : undefined;
    if (!r || Number.isNaN(r) || r === 0) return null;
    return r;
  })();

  return (
    <main style={{ padding: 20 }}>
      <h1>Transaction preview</h1>

      {loading && <p>Loading reservation…</p>}

      {!loading && error && <div role="alert" style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !reservation && <p>No preview available.</p>}

      {!loading &&
        reservation && (
          <section>
            {reservation.reservationId && <p><strong>Reservation ID:</strong> {reservation.reservationId}</p>}
            {reservation.from && <p><strong>From:</strong> {reservation.from}</p>}
            {reservation.to && <p><strong>To:</strong> {reservation.to}</p>}
            {reservation.requiredSenderAmount != null && <p><strong>Amount to send:</strong> {reservation.requiredSenderAmount}</p>}
            {reservation.recipientAmount != null && <p><strong>Recipient amount:</strong> {reservation.recipientAmount}</p>}
            {displayRate != null && <p><strong>Market rate:</strong> {displayRate.toFixed(4)}</p>}
            {reservation.totalCost != null && <p><strong>Total cost:</strong> {reservation.totalCost}</p>}
            {reservation.expiresAt && <p><strong>Expires at:</strong> {new Date(reservation.expiresAt).toLocaleString()}</p>}

            <div style={{ marginTop: 12 }}>
              <button onClick={() => router.back()} style={{ marginRight: 8 }}>Back</button>
              <button onClick={handleConfirm} disabled={committing}>
                {committing ? 'Confirming…' : 'Confirm and create order'}
              </button>
            </div>
          </section>
        )}
    </main>
  );
}
