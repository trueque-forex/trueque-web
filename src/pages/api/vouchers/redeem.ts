import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';

/**
 * POST /api/vouchers/redeem
 *
 * Refactored to proxy to FastAPI.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const session = (req as any).session as TruequeSession;
    
    // In Phase 1, the merchant must be authenticated and their userType === 'MERCHANT'
    if (session.user.userType !== 'MERCHANT') {
        return res.status(403).json({ error: 'Only merchants can redeem vouchers.' });
    }

    const { voucher_code, store_id, lat, lng } = req.body;

    if (!voucher_code) {
        return res.status(400).json({ error: 'Missing voucher_code' });
    }

    try {
        const payload = {
            voucher_code,
            store_id,
            lat,
            lng,
            merchant_id: session.user.id
        };

        const fastApiRes = await fetch('http://127.0.0.1:8000/api/merchants/redeem', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Symmetri-Internal-Key': 'SECRET_ADMIN_KEY'
            },
            body: JSON.stringify(payload)
        });

        const data = await fastApiRes.json();

        if (!fastApiRes.ok) {
            console.error('[vouchers/redeem] FastAPI rejected payload:', data);
            return res.status(fastApiRes.status).json({ error: data.detail || 'FastAPI Error' });
        }

        return res.status(200).json(data);

    } catch (err: any) {
        console.error('[vouchers/redeem] Proxy Error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

export default withAuth(handler);

