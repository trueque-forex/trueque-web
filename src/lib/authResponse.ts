import { createSession } from './session';

import { NextApiResponse } from 'next'
export async function respondWithSession(res: NextApiResponse, user: any) {
  const payload = { userId: user.userId, email: user.email };
  await createSession(res, payload);
  return res.status(200).json({
    ok: true,
    userId: user.userId,
    email: user.email,
    kycStatus: 'approved',
    needsKyc: false,
  });
}
