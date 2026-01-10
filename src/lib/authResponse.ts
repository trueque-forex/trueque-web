import { TruequeSession } from '../types/auth';
import { createSession } from './session';

import { NextApiResponse } from 'next'

export async function respondWithSession(res: NextApiResponse, user: any) {
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const payload: TruequeSession = {
    user: {
      id: user.userId || user.id,
      email: user.email,
      kycStatus: (user.kyc_status || user.kycStatus || 'none').toUpperCase(),
    },
    expires
  };

  await createSession(res, payload);
  console.log('[AUTH-RESPONSE] Session created for user:', user.email);

  // Create Stateless JWT for Hybrid Auth (Robustness)
  const jwt = require('jsonwebtoken'); // Lazy load
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });

  return res.status(200).json({
    ok: true,
    // Strict Response - No Backward Compatibility
    id: payload.user.id,
    email: payload.user.email,
    firstName: user.first_name || user.firstName || (user.full_name ? user.full_name.split(' ')[0] : 'User'),
    lastName: user.last_name || user.lastName || (user.full_name ? user.full_name.split(' ').slice(1).join(' ') : ''),
    tid: user.tid,
    kycStatus: payload.user.kycStatus,
    txCount: user.txCount || 0,
    needsKyc: false,
    token,
    // Return session object for client-side storage (localStorage) matching strict type
    session: { ...payload, token }
  });
}
