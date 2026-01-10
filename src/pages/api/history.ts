import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import { query } from '@/lib/db';
import { TruequeSession } from '@/types/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = (req as any).session as TruequeSession;

    try {
        // PROXY TO PYTHON BACKEND (SQLite)
        // We use the mock user_id=1 to match what swaps.ts inserts.
        const pythonRes = await fetch('http://127.0.0.1:8000/history/user/1');

        if (!pythonRes.ok) {
            // Fallback to empty if 404 or error
            return res.status(200).json([]);
        }

        const backendOffers = await pythonRes.json();

        const history = backendOffers.map((row: any) => ({
            id: row.uuid,
            amount: row.amount,
            currencyFrom: row.currency_from,
            currencyTo: row.currency_to,
            status: row.status,
            date: row.timestamp
        }));

        return res.status(200).json(history);
    } catch (e: any) {
        console.error('History fetch failed', e);
        return res.status(500).json({ error: 'internal_error' });
    }
}

export default withAuth(handler);
