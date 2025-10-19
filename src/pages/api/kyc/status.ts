import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session?.userId) return res.status(401).json({ error: 'Authentication required' });

  const userId = session.userId;
  // read user_kyc_status (fast lookup)
  const st = await query('SELECT tier, status, last_updated, notes FROM user_kyc_status WHERE user_id = $1 LIMIT 1', [userId]);
  const row = st.rows[0] ?? null;

  // optionally fetch latest submission summary
  const sub = await query('SELECT id, status, created_at FROM kyc_submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
  const submission = sub.rows[0] ?? null;

  return res.status(200).json({
    tier: row?.tier ?? null,
    status: row?.status ?? (submission ? submission.status : 'none'),
    lastUpdated: row?.last_updated ?? submission?.created_at ?? null,
    nextAction: row?.status === 'rejected' ? 'Please re-submit documents' : undefined,
    details: row?.notes ?? null,
    submissionId: submission?.id ?? null,
  });
}
