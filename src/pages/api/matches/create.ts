import type { NextApiRequest, NextApiResponse } from 'next';
import { transaction } from '../../../lib/db'; // We use the transaction helper from your DB library

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { offer_id, taker_id } = req.body;

  if (!offer_id || !taker_id) {
    return res.status(400).json({ error: 'Missing offer_id or taker_id' });
  }

  try {
    // We wrap everything in a transaction to prevent "Race Conditions"
    // (e.g., two users trying to accept the same offer at the same millisecond)
    const matchResult = await transaction(async (client) => {
      
      // 1. Lock the Offer
      // "FOR UPDATE" tells Postgres: "Don't let anyone else touch this row until I'm done."
      const offerQuery = await client.query(
        `SELECT * FROM offers WHERE id = $1 FOR UPDATE`,
        [offer_id]
      );
      const offer = offerQuery.rows[0];

      if (!offer) {
        throw new Error('Offer not found');
      }

      // 2. Validation Checks
      if (offer.status !== 'OPEN') {
        throw new Error(`Offer is no longer available (Status: ${offer.status})`);
      }

      if (offer.user_id === taker_id) {
        throw new Error('You cannot accept your own offer.');
      }

      // 3. Create the Match Record
      // We copy the rates from the offer to "lock them in" at the moment of the handshake
      const insertMatchSql = `
        INSERT INTO matches (
          offer_id,
          taker_id,
          final_rate,
          final_amount_offered,
          final_amount_wanted,
          status
        )
        VALUES ($1, $2, $3, $4, $5, 'PENDING_SETTLEMENT')
        RETURNING *;
      `;
      
      const matchRes = await client.query(insertMatchSql, [
        offer.id,
        taker_id,
        offer.exchange_rate,
        offer.amount_offered,
        offer.amount_wanted
      ]);
      const newMatch = matchRes.rows[0];

      // 4. Close the Offer
      await client.query(
        `UPDATE offers SET status = 'MATCHED' WHERE id = $1`,
        [offer_id]
      );

      return newMatch;
    });

    // 5. Success
    return res.status(201).json({
      success: true,
      match: matchResult
    });

  } catch (err: any) {
    console.error('Match Error:', err);
    return res.status(400).json({ 
      success: false, 
      error: err.message || 'Failed to create match' 
    });
  }
}