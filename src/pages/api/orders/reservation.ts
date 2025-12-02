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

  // Hack for demo: encode params in reservationId to survive round trip without DB
  // Format: resv_<timestamp>_<amount>_<rate>
  const parts = reservationId.split('_');
  const ts = Number(parts[1]) || Date.now();
  const amount = Number(parts[2]) || 20;
  const rate = Number(parts[3]) || 17.50;

  const createdAt = new Date(ts).toISOString();
  const expiresAt = new Date(ts + 5 * 60 * 1000).toISOString();
  const status: Reservation['status'] = Date.now() > ts + 5 * 60 * 1000 ? 'expired' : 'active';

  const fees = 2.50; // Fixed mock fee
  const recipientAmount = (amount * rate) - fees; // Simplified logic
  const effectiveRate = recipientAmount / amount;

  const mock: Reservation = {
    reservationId,
    userId: (req as any).session?.userId ?? 'unknown_user',
    corridor: 'USD-MXN', // Default for demo
    offerEUR: amount, // reusing field name
    amount: amount, // Adding proper field
    rate: rate,
    fees: fees,
    recipientAmount: parseFloat(recipientAmount.toFixed(2)),
    effectiveRate: parseFloat(effectiveRate.toFixed(4)),
    createdAt,
    expiresAt,
    status,
  } as any; // Cast to any to allow new fields

  return res.status(200).json(mock);
}

export default withAuth(handler);
