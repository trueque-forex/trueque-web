// src/pages/api/beneficiaries/[id]/retry.ts
import type { NextApiRequest, NextApiResponse } from 'next';
<<<<<<< HEAD
import { getPool } from '@/lib/server/db';
=======
import { query } from '@/lib/server/db';
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

function requireAuth(req: NextApiRequest) {
  // TODO: replace with real JWT/session verification
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.split(' ')[1];
  if (!token) return null;
  return { userId: 'dev-user' }; // placeholder mapping
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const actor = requireAuth(req);
  if (!actor) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'invalid_id' });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

<<<<<<< HEAD
  const pool = getPool();
  try {
    const { rows } = await pool.query('SELECT * FROM beneficiaries WHERE id = $1 AND user_id = $2', [id, actor.userId]);
=======
  try {
    // Use the safe query helper which throws if DB is unavailable
    const { rows } = await query('SELECT * FROM beneficiaries WHERE id = $1 AND user_id = $2', [id, actor.userId]);
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    const beneficiary = rows[0];
    if (!beneficiary) return res.status(404).json({ error: 'not_found' });

    if (!['pending_screening', 'review_required'].includes(beneficiary.status)) {
      return res.status(400).json({ error: 'invalid_status_for_retry', status: beneficiary.status });
    }

    // Optional: capture reason from body for audit
<<<<<<< HEAD
    const body = req.body || {};
    const reason = body.reason ? String(body.reason).slice(0, 1000) : '';

    // For a small project: call screening inline (same logic as screen.ts) by updating locally.
    // For production: enqueue job or call vendor; below we call the screen endpoint logic by reusing same DB update.
    // Simple synchronous approach: mark last_screened_at and append retry note, then set status to pending_screening to re-run screening.
    const now = new Date().toISOString();
    const note = `\n[retry requested ${now}] ${reason || 'user requested retry'}`;
    await pool.query(
=======
    const body = (typeof req.body === 'string' ? (() => {
      try { return JSON.parse(req.body); } catch { return req.body; }
    })() : req.body) || {};
    const reason = body.reason ? String(body.reason).slice(0, 1000) : '';

    // Mark for retry and append note
    const now = new Date().toISOString();
    const note = `\n[retry requested ${now}] ${reason || 'user requested retry'}`;
    await query(
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
      'UPDATE beneficiaries SET status = $1, notes = COALESCE(notes, \'\') || $2 WHERE id = $3 RETURNING *',
      ['pending_screening', note, id]
    );

<<<<<<< HEAD
    // Immediately run screening logic server-side by invoking same logic as screen.ts inline.
    // Keep the screening logic simple here for drop-in usage.
    const { rows: freshRows } = await pool.query('SELECT * FROM beneficiaries WHERE id = $1', [id]);
    const b = freshRows[0];
    // Basic deterministic rules (mirror runScreeningSimulation)
=======
    // Immediately run simplified screening simulation inline
    const { rows: freshRows } = await query('SELECT * FROM beneficiaries WHERE id = $1', [id]);
    const b = freshRows[0];

>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    const highRiskCountries = ['VE', 'SY', 'IR'];
    const idStr = JSON.stringify(b.identifiers || {});
    let decisionStatus = 'approved';
    let riskTier: 'low' | 'medium' | 'high' = 'low';
    let decisionNotes = 'auto-approved on retry (simulated)';

    if (idStr.includes('risk_hint":"high')) {
      decisionStatus = 'blocked';
      riskTier = 'high';
      decisionNotes = 'auto-block from identifier hint';
    } else if (b.country && highRiskCountries.includes(String(b.country).toUpperCase())) {
      decisionStatus = 'review_required';
      riskTier = 'high';
      decisionNotes = 'country flagged for review';
    }

    const finalNow = new Date().toISOString();
    const updateText = `
      UPDATE beneficiaries
      SET status = $1, risk_tier = $2, last_screened_at = $3, notes = COALESCE(notes,'') || $4
      WHERE id = $5
      RETURNING *
    `;
    const updateValues = [
      decisionStatus,
      riskTier,
      finalNow,
      `\n[screened ${finalNow}] ${decisionNotes}`,
      id,
    ];
<<<<<<< HEAD
    const result = await pool.query(updateText, updateValues);
    return res.status(200).json(result.rows[0]);
=======
    const updateResult = await query(updateText, updateValues);
    return res.status(200).json(updateResult.rows[0]);
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
  } catch (e: any) {
    console.error('beneficiaries.retry error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
}