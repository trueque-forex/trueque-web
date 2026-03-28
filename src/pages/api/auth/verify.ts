// src/pages/api/auth/verify.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, createSession, setSessionCookie } from '../../../lib/session';
import { verifyMfaToken } from '../../../lib/mfaToken'; // We will build this next

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. ONLY POST ALLOWED
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. GET CURRENT "HALF" SESSION
    // We need to know WHO is trying to verify.
    const token = req.cookies['session'];
    const session = await getSession(token || '');

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }

    // 3. VALIDATE INPUT
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    // 4. CHECK THE CODE (The "Vault" Check)
    // We check the code against the user's email.
    console.log('[VERIFY-DEBUG] Checking MFA for:', session.user.email, 'Code:', code);
    const isValid = await verifyMfaToken(session.user.email, code);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired code.' });
    }

    // 5. THE UPGRADE (Success!)
    // We create a NEW session with mfaVerified = true
    const newSessionToken = await createSession(session.user, true);

    // 6. SET THE NEW COOKIE
    setSessionCookie(res, newSessionToken);

    return res.status(200).json({ success: true, message: 'MFA Verified' });

  } catch (error) {
    console.error('MFA Verify Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}