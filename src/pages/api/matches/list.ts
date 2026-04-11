import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const session = (req as any).session as TruequeSession;
  const ownerId = session.user.id; // from JWT — never from req.query

  try {
    // Return all matches where the caller is maker or taker, from caller's perspective
    const sql = `
      SELECT
        m.id,
        m.created_at,
        m.status,
        m.symmetri_swap_fee,
        m.maker_confirmed,
        m.taker_confirmed,
        CASE WHEN m.maker_id = $1 THEN m.maker_confirmed ELSE m.taker_confirmed END AS i_have_confirmed,
        CASE WHEN m.maker_id = $1 THEN m.taker_confirmed  ELSE m.maker_confirmed  END AS peer_has_confirmed,
        CASE WHEN m.maker_id = $1 THEN o.currency_offered ELSE o.currency_wanted  END AS sent_currency,
        CASE WHEN m.maker_id = $1 THEN m.final_amount_offered ELSE m.final_amount_wanted END AS sent_amount,
        CASE WHEN m.maker_id = $1 THEN o.currency_wanted  ELSE o.currency_offered END AS received_currency,
        CASE WHEN m.maker_id = $1 THEN m.final_amount_wanted  ELSE m.final_amount_offered END AS received_amount
      FROM matches m
      JOIN offers o ON m.offer_id = o.id
      WHERE m.maker_id = $1 OR m.taker_id = $1
      ORDER BY m.created_at DESC;
    `;
    const result = await query(sql, [ownerId]);
    return res.status(200).json({ success: true, swaps: result.rows });
  } catch (err: any) {
    console.error('[matches/list] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

export default withAuth(handler);