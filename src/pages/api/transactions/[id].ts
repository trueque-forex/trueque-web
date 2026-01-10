import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import { TruequeSession } from '@/types/auth';

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

        const session = (req as any).session as TruequeSession;

        return res.status(200).json({
            id: typeof id === 'string' ? id : (id?.[0] || 'unknown'),
            status: 'completed',
            user_id: session?.user?.id || 'user-123',
            counterparty_id: 'mock-counterparty-uuid',
            amount: 100.0,
            amount_received: 98.5,
            currency_from: 'COP',
            currency_to: 'USD',
            exchange_rate: 4000.0,
            market_rate: 4000.0,
            fee: 1.5,
            fee_percentage: 1.5,
            payment_method: 'SPEI',
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
