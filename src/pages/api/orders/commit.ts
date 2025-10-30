// src/pages/api/orders/commit.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/withAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = (req as any).session as { userId: string; kycStatus?: string };

  try {
    const { reservationId } = JSON.parse(req.body || '{}');
    if (!reservationId) return res.status(400).json({ error: 'missing_reservation' });

    // Basic KYC check: only approved users may commit orders. Adjust policy as needed.
    if (session.kycStatus !== 'approved') {
      return res.status(403).json({ error: 'kyc_required', kycStatus: session.kycStatus ?? null });
    }

    // TODO: lookup reservation by reservationId, ensure it's valid and not expired, and belongs to the user.
    // For this minimal stub we assume the reservation exists and is valid.
    // Implement proper reservation lookup, locking, idempotency and audit in production.

    const orderId = `order_${Date.now()}`;
    const createdAt = new Date().toISOString();

    // TODO: persist order with { orderId, reservationId, userId: session.userId, createdAt, status: 'created' }

    return res.status(201).json({ orderId, createdAt });
  } catch (err: any) {
    return res.status(500).json({ error: 'internal_error', message: err?.message || String(err) });
  }
}

export default withAuth(handler);
