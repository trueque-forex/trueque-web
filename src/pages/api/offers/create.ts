import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db'; // Uses your existing, working DB connection

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Method Guard: Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 2. Destructure Inputs
    const {
      user_id,
      swap_type,
      amount_offered,
      currency_offered,
      amount_wanted,
      currency_wanted,
      exchange_rate,
      fee_total,
      fee_details
    } = req.body;

    // 3. Basic Validation
    if (
      !user_id || 
      !swap_type || 
      !amount_offered || 
      !currency_offered || 
      !amount_wanted || 
      !currency_wanted ||
      !exchange_rate
    ) {
      return res.status(400).json({ error: 'Missing required fields for Offer creation.' });
    }

    // 4. SQL Insertion
    // We use standard SQL here instead of the Supabase client wrapper
    const sql = `
      INSERT INTO offers (
        user_id,
        swap_type,
        amount_offered,
        currency_offered,
        amount_wanted,
        currency_wanted,
        exchange_rate,
        fee_total,
        fee_details
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const values = [
      user_id,
      swap_type,
      amount_offered,
      currency_offered,
      amount_wanted,
      currency_wanted,
      exchange_rate,
      fee_total || 0,
      fee_details || {} // Postgres will handle the JSON stringifying automatically
    ];

    const result = await query(sql, values);
    const newOffer = result.rows[0];

    // 5. Success Response
    return res.status(201).json({
      success: true,
      offer: newOffer,
    });

  } catch (err: any) {
    console.error('Server Error:', err);
    // Return the actual error message to help with debugging
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}