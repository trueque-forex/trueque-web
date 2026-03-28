import { NextApiRequest } from 'next';
import { getSession } from '@/lib/session';
import { TruequeSession } from '@/types/auth';

export async function parseSessionFromReq(req: NextApiRequest): Promise<TruequeSession | null> {
  try {
    return await getSession(req);
  } catch (err) {
    console.error('[SERVER-AUTH] parseSessionFromReq error', err);
    return null;
  }
}