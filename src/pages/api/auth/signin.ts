// src/pages/api/auth/signin.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getKnex } from '../../../lib/db';
import { createSession, setSessionCookie } from '../../../lib/session';
import { generateMfaToken } from '../../../lib/mfaToken';
import { mapUserToUI } from '../../../lib/mappers';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. ONLY POST ALLOWED
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 2. VERIFY CREDENTIALS (CUSTOM TABLE)
    const db = getKnex();
    // Query local users table
    const user = await db('users')
      .select('*') // Wildcard to avoid "column does not exist" errors on specific fields
      .where({ email }) // Case sensitive match typically
      .first();

    if (!user) {
      // Security: Don't reveal user existence
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // 3. COMPARE HASH
    const isValid = await bcrypt.compare(password, user.password_hash || '');
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // 4. MAP USER TO UI
    const mappedUser = mapUserToUI(user);
    if (!mappedUser) {
      return res.status(500).json({ error: 'Failed to map user profile' });
    }

    // 5. CHECK MFA REQUIREMENT
    // If mfa_enabled is false (test accounts, or users who haven't enrolled MFA),
    // skip MFA entirely and create a fully-verified session.
    if (!user.mfa_enabled) {
      const sessionToken = await createSession(mappedUser, true); // mfaVerified = true
      setSessionCookie(res, sessionToken);
      return res.status(200).json({
        success: true,
        message: 'Signed in successfully.',
        requireMfa: false,
        mfa_required: false,
      });
    }

    // 6. MFA REQUIRED — create half-session and send code
    const sessionToken = await createSession(mappedUser, false);
    setSessionCookie(res, sessionToken);
    await generateMfaToken(mappedUser.email);

    return res.status(200).json({
      success: true,
      message: 'Credentials valid. Please verify MFA.',
      requireMfa: true,
      mfa_required: true,
    });

  } catch (error: any) {
    console.error('Signin Internal Error:', error);
    // Explicitly return error message in dev mode for debugging
    return res.status(500).json({ error: 'Internal Server Error', detail: error?.message || String(error) });
  }
}