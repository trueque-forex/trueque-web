import type { NextApiRequest, NextApiResponse } from 'next';
import { confirmTotpSetup } from '@/lib/mfaServices';
import { getSessionById } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  // Read cookie header and pass it to getSessionById so we can resolve the session
  const cookieHeader = (req as any).headers?.cookie ?? null;
  const session = await getSessionById(cookieHeader, res);
  const userId = session?.userId ?? null;

  if (!userId) return res.status(401).json({ message: 'unauthenticated' });

  const { token, secret } = req.body || {};
  if (!token || !secret) return res.status(400).json({ message: 'token and secret required' });

  try {
    const r = await confirmTotpSetup(userId, String(token), String(secret));
    if (!r?.ok) return res.status(400).json({ ok: false });
    return res.status(200).json({ ok: true, recoveryCodes: r.recoveryCodes ?? [] });
  } catch (err: any) {
    console.error('totp verify error', err);
    return res.status(500).json({ message: 'error', detail: err?.message });
  }
}