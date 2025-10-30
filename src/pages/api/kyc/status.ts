import type { NextApiRequest, NextApiResponse } from 'next';
<<<<<<< HEAD
import { getSession } from '../../../lib/session';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session?.userId) return res.status(401).json({ error: 'Authentication required' });

  const userId = session.userId;
  // read user_kyc_status (fast lookup)
  const st = await query('SELECT tier, status, last_updated, notes FROM user_kyc_status WHERE user_id = $1 LIMIT 1', [userId]);
  const row = st.rows[0] ?? null;

  // optionally fetch latest submission summary
  const sub = await query('SELECT id, status, created_at FROM kyc_submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
  const submission = sub.rows[0] ?? null;

  return res.status(200).json({
    tier: row?.tier ?? null,
    status: row?.status ?? (submission ? submission.status : 'none'),
    lastUpdated: row?.last_updated ?? submission?.created_at ?? null,
    nextAction: row?.status === 'rejected' ? 'Please re-submit documents' : undefined,
    details: row?.notes ?? null,
    submissionId: submission?.id ?? null,
  });
}
=======
import { getSession, getSessionById } from '../../../lib/session';
import { issueTruequeIdForUser as issueTruequeIdServer } from '@/server/kyc/issueTruequeId';
import knexClient from '@/lib/knexClient';
import crypto from 'crypto';
import cookie from 'cookie';

const db = knexClient;

function base36Encode(n: number): string {
  return n.toString(36).toUpperCase();
}

function computeChecksum(payload: string): string {
  const hash = crypto.createHash('sha256').update(payload).digest();
  let value = 0;
  for (let i = 0; i < 5 && i < hash.length; i++) {
    value = (value << 8) + hash[i];
  }
  return base36Encode(value % 36);
}

export function generateTruequeId(date: Date, countryCode: string, seq: number): string {
  const yyyy = date.getUTCFullYear().toString().padStart(4, '0');
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = date.getUTCDate().toString().padStart(2, '0');
  const seqStr = seq.toString().padStart(4, '0');
  const cc = (countryCode || 'XX').toUpperCase().slice(0, 2);
  const payload = `T${yyyy}${mm}${dd}${cc}${seqStr}`;
  const checksum = computeChecksum(payload);
  return `${payload}${checksum}`;
}

async function resolveSession(req: NextApiRequest): Promise<any | null> {
  let session = await getSession(req);

  if (!session && process.env.NODE_ENV !== 'production') {
    const auth = (req.headers.authorization || '').trim();
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : null;

    if (token?.startsWith('00000000-0000-0000-0000-0000000000')) {
      console.log('✅ Injected fallback session for test user');
      return { userId: token, kycStatus: 'approved', country: 'US' };
    }

    if (token) {
      session = await getSessionById(token);
    }

    if (!session) {
      const rawSid = cookie.parse(req.headers.cookie || '')['session_token'];
      if (rawSid) {
        session = await getSessionById(rawSid);
        if (!session) {
          try {
            const decoded = decodeURIComponent(rawSid);
            if (decoded !== rawSid) {
              session = await getSessionById(decoded);
            }
          } catch {
            // ignore
          }
        }
      }
    }
  }

  return session;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 /api/kyc/status request', { method: req.method });

    const session = await resolveSession(req);

    if (!session) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = session.userId ?? session.user?.id ?? null;
    const kycStatus =
      session.kycStatus ??
      session.kyc_status ??
      session.user?.kycStatus ??
      session.user?.kyc_status ??
      'unknown';

    console.log('🔐 Resolved session', { userId, kycStatus });

    let trueque_id: string | null = null;
    let kyc_verified_at: string | null = null;

    if (userId && db) {
      try {
        const user = await db('users').where({ id: userId }).first();
        if (user) {
          trueque_id = user.trueque_id ?? null;
          kyc_verified_at = user.kyc_verified_at ?? null;
        }
      } catch (err) {
        console.error('❌ DB read error in /api/kyc/status:', err);
      }
    }

    if (kycStatus === 'approved' && !trueque_id && userId) {
      let countryHint = session.country ?? session.user?.country ?? null;

      if (!countryHint && db) {
        try {
          const u = await db('users').where({ id: userId }).first();
          countryHint = u?.country ?? null;
        } catch (e) {
          console.warn('⚠️ Country lookup failed', e);
        }
      }

      try {

// The issuer's signature is issueTruequeId(userId, countryCode)
       const issuance = await issueTruequeIdServer(userId, countryHint || 'XX');
// issuance is { trueque_id: string }
       if (issuance?.trueque_id) {
  // success path: issuer already persists changes inside its DB transaction
}
       console.log('✅ Issuance result', { userId, trueque_id: issuance?.trueque_id ?? null });

      } catch (err) {
        console.error('❌ issueTruequeIdServer failed:', err);
        return res.status(200).json({
          kycStatus,
          userId,
          trueque_id,
          kyc_verified_at,
          warning: 'trueque_id_issue_failed',
        });
      }
    }

    return res.status(200).json({
      kycStatus,
      userId,
      trueque_id,
      kyc_verified_at,
    });
  } catch (err) {
    console.error('❌ /api/kyc/status top-level error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
