import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import { query } from '@/lib/db';
import { TruequeSession } from '@/types/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = (req as any).session as TruequeSession;

  const userId = session.user.id;
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

export default withAuth(handler);
