// src/pages/api/debug/session.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookieHeader = req.headers?.cookie ?? '';
  let parsedCookies = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cookie = require('cookie');
    parsedCookies = cookie.parse(cookieHeader || '');
  } catch {
    parsedCookies = {};
  }
  const session = await getSession(req).catch(e => ({ error: String(e?.message || e) }));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../../../lib/session') as any;
  const inMemoryKeys = (mod && mod.__test_getInMemoryKeys) ? mod.__test_getInMemoryKeys() : null;
  return res.status(200).json({ cookieHeader, parsedCookies, session, inMemoryKeys });
}
