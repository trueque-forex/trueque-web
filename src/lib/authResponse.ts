import { TruequeSession } from '../types/auth';
import { createSession, setSessionCookie } from './session';

import { NextApiRequest, NextApiResponse } from 'next'

export async function respondWithSession(req: NextApiRequest, res: NextApiResponse, user: any) {
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days (Internal expiry only)

  const payload: TruequeSession = {
    user: {
      id: String(user.id), // STRICT: No fallback
      email: user.email,
      kycStatus: (user.kyc_status || user.kycStatus || 'pending').toLowerCase(),
      userType: user.userType || 'PEER',
      tid: user.tid,
      firstName: user.first_name || user.firstName,
      lastName: user.last_name || user.lastName,
      name: user.name || [user.first_name || user.firstName, user.last_name || user.lastName].filter(Boolean).join(' '),
      txCount: user.tx_count || user.txCount || 0
    },
    expires // Kept for logic internal logic, but cookie is session-only
  };

  const sessionToken = await createSession(payload.user);
  setSessionCookie(res, sessionToken);
  console.log('[AUTH-RESPONSE] Session created for user:', user.email);

  // Create Stateless JWT for Hybrid Auth (Robustness)
  const jwt = require('jsonwebtoken'); // Lazy load
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });

  return res.status(200).json({
    ok: true,
    // Strict Response - No Backward Compatibility
    // Return session object for client-side storage (localStorage) matching strict type
    session: {
      user: {
        id: payload.user.id,
        email: payload.user.email,
        kycStatus: payload.user.kycStatus,
        userType: payload.user.userType,
        tid: payload.user.tid,
        firstName: user.first_name || user.firstName,
        lastName: user.last_name || user.lastName,
        phone: payload.user.phone,
        country: payload.user.country,
        street_address: payload.user.street_address,
        city: payload.user.city,
        state: payload.user.state,
        postalCode: payload.user.postalCode
      },
      expires: payload.expires,
      token
    }
  });
}
