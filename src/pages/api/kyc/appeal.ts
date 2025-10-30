import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { query } from '../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session?.userId) return res.status(401).json({ error: 'Authentication required' });

  const userId = session.userId;

  if (req.method === 'GET') {
    const r = await query('SELECT id, metadata, created_at FROM kyc_audit_logs WHERE user_id = $1 AND action = $2 ORDER BY created_at DESC LIMIT 1', [userId, 'appeal_submitted']);
    return res.status(200).json(r.rows[0] ?? null);
  }

  if (req.method === 'POST') {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const id = uuidv4();
    await query(`INSERT INTO kyc_audit_logs (id, user_id, action, metadata, created_at) VALUES ($1, $2, $3, $4, now())`, [id, userId, 'appeal_submitted', JSON.stringify({ message })]);

    // optionally notify support system here

    return res.status(200).json({ id });
  }

  return res.status(405).end();
}
