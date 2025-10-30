import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session?.userId) return res.status(401).json({ error: 'Authentication required' });

  const userId = session.userId;
  const sub = await query('SELECT id, status, created_at FROM kyc_submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
  const submission = sub.rows[0] ?? null;
  if (!submission) return res.status(200).json(null);

  const filesRes = await query('SELECT id, file_type, url, status FROM kyc_files WHERE submission_id = $1 ORDER BY created_at', [submission.id]);
  return res.status(200).json({
    id: submission.id,
    status: submission.status,
    createdAt: submission.created_at,
    files: filesRes.rows,
  });
}
