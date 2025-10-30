// pages/api/mfa/challenge/totp.ts
// DEV-ONLY: minimal TOTP challenge verification using in-memory pending tokens.
// Production: replace in-memory verification with proper OTP verification and persistent token storage.

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyMfaPendingToken } from '../../../../lib/mfaToken';
import { respondWithSession } from '../../../../lib/authResponse';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { mfa_token, token: otp } =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    if (!mfa_token || !otp) return res.status(400).json({ error: 'missing_fields' });

    // Verify pending token exists and is not expired (dev)
    const entry = verifyMfaPendingToken(String(mfa_token));
    if (!entry) return res.status(401).json({ error: 'invalid_mfa_token' });

    // DEV: We skip real OTP verification here. In a real flow you must verify the OTP against the user's TOTP secret.
    // To keep a minimal test flow: accept any 6-digit OTP format and proceed if pending token exists.
    if (!/^\d{4,8}$/.test(String(otp))) return res.status(400).json({ error: 'invalid_otp_format' });

    // Find the user in the dev users map by userId
    const g: any = global;
    let user = null;
    if (g.__DEV_USERS) {
      for (const k of Object.keys(g.__DEV_USERS)) {
        const u = g.__DEV_USERS[k];
        if (u && u.id === entry.userId) {
          user = u;
          break;
        }
      }
    }

    if (!user) return res.status(401).json({ error: 'invalid_user' });

    // Optionally log tid for traceability (dev only)
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('MFA DEV VERIFY:', { userId: user.id, tid: entry.tid, mfa_token });
    }

    // On success, respond with session (reuse respondWithSession)
    return await respondWithSession(res, { ...user, tid: entry.tid });
  } catch (err: any) {
    console.error('mfa challenge error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}