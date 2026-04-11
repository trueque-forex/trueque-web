import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import { query } from '@/lib/db';
import { TruequeSession } from '@/types/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = (req as any).session as TruequeSession;

  const userId = session.user.id;
  const row = await query('SELECT status FROM user_kyc_status WHERE user_id = $1 LIMIT 1', [userId]);
  const status = row.rows[0]?.status ?? 'none';
  if (status !== 'approved') return res.status(404).json({ error: 'No certificate available' });

  // generate certificate URL (for dev we return a simple JSON; in prod generate signed PDF)
  return res.status(200).json({ url: `/api/kyc/certificate/download?userId=${userId}` });
}

export default withAuth(handler);
