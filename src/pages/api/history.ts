import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import { query } from '@/lib/db';
import { TruequeSession } from '@/types/auth';

// GET /api/history
// Returns trade history for the calling user from the Postgres trades table.
// A user appears as maker_id (offer poster) or taker_id (matcher).
async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = (req as any).session as TruequeSession;
    const userId = session.user.id;

    try {
        const sql = `
            SELECT
                t.id,
                t.amount,
                t.sent_currency,
                t.received_currency,
                t.received_amount,
                t.status,
                t.created_at,
                t.completed_at
            FROM trades t
            WHERE t.maker_id = $1 OR t.taker_id = $1
            ORDER BY t.created_at DESC
            LIMIT 20
        `;
        const result = await query(sql, [userId]);

        const history = result.rows.map((row: any) => ({
            id: row.id,
            amount: Number(row.amount || 0),
            currencyFrom: row.sent_currency     || '---',
            currencyTo:   row.received_currency || '---',
            valueDelivered: row.received_amount != null
                ? Number(row.received_amount).toFixed(2)
                : '---',
            status: (row.status || 'PENDING').toUpperCase(),
            date: row.created_at
                ? new Date(row.created_at).toISOString().split('T')[0]
                : '---',
        }));

        return res.status(200).json(history);
    } catch (e: any) {
        console.error('[API/HISTORY] Postgres query failed:', e);
        return res.status(500).json({ error: 'internal_error' });
    }
}

export default withAuth(handler);
