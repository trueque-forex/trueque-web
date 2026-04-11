import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';

/**
 * GET /api/vouchers/list?user_id=<uuid>
 *
 * Returns the sender's voucher history for the dashboard Recent Vouchers section.
 * Ordered newest first, includes redemption anchor city for display.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    // User UUID from JWT-verified session — injected by withAuth.
    const session = (req as any).session as TruequeSession;
    const ownerId = session.user.id;
    const { limit = '10' } = req.query as { limit?: string };

    try {
        const result = await query(
            `SELECT
                id, retailer_id, retailer_name,
                voucher_code, status,
                amount_usd, amount_local, local_currency,
                beneficiary_name, beneficiary_phone,
                delivery_status, delivered_at,
                redeemed_at, historical_redemption_anchor,
                created_at, expires_at
             FROM vouchers
             WHERE owner_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [ownerId, parseInt(limit as string, 10)]
        );

        return res.status(200).json({
            vouchers: result.rows,
            count: result.rows.length,
        });
    } catch (err: any) {
        console.error('[vouchers/list] Error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

export default withAuth(handler);
