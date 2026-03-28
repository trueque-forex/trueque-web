import type { NextApiRequest, NextApiResponse } from 'next';
import { transaction } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { match_id, user_id } = req.body;

  if (!match_id || !user_id) {
    return res.status(400).json({ error: 'Missing match_id or user_id' });
  }

  try {
    const updatedMatch = await transaction(async (client) => {
      // 1. Get current state (and lock the row)
      const checkSql = `
        SELECT m.*, o.user_id as maker_id
        FROM matches m
        JOIN offers o ON m.offer_id = o.id
        WHERE m.id = $1 FOR UPDATE
      `;
      const checkRes = await client.query(checkSql, [match_id]);
      const match = checkRes.rows[0];

      if (!match) throw new Error('Match not found');

      // 2. Determine Role (Maker or Taker)
      const isMaker = match.maker_id === user_id;
      const isTaker = match.taker_id === user_id;

      if (!isMaker && !isTaker) throw new Error('Unauthorized: User not part of this swap');

      // 3. Update the specific confirmation column
      let updateSql = '';
      if (isMaker) {
        updateSql = `UPDATE matches SET maker_confirmed = TRUE WHERE id = $1 RETURNING *`;
      } else {
        updateSql = `UPDATE matches SET taker_confirmed = TRUE WHERE id = $1 RETURNING *`;
      }

      const updateRes = await client.query(updateSql, [match_id]);
      let currentMatch = updateRes.rows[0];

      // 4. CHECK: Have BOTH confirmed?
      if (currentMatch.maker_confirmed && currentMatch.taker_confirmed) {
        const finalizeSql = `
          UPDATE matches 
          SET status = 'COMPLETED', settled_at = NOW() 
          WHERE id = $1 
          RETURNING *
        `;
        const finalRes = await client.query(finalizeSql, [match_id]);
        currentMatch = finalRes.rows[0];
      }

      return currentMatch;
    });

    return res.status(200).json({ success: true, match: updatedMatch });

  } catch (err: any) {
    console.error('Confirm Error:', err);
    return res.status(500).json({ error: err.message });
  }
}