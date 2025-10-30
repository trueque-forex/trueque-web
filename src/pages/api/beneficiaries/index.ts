// src/pages/api/beneficiaries/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
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
<<<<<<< HEAD
  status:
    | 'pending_screening'
    | 'approved'
    | 'review_required'
    | 'blocked'
    | 'archived';
=======
  status: 'pending_screening' | 'approved' | 'review_required' | 'blocked' | 'archived';
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
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
=======
  return { userId: 'dev-user' };
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const actor = requireAuth(req);
  if (!actor) return res.status(401).json({ error: 'Unauthorized' });

<<<<<<< HEAD
  const pool = getPool();

=======
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
  if (req.method === 'POST') {
    const body = req.body;
    if (!body || !body.method || !body.identifiers) {
      return res.status(400).json({ error: 'method and identifiers required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const insertText = `
      INSERT INTO beneficiaries
        (id, user_id, name, country, method, identifiers, status, risk_tier, last_screened_at, notes, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `;
    const values = [
      id,
      actor.userId,
      body.name || null,
      body.country || null,
      body.method,
      JSON.stringify(body.identifiers),
      'pending_screening',
      'low',
      null,
      null,
      now,
    ];

    try {
<<<<<<< HEAD
      const { rows } = await pool.query(insertText, values);
=======
      const { rows } = await query(insertText, values);
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
      const created = rows[0] as Beneficiary;
      return res.status(201).json(created);
    } catch (e: any) {
      console.error('beneficiaries.POST error', e);
      return res.status(500).json({ error: 'internal_error' });
    }
  }

  if (req.method === 'GET') {
<<<<<<< HEAD
    const { status, method, country } = req.query;
    const clauses: string[] = ['user_id = $1'];
    const params: any[] = [actor.userId];
=======
    const actorUserId = actor.userId;
    const { status, method, country } = req.query;
    const clauses: string[] = ['user_id = $1'];
    const params: any[] = [actorUserId];
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    let idx = 2;
    if (status) {
      clauses.push(`status = $${idx++}`);
      params.push(String(status));
    }
    if (method) {
      clauses.push(`method = $${idx++}`);
      params.push(String(method));
    }
    if (country) {
      clauses.push(`country = $${idx++}`);
      params.push(String(country));
    }

    const selectText = `SELECT * FROM beneficiaries WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC`;
    try {
<<<<<<< HEAD
      const { rows } = await pool.query(selectText, params);
=======
      const { rows } = await query(selectText, params);
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
      return res.status(200).json(rows);
    } catch (e: any) {
      console.error('beneficiaries.GET error', e);
      return res.status(500).json({ error: 'internal_error' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).end();
}