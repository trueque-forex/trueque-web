/**
 * GET /api/vouchers/monthly-usage
 *
 * Returns the total USD sent via vouchers by the authenticated user
 * in the rolling 30-day window, and whether they are within limits.
 *
 * Limits (non-KYC / standard accounts):
 *   Per-transaction : $250 USD
 *   Monthly cap     : $500 USD
 *
 * Response: { used: number, limit: number, remaining: number, withinLimit: boolean }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { query } from '../../../lib/db';

export const MONTHLY_LIMIT_USD = 750;
export const PER_TX_LIMIT_USD  = 250;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const session = await getSession(req, res);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    // KYC-approved users get higher limits — for now, same logic; extend later
    const kycStatus = (session?.user?.kyc_status || session?.user?.kycStatus || 'PENDING').toUpperCase();

    const result = await query(
      `SELECT COALESCE(SUM(amount_usd), 0) AS total_used
         FROM vouchers
        WHERE owner_id = $1
          AND created_at >= NOW() - INTERVAL '30 days'
          AND status NOT IN ('CANCELLED', 'FAILED')`,
      [userId]
    );

    const used = parseFloat(result.rows[0]?.total_used ?? '0');

    // KYC-approved users: raise monthly cap significantly
    const monthlyLimit = kycStatus === 'APPROVED' ? 5000 : MONTHLY_LIMIT_USD;

    return res.status(200).json({
      used: parseFloat(used.toFixed(2)),
      limit: monthlyLimit,
      remaining: parseFloat(Math.max(0, monthlyLimit - used).toFixed(2)),
      withinLimit: used < monthlyLimit,
      perTxLimit: PER_TX_LIMIT_USD,
    });
  } catch (err: any) {
    console.error('[vouchers/monthly-usage] Error:', err);
    return res.status(500).json({ error: 'Could not retrieve usage data' });
  }
}
