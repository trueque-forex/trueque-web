// src/lib/withKyc.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from './withAuth';

export function withKyc(handler: NextApiHandler): NextApiHandler {
  return withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
    const session = (req as any).session as { kycStatus?: string };
    if (!session || session.kycStatus !== 'approved') {
      return res.status(403).json({ error: 'kyc_required', kycStatus: session?.kycStatus ?? null });
    }
    return handler(req, res);
  });
}
