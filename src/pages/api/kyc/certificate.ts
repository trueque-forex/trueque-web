import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session?.userId) return res.status(401).json({ error: 'Authentication required' });

  const userId = session.userId;
  const row = await query('SELECT status FROM user_kyc_status WHERE user_id = $1 LIMIT 1', [userId]);
  const status = row.rows[0]?.status ?? 'none';
  if (status !== 'approved') return res.status(404).json({ error: 'No certificate available' });

  // generate certificate URL (for dev we return a simple JSON; in prod generate signed PDF)
  return res.status(200).json({ url: `/api/kyc/certificate/download?userId=${userId}` });
}
