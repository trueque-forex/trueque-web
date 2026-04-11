import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';

// GET /api/drafts   → returns saved swap drafts from Python backend
// POST /api/drafts  → saves a new draft
// Falls back gracefully if the Python draft service is offline.

const BACKEND_URL = process.env.API_URL || 'http://127.0.0.1:8000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getSession(req);
    if (!session?.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        try {
            const response = await fetch(`${BACKEND_URL}/api/drafts/${session.user.id}`);
            if (!response.ok) {
                console.warn('[drafts] Backend returned', response.status, '— returning empty list');
                return res.status(200).json([]);
            }
            const data = await response.json();
            return res.status(200).json(data);
        } catch (err) {
            // Python service not running — degrade gracefully
            console.warn('[drafts] Draft service unreachable — returning empty list');
            return res.status(200).json([]);
        }
    }

    if (req.method === 'POST') {
        try {
            const response = await fetch(`${BACKEND_URL}/api/drafts/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...req.body,
                    user_id: session.user.id, // Enforce server-side user ID
                }),
            });
            const data = await response.json();
            return res.status(response.status).json(data);
        } catch (err) {
            console.warn('[drafts] Draft service unreachable on POST');
            return res.status(503).json({ error: 'Draft service temporarily unavailable' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
