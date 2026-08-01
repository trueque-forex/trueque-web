import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import { query } from '@/lib/db';
import { TruequeSession } from '@/types/auth';

/**
 * GET /api/kyc/certificate
 *
 * Returns a signed certificate URL for KYC-approved users.
 * Identity is extracted exclusively from the server-side session (JWT).
 * The userId is NEVER exposed in the response URL or body per GEMINI.md §2.2.
 * The download endpoint must also extract identity from session — not from query params.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = (req as any).session as TruequeSession;

  // Read identity from session ONLY — never from req.body or req.query (GEMINI.md §2.1)
  const ownerId = session.user.id;

  const row = await query(
    'SELECT status FROM users WHERE id = $1 LIMIT 1',
    [ownerId]
  );
  const kycStatus = (row.rows[0]?.kyc_status ?? 'none').toUpperCase();

  if (kycStatus !== 'APPROVED') {
    return res.status(404).json({ error: 'No certificate available' });
  }

  // Certificate URL is session-scoped — no userId in the URL.
  // The download endpoint MUST read the owner identity from its own session.
  return res.status(200).json({ url: `/api/kyc/certificate/download` });
}

export default withAuth(handler);
