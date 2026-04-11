import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';

const SYMMETRI_SWAP_FEE_PCT = 0.015; // 1.5% — GEMINI.md §3.2

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = (req as any).session as TruequeSession;
  const ownerId = session.user.id; // UUID from JWT — never from req.body

  const {
    swap_type,
    amount_offered,
    currency_offered,
    amount_wanted,
    currency_wanted,
    exchange_rate,
    fee_details,
  } = req.body;

  if (!swap_type || !amount_offered || !currency_offered || !amount_wanted || !currency_wanted || !exchange_rate) {
    return res.status(400).json({ error: 'Missing required fields for Offer creation.' });
  }

  if (!['IMMEDIATE', 'LIMIT'].includes(swap_type)) {
    return res.status(400).json({ error: 'swap_type must be IMMEDIATE or LIMIT.' });
  }

  // Calculate Symmetri swap fee for this offer side
  const symmetriSwapFee = parseFloat((parseFloat(amount_offered) * SYMMETRI_SWAP_FEE_PCT).toFixed(4));

  const sql = `
    INSERT INTO offers (
      owner_id, swap_type, amount_offered, currency_offered,
      amount_wanted, currency_wanted, exchange_rate,
      fee_total, fee_details, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    RETURNING *;
  `;

  try {
    const result = await query(sql, [
      ownerId,
      swap_type,
      amount_offered,
      currency_offered,
      amount_wanted,
      currency_wanted,
      exchange_rate,
      symmetriSwapFee,
      fee_details || { symmetri_swap_fee: symmetriSwapFee },
    ]);
    return res.status(201).json({ success: true, offer: result.rows[0] });
  } catch (err: any) {
    console.error('[offers/create] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

export default withAuth(handler);