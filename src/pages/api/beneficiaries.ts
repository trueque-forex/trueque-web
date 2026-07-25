// src/pages/api/beneficiaries.ts
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

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = (req as any).session as TruequeSession;
    // owner_id is read EXCLUSIVELY from the verified JWT session — never from req.body or req.query
    const ownerId: string = session.user.id;

    // ── GET — list beneficiaries ──────────────────────────────────────────────
    if (req.method === 'GET') {
        try {
            const fastApiRes = await fetch(
                `${FASTAPI_BASE}/api/beneficiaries?owner_id=${encodeURIComponent(ownerId)}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            );
            const data = await fastApiRes.json();
            if (!fastApiRes.ok) {
                console.error('[beneficiaries.GET] FastAPI error:', data);
                return res.status(fastApiRes.status).json({ error: data.detail || 'FastAPI Error' });
            }
            return res.status(200).json(data);
        } catch (err: any) {
            console.error('[beneficiaries.GET] Proxy error:', err.message);
            return res.status(500).json({ error: err.message || 'Internal Server Error' });
        }
    }

    // ── POST — create beneficiary ─────────────────────────────────────────────
    if (req.method === 'POST') {
        const { name, method, identifiers, country } = req.body;
        if (!method || !identifiers) {
            return res.status(400).json({ error: 'method and identifiers are required' });
        }

        // Strict bilateral payload — owner_id injected from session, never trusted from body
        const payload = {
            owner_id: ownerId,
            name: name || 'Unknown',
            method,
            identifiers,
            country: country || 'US',
        };

        try {
            const fastApiRes = await fetch(`${FASTAPI_BASE}/api/beneficiaries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await fastApiRes.json();
            if (!fastApiRes.ok) {
                console.error('[beneficiaries.POST] FastAPI rejected payload:', data);
                return res.status(fastApiRes.status).json({ error: data.detail || 'FastAPI Error' });
            }
            return res.status(201).json(data);
        } catch (err: any) {
            console.error('[beneficiaries.POST] Proxy error:', err.message);
            return res.status(500).json({ error: err.message || 'Internal Server Error' });
        }
    }

    // ── PUT — update / merge payment method ───────────────────────────────────
    if (req.method === 'PUT') {
        const { id, name, method, identifiers } = req.body;
        if (!id || !method || !identifiers) {
            return res.status(400).json({ error: 'id, method, and identifiers are required' });
        }

        // owner_id injected from session — user can only mutate their own records
        const payload = {
            id,
            owner_id: ownerId,
            name,
            method,
            identifiers,
        };

        try {
            const fastApiRes = await fetch(`${FASTAPI_BASE}/api/beneficiaries`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await fastApiRes.json();
            if (!fastApiRes.ok) {
                console.error('[beneficiaries.PUT] FastAPI rejected payload:', data);
                return res.status(fastApiRes.status).json({ error: data.detail || 'FastAPI Error' });
            }
            return res.status(200).json(data);
        } catch (err: any) {
            console.error('[beneficiaries.PUT] Proxy error:', err.message);
            return res.status(500).json({ error: err.message || 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', 'GET,POST,PUT');
    return res.status(405).end();
}

export default withAuth(handler);
