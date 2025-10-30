// src/lib/serverAuth.ts
import type { NextApiRequest } from 'next';
import { getSession } from './session';

export type Session =
  | {
      userId: string;
      email?: string;
      kycStatus?: 'none' | 'pending' | 'approved' | 'rejected';
    }
  | null;

export async function parseSessionFromReq(req: NextApiRequest): Promise<Session> {
  try {
    const s = await getSession(req);
    return (s as Session) ?? null;
  } catch (err) {
    console.error('parseSessionFromReq error', err);
    return null;
  }
}
