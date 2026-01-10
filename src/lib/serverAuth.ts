// src/lib/serverAuth.ts
import type { NextApiRequest } from 'next';
import { getSession } from './session';
import { TruequeSession } from '../types/auth';

export async function parseSessionFromReq(req: NextApiRequest): Promise<TruequeSession | null> {
  try {
    return await getSession(req);
  } catch (err) {
    console.error('parseSessionFromReq error', err);
    return null;
  }
}
