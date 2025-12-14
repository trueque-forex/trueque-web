import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { id } = req.query;

    try {
        // In a real app, query DB for transaction by ID
        // const tx = await db.transactions.findUnique({ where: { uuid: id } });

        // Verify user owns the transaction
        // if (tx.userId !== session.userId) return 404

        // Mock response
        // If the ID starts with 'qr_', it's from the QR flow
        // If it starts with 'uuid_' or 'offer_', it's from the Offer flow

        return res.status(200).json({
            id: typeof id === 'string' ? id : (id?.[0] || 'unknown'),
            status: 'completed', // Always return completed for now to unblock flow
            amount: 100.0,
            currency_from: 'COP',
            currency_to: 'USD',
            created_at: new Date().toISOString(),
            description: 'Settlement confirmed',
            counterparty: {
                name: 'Carlos Méndez',
                trueque_id: 'TRQ-MX-123'
            }
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'internal_error', message: err.message });
    }
}

export default withAuth(handler);
