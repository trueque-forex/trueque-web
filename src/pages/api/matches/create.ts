import type { NextApiRequest, NextApiResponse } from 'next';
import { transaction } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';

const SYMMETRI_SWAP_FEE_PCT = 0.015; // 1.5% per side — GEMINI.md §3.2

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = (req as any).session as TruequeSession;
  const takerId = session.user.id; // taker identity from JWT — never from req.body

  const { offer_id } = req.body;
  if (!offer_id) {
    return res.status(400).json({ error: 'Missing offer_id' });
  }

  try {
    const { match, trade } = await transaction(async (client) => {
      // 1. Lock the offer row — prevents race conditions
      const offerRes = await client.query(
        `SELECT * FROM offers WHERE id = $1 FOR UPDATE`,
        [offer_id]
      );
      const offer = offerRes.rows[0];

      if (!offer) throw new Error('Offer not found');
      if (offer.status !== 'OPEN') throw new Error(`Offer is no longer available (status: ${offer.status})`);
      if (offer.owner_id === takerId) throw new Error('You cannot accept your own offer.');

      const makerId = offer.owner_id;

      // 2. Calculate 1.5% Symmetri fee on the taker's principal (amount_wanted = what taker pays)
      const symmetriSwapFee = parseFloat(
        (parseFloat(offer.amount_wanted) * SYMMETRI_SWAP_FEE_PCT).toFixed(4)
      );

      // 3. Create match record — rates locked at handshake moment
      const matchRes = await client.query(
        `INSERT INTO matches (
          offer_id, maker_id, taker_id,
          final_rate, final_amount_offered, final_amount_wanted,
          symmetri_swap_fee, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING_SETTLEMENT')
        RETURNING *`,
        [
          offer.id,
          makerId,
          takerId,
          offer.exchange_rate,
          offer.amount_offered,
          offer.amount_wanted,
          symmetriSwapFee,
        ]
      );
      const newMatch = matchRes.rows[0];

      // 4. Close the offer so no one else can take it
      await client.query(`UPDATE offers SET status = 'MATCHED', updated_at = NOW() WHERE id = $1`, [offer_id]);

      // 5. Create the Trade record (the settled view used by Trade Room)
      const totalToPay = parseFloat(offer.amount_wanted) + symmetriSwapFee;
      const tradeRes = await client.query(
        `INSERT INTO trades (
          match_id, maker_id, taker_id,
          amount, sent_currency,
          received_amount, received_currency,
          final_rate, symmetri_swap_fee,
          total_fees, total_to_pay,
          payment_instructions, type, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'DIRECT', 'PENDING_SETTLEMENT')
        RETURNING *`,
        [
          newMatch.id,
          makerId,
          takerId,
          offer.amount_wanted,              // taker sends this
          offer.currency_wanted,             // taker's send currency
          offer.amount_offered,              // taker receives this
          offer.currency_offered,            // taker's receive currency
          offer.exchange_rate,
          symmetriSwapFee,
          symmetriSwapFee,                   // total_fees = symmetri fee (rail fee added by gateway later)
          totalToPay.toFixed(4),
          JSON.stringify({
            rail: 'RTP',
            concept_code: `TRQ-${newMatch.id.slice(0, 8).toUpperCase()}`,
            reference: `Symmetri swap ${newMatch.id}`,
          }),
        ]
      );

      return { match: newMatch, trade: tradeRes.rows[0] };
    });

    return res.status(201).json({ success: true, match, trade });
  } catch (err: any) {
    console.error('[matches/create] Error:', err);
    return res.status(400).json({ success: false, error: err.message || 'Failed to create match' });
  }
}

export default withAuth(handler);