import type { NextApiRequest, NextApiResponse } from 'next';
import { transaction } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';

/**
 * POST /api/trades/signal-funding
 * Body: { trade_id: string }
 *
 * Marks the calling user's leg as funded.
 * When BOTH legs are confirmed, transitions status to COMPLETED.
 * Caller identity comes from session — never from req.body.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = (req as any).session as TruequeSession;
  const callerId = session.user.id; // from JWT

  const { trade_id } = req.body;
  if (!trade_id) return res.status(400).json({ error: 'Missing trade_id' });

  try {
    const result = await transaction(async (client) => {
      // 1. Load trade + match with row lock
      const tradeRes = await client.query(
        `SELECT t.*, m.maker_confirmed, m.taker_confirmed
         FROM trades t
         JOIN matches m ON t.match_id = m.id
         WHERE t.id = $1 FOR UPDATE`,
        [trade_id]
      );

      if (!tradeRes.rows.length) throw new Error('Trade not found');
      const trade = tradeRes.rows[0];

      if (trade.status === 'COMPLETED') {
        return { status: 'COMPLETED', already_done: true };
      }

      // 2. Validate caller is a party to this trade
      const isMaker = trade.maker_id === callerId;
      const isTaker = trade.taker_id === callerId;
      if (!isMaker && !isTaker) throw new Error('Unauthorized: you are not a party to this swap.');

      // 3. Update the right confirmation flag on matches
      const confirmSql = isMaker
        ? `UPDATE matches SET maker_confirmed = true, updated_at = NOW() WHERE id = $1 RETURNING maker_confirmed, taker_confirmed`
        : `UPDATE matches SET taker_confirmed = true, updated_at = NOW() WHERE id = $1 RETURNING maker_confirmed, taker_confirmed`;

      const confirmRes = await client.query(confirmSql, [trade.match_id]);
      const { maker_confirmed, taker_confirmed } = confirmRes.rows[0];

      // 4. Update trades.inbound_confirmed
      await client.query(
        `UPDATE trades SET inbound_confirmed = true, updated_at = NOW() WHERE id = $1`,
        [trade_id]
      );

      // 5. Both funded → COMPLETED
      const bothFunded = maker_confirmed && taker_confirmed;
      let newStatus = 'FUNDING_SIGNALED';

      if (bothFunded) {
        newStatus = 'COMPLETED';
        await client.query(
          `UPDATE matches SET status = 'COMPLETED', settled_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [trade.match_id]
        );
        await client.query(
          `UPDATE trades SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [trade_id]
        );
      } else {
        await client.query(
          `UPDATE matches SET status = 'FUNDING_SIGNALED', updated_at = NOW() WHERE id = $1`,
          [trade.match_id]
        );
        await client.query(
          `UPDATE trades SET status = 'FUNDING_SIGNALED', updated_at = NOW() WHERE id = $1`,
          [trade_id]
        );
      }

      return { status: newStatus, inbound_confirmed: true };
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    console.error('[trades/signal-funding] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

export default withAuth(handler);
