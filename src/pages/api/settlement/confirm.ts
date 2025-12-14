import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { tx_id, from, to, amount, rate, timestamp, user_id, confirmed_by } = req.body;

        // In a real app, we would:
        // 1. Verify tx_id exists and is in 'matched' status
        // 2. Validate rate matches the agreed rate
        // 3. Update transaction status to 'settled' or 'processing'
        // 4. Trigger bank transfer / payment gateway

        console.log(`[Settlement] Confirmed for ${tx_id} by ${confirmed_by}`);
        console.log(`[Settlement] ${amount} ${from} -> ${to} @ ${rate}`);

        // Mock success response
        return res.status(200).json({
            success: true,
            status: 'settled',
            settlement_id: `settle_${Date.now()}`,
            timestamp: new Date().toISOString(),
            message: 'Settlement processed successfully'
        });
    } catch (err: any) {
        console.error('[Settlement] Error:', err);
        return res.status(500).json({ error: 'internal_error', message: err.message });
    }
}

export default withAuth(handler);
