
import type { NextApiRequest, NextApiResponse } from 'next';
import { getKnex } from '../../../lib/db';
import { getSession } from '../../../lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // 1. Auth Guard
    const session = await getSession(req);
    if (!session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Only GET allowed
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const knex = getKnex();
        // 3. Query Transactions (Joined with Beneficiaries for names)
        // Ordered by most recent first
        const transactions = await knex('transactions')
            .select(
                'transactions.id',
                'transactions.timestamp as date',
                'transactions.amount as amount',
                'transactions.from_currency as currency',
                'transactions.status',
                'transactions.recipient_name'
            )
            .where({ 'transactions.user_id': session.user.id })
            .orderBy('transactions.timestamp', 'desc')
            .limit(10);

        // 4. Format for UI
        const formatted = transactions.map((t: any) => ({
            id: t.id,
            date: t.date ? new Date(t.date).toISOString().split('T')[0] : '---', // YYYY-MM-DD
            amount: `${t.amount} ${t.currency}`,
            recipient: t.recipient_name || 'Unknown Recipient',
            status: t.status || 'PENDING',

            // Defaults for fields not yet in DB schema (UI expects them)
            valueDelivered: '---',
            marketRate: '---',
            fees: {
                inbound: '0.00', liquidity: '0.00', service: '0.00',
                gateway: '0.00', premium: '0.00', tax: '0.00'
            }
        }));

        return res.status(200).json({ transactions: formatted });

    } catch (err: any) {
        console.error('[API/TRANSACTIONS] Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
