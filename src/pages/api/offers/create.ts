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
    amount,
    source_currency,
    amount_received,
    target_currency,
    exchange_rate,
    fee_details,
    is_recurring,
    cadence,
  } = req.body;

  if (!swap_type || !amount || !source_currency || !amount_received || !target_currency || !exchange_rate) {
    return res.status(400).json({ error: 'Missing required fields for Offer creation.' });
  }

  if (!['IMMEDIATE', 'LIMIT', 'SYNTHETIC'].includes(swap_type)) {
    return res.status(400).json({ error: 'swap_type must be IMMEDIATE, LIMIT, or SYNTHETIC.' });
  }

  // Calculate Symmetri swap fee for this offer side
  const symmetriSwapFee = parseFloat((parseFloat(amount) * SYMMETRI_SWAP_FEE_PCT).toFixed(4));

  // Determine next_execution_date if recurring
  let nextExecutionDate = null;
  if (is_recurring && cadence) {
    const now = new Date();
    if (cadence === 'WEEKLY') {
      now.setDate(now.getDate() + 7);
    } else if (cadence === 'BI-WEEKLY') {
      now.setDate(now.getDate() + 14);
    } else if (cadence === 'MONTHLY') {
      now.setMonth(now.getMonth() + 1);
    }
    nextExecutionDate = now.toISOString();
  }

  const sql = `
    INSERT INTO offers (
      owner_id, swap_type, amount_offered, currency_offered,
      amount_wanted, currency_wanted, exchange_rate,
      fee_total, fee_details, updated_at, status, is_recurring, cadence, next_execution_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'DRAFT', $10, $11, $12)
    RETURNING *;
  `;

  try {
    const result = await query(sql, [
      ownerId,
      swap_type,
      amount,
      source_currency,
      amount_received,
      target_currency,
      exchange_rate,
      symmetriSwapFee,
      fee_details || { symmetri_swap_fee: symmetriSwapFee },
      is_recurring ? true : false,
      is_recurring ? cadence : null,
      nextExecutionDate
    ]);
    return res.status(201).json({ success: true, offer: result.rows[0] });
  } catch (err: any) {
    console.error('[offers/create] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

export default withAuth(handler);