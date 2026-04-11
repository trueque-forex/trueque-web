import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';

/**
 * GET /api/trades/details?id={trade_id}
 *
 * Loads the full Trade Room state from the `trades` table.
 * Shapes data from the viewer's perspective (maker vs taker).
 * Viewer identity comes from the session — never from query params.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const session = (req as any).session as TruequeSession;
  const viewerId = session.user.id; // from JWT

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing trade id' });

  try {
    const sql = `
      SELECT
        t.id,
        t.match_id,
        t.maker_id,
        t.taker_id,
        t.amount,
        t.sent_currency,
        t.received_amount,
        t.received_currency,
        t.final_rate,
        t.symmetri_swap_fee,
        t.total_fees,
        t.total_to_pay,
        t.payout_method,
        t.beneficiary_name,
        t.payment_instructions,
        t.type,
        t.status,
        t.inbound_confirmed,
        t.created_at,
        m.maker_confirmed,
        m.taker_confirmed
      FROM trades t
      JOIN matches m ON t.match_id = m.id
      WHERE t.id = $1
      LIMIT 1;
    `;

    const result = await query(sql, [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const row = result.rows[0];
    const isMaker = row.maker_id === viewerId;
    const isTaker = row.taker_id === viewerId;

    // Enforce: only parties to the trade may view it
    if (!isMaker && !isTaker) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Shape from viewer's perspective
    const trade = {
      id: row.id,
      type: row.type,
      status: row.status,

      // Viewer's outbound leg
      amount: row.amount,
      sent_currency: row.sent_currency,
      symmetri_swap_fee: row.symmetri_swap_fee,
      total_fees: row.total_fees,
      total_to_pay: row.total_to_pay,

      // Counterparty delivery leg
      received_amount: row.received_amount,
      received_currency: row.received_currency,

      // Confirmation state from viewer's perspective
      inbound_confirmed: isMaker ? row.maker_confirmed : row.taker_confirmed,
      peer_confirmed: isMaker ? row.taker_confirmed : row.maker_confirmed,

      beneficiary_name: row.beneficiary_name || 'Counterparty',
      payout_method: row.payout_method || (row.received_currency + ' Rail'),
      payment_instructions: row.payment_instructions,
      exchange_rate: row.final_rate,
    };

    return res.status(200).json(trade);

  } catch (err: any) {
    console.error('[trades/details] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

export default withAuth(handler);
