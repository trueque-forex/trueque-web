// src/pages/api/orders/reservation.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/withAuth';

type Reservation = {
  reservationId: string;
  userId?: string;
  corridor?: string;
  offerEUR?: number;
  requiredSenderAmount?: number;
  totalCost?: number;
  recipientAmount?: number;
  expiresAt?: string;
  createdAt?: string;
  status?: 'active' | 'expired' | 'consumed';
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const reservationId = (req.query.reservationId as string) || (req.query.id as string);
  if (!reservationId) return res.status(400).json({ error: 'missing_reservationId' });

  // In-memory/demo behavior: recognize reservations created with the stub pattern resv_<ts>
  // and return a sensible mock; production should look up reservation in persistent store.
  if (!reservationId.startsWith('resv_')) {
    return res.status(404).json({ error: 'not_found' });
  }

  // Extract timestamp from reservationId if present to compute expiry
  const tsPart = reservationId.replace(/^resv_/, '');
  const ts = Number(tsPart) || Date.now();
  const createdAt = new Date(ts).toISOString();
  const expiresAt = new Date(ts + 5 * 60 * 1000).toISOString(); // 5 minutes TTL

  const now = Date.now();
  const status: Reservation['status'] = now > ts + 5 * 60 * 1000 ? 'expired' : 'active';

  // Return a minimal reservation shape; adjust fields to match your real reservation model.
  const mock: Reservation = {
    reservationId,
    userId: (req as any).session?.userId ?? 'unknown_user',
    corridor: 'BR-ES',
    offerEUR: 20,
    requiredSenderAmount: 20 / 0.18,
    recipientAmount: 20,
    totalCost: Number((20 / 0.18 + 0.52 + 0.25).toFixed(2)),
    createdAt,
    expiresAt,
    status,
  };

  return res.status(200).json(mock);
}

export default withAuth(handler);
