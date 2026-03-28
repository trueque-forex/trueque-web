
import { NextApiRequest, NextApiResponse } from 'next';
import { getKnex } from '../../lib/db';
import { getSession } from '../../lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const session = await getSession(req);
        if (!session) return res.status(401).json({ error: 'Unauthorized' });

        const db = getKnex();
        const userId = session.user.id;

        if (req.method === 'POST') {
            // 1. Check for existing DRAFT
            const existingDraft = await db('transactions')
                .where({ user_id: userId, status: 'DRAFT' })
                .first();

            if (existingDraft) {
                return res.status(200).json({
                    found: true,
                    transaction: existingDraft,
                    message: 'Existing draft found'
                });
            }

            // 2. Create NEW Draft
            const [newDraft] = await db('transactions')
                .insert({
                    user_id: userId,
                    status: 'DRAFT',
                    timestamp: new Date(),
                    amount: 0,
                    from_currency: 'USD',
                })
                .returning('*');

            return res.status(201).json({
                found: false,
                transaction: newDraft,
                message: 'New draft created'
            });
        }

        if (req.method === 'GET') {
            const { id } = req.query;
            if (id) {
                const tx = await db('transactions').where({ id, user_id: userId }).first();
                if (tx) return res.status(200).json({ transaction: tx });
                return res.status(404).json({ error: 'Transaction not found' });
            }
        }

        if (req.method === 'PUT') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: 'Missing ID' });

            const { amount, currency_from, currency_to, status } = req.body;

            const updatePayload: any = {
                amount: amount,
                from_currency: currency_from,
                to_currency: currency_to,
                status: status || 'DRAFT',
            };

            await db('transactions')
                .where({ id, user_id: userId })
                .update(updatePayload);

            return res.status(200).json({ ok: true });
        }

        return res.status(405).json({ error: 'Method Not Allowed' });

    } catch (error: any) {
        console.error('Draft API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
