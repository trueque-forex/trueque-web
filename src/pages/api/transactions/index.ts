
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/withAuth';
import { query } from '../../../lib/db';
import { TruequeSession } from '../../../types/auth';

// GET /api/transactions
// Returns the calling user's transaction history from the Postgres transactions table.
// Schema: id, transaction_id, user_id, amount, fee_platform, fee_transmitter,
//         receive_amount, quote_payload (JSONB), payload (JSONB), status, created_at
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const session = (req as any).session as TruequeSession;
    const userId = session.user.id;

    try {
        // Live schema: id(uuid), owner_id, amount, currency, status, type,
        // description, exchange_rate, amount_received, currency_received, fee, created_at
        const sql = `
            SELECT
                id,
                amount,
                currency,
                currency_received,
                amount_received,
                status,
                description,
                fee,
                created_at
            FROM transactions
            WHERE owner_id = $1
            ORDER BY created_at DESC
            LIMIT 20
        `;
        const result = await query(sql, [userId]);

        const formatted = result.rows.map((t: any) => ({
            id: String(t.id),
            date: t.created_at
                ? new Date(t.created_at).toISOString().split('T')[0]
                : '---',
            amount: t.amount != null ? Number(t.amount) : 0,
            currencyFrom: t.currency || '---',
            currencyTo:   t.currency_received || '---',
            recipient: t.description || '---',
            status: (t.status || 'PENDING').toUpperCase(),
            valueDelivered: t.amount_received != null
                ? `${Number(t.amount_received).toFixed(2)} ${t.currency_received || ''}`
                : '---',
            fees: {
                platform: Number(t.fee || 0).toFixed(2),
            },
        }));

        return res.status(200).json({ transactions: formatted });

    } catch (err: any) {
        console.error('[API/TRANSACTIONS] Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export default withAuth(handler);
