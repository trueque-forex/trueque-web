// src/pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { destroySession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // This clears the cookie and removes the session ID from Redis/Memory
        destroySession(res);

        console.log('[LOGOUT] Session destroyed successfully');
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[LOGOUT ERROR]', err);
        return res.status(500).json({ error: 'internal_error' });
    }
}