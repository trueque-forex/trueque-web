import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';
import { query } from '../../../lib/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const session = (req as any).session as TruequeSession;
  const ownerId = session.user.id;

  const { amount, currencyFrom, currencyTo } = req.query;

  try {
    // Return OPEN offers that are NOT the caller's own, matching the requested corridor
    const sql = `
      SELECT
        o.id,
        o.swap_type,
        o.amount_offered,
        o.currency_offered,
        o.amount_wanted,
        o.currency_wanted,
        o.exchange_rate,
        o.fee_total,
        o.expires_at,
        o.created_at
      FROM offers o
      WHERE o.status = 'OPEN'
        AND o.owner_id != $1
        AND ($2::text IS NULL OR o.currency_offered = $2)
        AND ($3::text IS NULL OR o.currency_wanted = $3)
      ORDER BY o.exchange_rate DESC, o.created_at ASC
      LIMIT 50;
    `;
    const result = await query(sql, [
      ownerId,
      currencyFrom || null,
      currencyTo || null,
    ]);
    return res.status(200).json(result.rows);
  } catch (err: any) {
    console.error('[offers/index] Error:', err);
    res.setHeader('X-Offers-Source', 'db-error');
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

export default withAuth(handler);
