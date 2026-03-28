import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';

const BACKEND_URL = process.env.API_URL || 'http://127.0.0.1:8000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const session = await getSession(req);
        if (!session || !session.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (req.method === 'POST') {
            const response = await fetch(`${BACKEND_URL}/api/drafts/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...req.body,
                    user_id: session.user.id // Enforce server-side user ID
                })
            });
            const data = await response.json();
            return res.status(response.status).json(data);
        }

        if (req.method === 'GET') {
            const response = await fetch(`${BACKEND_URL}/api/drafts/${session.user.id}`);
            const data = await response.json();
            return res.status(response.status).json(data);
        }

        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error) {
        console.error('Draft API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
