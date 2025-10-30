// src/pages/api/orders/preview.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = (req as any).session as { userId: string; kycStatus?: string };

  try {
    // Basic KYC gating for buyers; adjust policy as needed.
    if (session.kycStatus !== 'approved') {
      return res.status(403).json({ error: 'kyc_required', kycStatus: session.kycStatus ?? null });
    }

    const payload = JSON.parse(req.body || '{}');
    const { corridor, offerEUR, requiredSenderAmount, totalCost } = payload;

    if (!corridor || offerEUR == null) {
      return res.status(400).json({ error: 'invalid_payload' });
    }

    // Create a short-lived reservation (TTL example: 5 minutes)
    const reservationId = `resv_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // TODO: persist reservation with audit fields for traceability:
    // { reservationId, userId: session.userId, corridor, offerEUR, requiredSenderAmount, totalCost, expiresAt }

    return res.status(200).json({ reservationId, expiresAt });
  } catch (err: any) {
    return res.status(500).json({ error: 'internal_error', message: err?.message || String(err) });
  }
}

export default withAuth(handler);
