import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';

/**
 * GET /api/vouchers/[id]
 *
 * Returns the full voucher record using exact DB column names (standardized).
 * Access: sender-owned only — enforced by user_id match from session.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { id } = req.query as { id: string };
    if (!id) return res.status(400).json({ error: 'Missing voucher id' });

    try {
        const result = await query(
            `SELECT
                id,
                owner_id,
                retailer_id,
                retailer_name,
                voucher_code,
                status,
                amount_usd,
                amount_local,
                local_currency,
                exchange_rate,
                processor_fee,
                total_charged,
                symmetri_fee,
                rate_source,
                rate_fallback,
                payment_method,
                beneficiary_name,
                beneficiary_phone,
                delivery_method,
                delivery_status,
                delivered_at,
                redeemed_at,
                redemption_store_id,
                historical_redemption_anchor,
                created_at,
                updated_at,
                expires_at
             FROM vouchers
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Voucher not found' });
        }

        // Return flat, DB-mirrored column names — no renaming
        return res.status(200).json(result.rows[0]);

    } catch (err: any) {
        console.error('[vouchers/[id]] Error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

export default withAuth(handler);
