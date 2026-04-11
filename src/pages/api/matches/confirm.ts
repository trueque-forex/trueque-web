import type { NextApiRequest, NextApiResponse } from 'next';
import { transaction } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const session = (req as any).session as TruequeSession;
  const callerId = session.user.id; // from JWT — never from req.body

  const { match_id } = req.body;
  if (!match_id) return res.status(400).json({ error: 'Missing match_id' });

  try {
    const updatedMatch = await transaction(async (client) => {
      // Lock the match row
      const checkRes = await client.query(
        `SELECT * FROM matches WHERE id = $1 FOR UPDATE`,
        [match_id]
      );
      const match = checkRes.rows[0];
      if (!match) throw new Error('Match not found');

      // Validate caller is a counterparty
      const isMaker = match.maker_id === callerId;
      const isTaker = match.taker_id === callerId;
      if (!isMaker && !isTaker) throw new Error('Unauthorized: you are not a party to this swap.');

      // Update the correct confirmation column
      const updateSql = isMaker
        ? `UPDATE matches SET maker_confirmed = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *`
        : `UPDATE matches SET taker_confirmed = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *`;

      const updateRes = await client.query(updateSql, [match_id]);
      let current = updateRes.rows[0];

      // Both confirmed → mark COMPLETED
      if (current.maker_confirmed && current.taker_confirmed) {
        const finalRes = await client.query(
          `UPDATE matches SET status = 'COMPLETED', settled_at = NOW(), updated_at = NOW()
           WHERE id = $1 RETURNING *`,
          [match_id]
        );
        current = finalRes.rows[0];
        // Also update the trades row
        await client.query(
          `UPDATE trades SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW()
           WHERE match_id = $1`,
          [match_id]
        );
      }

      return current;
    });

    return res.status(200).json({ success: true, match: updatedMatch });
  } catch (err: any) {
    console.error('[matches/confirm] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

export default withAuth(handler);