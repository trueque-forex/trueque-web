// src/pages/api/beneficiaries/[id]/screen.ts
import type { NextApiRequest, NextApiResponse } from 'next';
<<<<<<< HEAD
import { getPool } from '@/lib/server/db';
=======
import { query } from '@/lib/server/db';
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

type Beneficiary = {
  id: string;
  user_id: string;
  name?: string | null;
  country?: string | null;
  method: string;
  identifiers: Record<string, unknown>;
  status: string;
  risk_tier?: 'low' | 'medium' | 'high' | null;
  last_screened_at?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

function requireAuth(req: NextApiRequest) {
<<<<<<< HEAD
  // TODO: replace with real JWT/session verification
=======
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.split(' ')[1];
  if (!token) return null;
<<<<<<< HEAD
  return { userId: 'dev-user' }; // placeholder mapping
}

/**
 * Replace this simulated screening with your vendor integration or internal checks.
 * Keep this synchronous short-running for instant UX, or enqueue background jobs for heavy checks.
 */
=======
  return { userId: 'dev-user' };
}

>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
async function runScreeningSimulation(beneficiary: Beneficiary) {
  const highRiskCountries = ['VE', 'SY', 'IR'];
  const idStr = JSON.stringify(beneficiary.identifiers || {});
  if (idStr.includes('risk_hint":"high') || idStr.includes('risk_hint":"high"')) {
    return { status: 'blocked', risk_tier: 'high', notes: 'auto-block from identifier hint' };
  }
  if (beneficiary.country && highRiskCountries.includes(String(beneficiary.country).toUpperCase())) {
    return { status: 'review_required', risk_tier: 'high', notes: 'country flagged for review' };
  }
  return { status: 'approved', risk_tier: 'low', notes: 'auto-approved (simulated)' };
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
    const { rows } = await query('SELECT * FROM beneficiaries WHERE id = $1 AND user_id = $2', [id, actor.userId]);
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    const beneficiary = rows[0] as Beneficiary | undefined;
    if (!beneficiary) return res.status(404).json({ error: 'not_found' });

    const decision = await runScreeningSimulation(beneficiary);

    const now = new Date().toISOString();
    const updateText = `
      UPDATE beneficiaries
      SET status = $1, risk_tier = $2, last_screened_at = $3, notes = COALESCE(notes,'') || $4
      WHERE id = $5
      RETURNING *
    `;
    const updateValues = [
      decision.status,
      decision.risk_tier,
      now,
      `\n[screened ${now}] ${decision.notes || ''}`,
      id,
    ];

<<<<<<< HEAD
    const updated = await pool.query(updateText, updateValues);
=======
    const updated = await query(updateText, updateValues);
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    return res.status(200).json(updated.rows[0]);
  } catch (e: any) {
    console.error('beneficiaries.screen error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
}