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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
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

    // HOTFIX: Ensure name is updated even if cached in global state
    if (user && user.email === 'joao.teste@trueque.dev') {
      user.full_name = 'Joao Teste';
    }

    if (!user) {
      // Try searching DB purely? (If not in dev list). Not requested yet, focus on Joao dev user augmentation.
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    // AUGMENT DEV USER WITH DB STATUS (CRITICAL FOR KYC APPROVAL)
    try {
      // Dynamic import to avoid top-level issues if any
      const dbModule = require('../../../lib/db');
      const getKnexFn = dbModule.getKnex || (dbModule.default && dbModule.default.getKnex);
      // Ensure we have the function before calling it
      if (typeof getKnexFn !== 'function') {
        console.error('getKnex import failed', dbModule);
        throw new Error('getKnex is not a function');
      }
      const knex = getKnexFn();
      const dbUser = await knex('users').where({ email: normalizedEmail }).first();
      if (dbUser) {
        user.kyc_status = dbUser.kyc_status || user.kyc_status; // Prefer DB, fallback to dev config
        // console.log('Merged DB Status:', user.kyc_status);
      }
    } catch (e) {
      console.warn('Failed to merge DB status', e);
    }

    // Debug: Log found user to inspect properties
    // eslint-disable-next-line no-console
    console.log('Signin found user:', JSON.stringify(user, null, 2));

    const hash = user.password_hash || user.passwordHash;
    if (!hash) {
      console.error('Signin: User found but no password hash available', user.email);
      return res.status(500).json({ error: 'internal_error: missing_auth_data' });
    }

    // Verify Password
    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const resolvedUser = user;
    // Ensure ID is present (Dev users might not have one generated, use email as fallback or uuid)
    // Actually devUsers normally have IDs. If not, we might need to patch it.
    if (!resolvedUser.id) resolvedUser.id = uuidv4();

    // Generate Transaction ID (TID) if not provided
    const tid = bodyTid || uuidv4();

    // MFA flow: Mandatory for ALL logins (G3 Requirement) unless it is a Test User
    // Create pending token that includes tid

    // FORCE MFA FOR ALL (User Request: "No one should see beneficiary screen until MFA")
    // Previously: Skipped for dev/test. Now: enforce.
    // if (resolvedUser.is_test || resolvedUser.isDev || process.env.NODE_ENV === 'test') { ... }

    const mfa_token = createMfaPendingToken({ id: resolvedUser.id, tid });

    // We do NOT return the session here anymore. Only mfa_required.
    return res.status(200).json({ mfa_required: true, mfa_token, tid });

    // Legacy Non-MFA fallback removed
    // return await respondWithSession(res, { ...resolvedUser, tid });

    // Non-MFA: respond with session (include tid for traceability)
    return await respondWithSession(res, { ...resolvedUser, tid });
  } catch (err: any) {
    console.error('signin error', err);

    return res.status(500).json({ error: 'internal_error' });
  }
}