<<<<<<< HEAD
// src/pages/api/auth/signin.ts
import type { NextApiRequest, NextApiResponse } from 'next';
=======
// pages/api/auth/signin.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { respondWithSession } from '../../../lib/authResponse';
import { createMfaPendingToken } from '../../../lib/mfaToken';
import { v4 as uuidv4 } from 'uuid';

// Defensive dev-users loader: ensures the API runtime has a usable in-memory user map.
// This avoids race conditions or incorrect require paths when running Next dev server.
function ensureDevUsers() {
  const g: any = global;
  if (!g.__DEV_USERS) {
    try {
      // Try to load the canonical dev users module
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const dev = require('../../../lib/devUsers')?.default || require('../../../lib/devUsers')?.DEV_USERS || require('../../../lib/devUsers');
      g.__DEV_USERS = g.__DEV_USERS || dev;
      // If module exported named DEV_USERS, normalize
      if (g.__DEV_USERS?.DEV_USERS) g.__DEV_USERS = g.__DEV_USERS.DEV_USERS;
    } catch (e) {
      // Nothing fatal here; leave global undefined so caller can fall back
      // eslint-disable-next-line no-console
      console.warn('ensureDevUsers: failed to require lib/devUsers', e);
    }
  }
  return (global as any).__DEV_USERS;
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
<<<<<<< HEAD
    const { email, password } = JSON.parse(req.body || '{}');
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    // TODO: validate, set cookie/session
    // Simulate approved KYC for demo purposes
    return res.status(200).json({ kycStatus: 'approved' });
  } catch (e: any) {
=======
    // Debug: environment and dev-users presence
    // eslint-disable-next-line no-console
    console.log('NODE_ENV', process.env.NODE_ENV);
    const g: any = global;
    const devUsers = ensureDevUsers();
    // eslint-disable-next-line no-console
    console.log('GLOBAL_HAS_DEV_USERS', !!devUsers);
    if (devUsers) {
      // eslint-disable-next-line no-console
      console.log('DEV_USERS_KEYS', Object.keys(devUsers));
    }

    const { email, password, tid: bodyTid } =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    const normalizedEmail = String(email).trim().toLowerCase();

    // Use global dev users if present; otherwise fail gracefully
    const user = (g.__DEV_USERS && g.__DEV_USERS[normalizedEmail]) || undefined;

    // For quick isolation during debugging: if dev users are not present, use an inline fallback
    if (!user) {
      // eslint-disable-next-line no-console
      console.warn('DEV user not found in global; using inline fallback for test@example.com');
      const inlineHash = '$2b$12$68aSmSSlTmAxk9WLh1pPYelQ1gflAmOCxD6eIPK5Z85JMpQQmbHTK';
      if (normalizedEmail === 'test@example.com') {
        // construct a minimal inline user
        (g as any).__DEV_USERS = (g as any).__DEV_USERS || {
          'test@example.com': {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'test@example.com',
            full_name: 'Test User',
            passwordHash: inlineHash,
            mfa_enabled: true,
            tid: '00000000-0000-0000-0000-000000000100',
            created_at: new Date().toISOString()
          }
        };
      }
    }

    const resolvedUser = (g.__DEV_USERS && g.__DEV_USERS[normalizedEmail]) as any;
    // Log the found user and the passwordHash presence
    // eslint-disable-next-line no-console
    console.log('FOUND USER', !!resolvedUser, resolvedUser?.email);
    // eslint-disable-next-line no-console
    console.log('RAW HASH', resolvedUser?.passwordHash);

    if (!resolvedUser) return res.status(401).json({ error: 'invalid_credentials' });

    const match = await bcrypt.compare(String(password), resolvedUser.passwordHash);
    // eslint-disable-next-line no-console
    console.log('PASSWORD MATCH RESULT:', match);

    if (!match) return res.status(401).json({ error: 'invalid_credentials' });

    // Resolve TID: prefer header, then body, then user record, then generate
    const headerTid = (req.headers['x-trueque-tid'] || req.headers['x-trueque_tid'] || '') as string;
    const tidFromUser = (resolvedUser.tid as string) || '';
    const tid = String(headerTid || bodyTid || tidFromUser || uuidv4());

    // DEV logging (remove or guard before production)
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`SIGNIN DEV TRACE: user=${normalizedEmail} tid=${tid}`);
    }

    // MFA flow: create pending token (dev) that includes tid
    if (resolvedUser.mfa_enabled) {
      const mfa_token = createMfaPendingToken({ userId: resolvedUser.id, tid });
      return res.status(200).json({ mfa_required: true, mfa_token, tid });
    }

    // Non-MFA: respond with session (include tid for traceability)
    return await respondWithSession(res, { ...resolvedUser, tid });
  } catch (err: any) {
    console.error('signin error', err);
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    return res.status(500).json({ error: 'internal_error' });
  }
}