import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Forbidden in production' });
  }

  const g: any = global;
  g.__DEV_USERS = g.__DEV_USERS || {};

  if (req.method === 'GET') {
    const users = Object.values(g.__DEV_USERS);
    return res.status(200).json({ users });
  }

  if (req.method === 'DELETE') {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!g.__DEV_USERS[normalizedEmail]) {
      return res.status(404).json({ error: 'User not found' });
    }

    delete g.__DEV_USERS[normalizedEmail];
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
