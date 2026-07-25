// src/pages/api/history.ts
//
// ✅ DATA-ORCHESTRATION MANDATE (GEMINI.md §5)
// This handler is a PURE PROXY to FastAPI.
// It MUST NOT import from '@/lib/db', '@/lib/server/db', 'knex', or any DB client.
// The only allowed imports are: Next.js types, withAuth, and TruequeSession.
//
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import { TruequeSession } from '@/types/auth';

const FASTAPI_BASE = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// GET /api/history
// Returns the authenticated user's trade history, proxied from FastAPI.
// owner_id is read EXCLUSIVELY from the verified JWT session — never from query params.
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end();
    }

    const session = (req as any).session as TruequeSession;
    // owner_id from JWT — the only trusted identity source (GEMINI.md §5)
    const ownerId: string = session.user.id;

    const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 100);

    try {
        const fastApiRes = await fetch(
            `${FASTAPI_BASE}/api/history/me?owner_id=${encodeURIComponent(ownerId)}&limit=${limit}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );

        const data = await fastApiRes.json();

        if (!fastApiRes.ok) {
            console.error('[history.GET] FastAPI error:', data);
            return res.status(fastApiRes.status).json({ error: data.detail || 'FastAPI Error' });
        }

        return res.status(200).json(data);
    } catch (err: any) {
        console.error('[history.GET] Proxy error:', err.message);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

export default withAuth(handler);
