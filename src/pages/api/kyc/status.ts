import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession, getSessionById } from '../../../lib/session';
import { issueSymmetriIdForUser as issueSymmetriIdServer } from '@/server/kyc/issueSymmetriId';
import knexClient from '@/lib/knexClient';
import crypto from 'crypto';
import cookie from 'cookie';

const db = knexClient;

async function resolveSession(req: NextApiRequest): Promise<any | null> {
  let session: any = await getSession(req);

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

    // STRICT: Prefer session.user.id
    const userId = session.user?.id || (session as any).userId || null;

    // STRICT: Prefer session.user.kycStatus
    const kycStatus = (
      session.user?.kycStatus ||
      (session as any).kycStatus ||
      (session as any).kyc_status ||
      (session.user as any)?.kyc_status ||
      'unknown'
    ).toUpperCase();

    console.log('🔐 Resolved session', { userId, kycStatus });

    let trade_mask_sid: string | null = null;
    let kyc_verified_at: string | null = null;

    if (userId && db) {
      try {
        const user = await db('users').where({ id: userId }).first();
        if (user) {
          trade_mask_sid = user.tid ?? null;
          kyc_verified_at = user.kyc_verified_at ?? null;
        }
      } catch (err) {
        console.error('❌ DB read error in /api/kyc/status:', err);
      }
    }

    // Issue SID if PENDING (provisional $200 swap needs Trade Room anonymity)
    // or APPROVED (full swap access). Acts as a safety net if submit endpoint
    // failed to issue. The SID is permanent once issued — never regenerated.
    if ((kycStatus === 'pending' || kycStatus === 'approved') && !trade_mask_sid && userId) {
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

        // The issuer's signature is issueSymmetriId(userId, countryCode)
        const issuance = await issueSymmetriIdServer(userId, countryHint || 'XX');
        // issuance is { trade_mask_sid: string }
        if (issuance?.trade_mask_sid) {
          trade_mask_sid = issuance.trade_mask_sid;
          // success path: issuer already persists changes inside its DB transaction
        }
        console.log('✅ Issuance result', { userId, trade_mask_sid: issuance?.trade_mask_sid ?? null });

      } catch (err) {
        console.error('❌ issueTradeMaskSidServer failed:', err);
        return res.status(200).json({
          kycStatus,
          userId,
          trade_mask_sid,
          kyc_verified_at,
          warning: 'trade_mask_sid_issue_failed',
        });
      }
    }



    return res.status(200).json({
      kycStatus,
      userId,
      trade_mask_sid,
      kyc_verified_at,
    });
  } catch (err) {
    console.error('❌ /api/kyc/status top-level error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}
