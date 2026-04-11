import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import retailers from '../../../config/retailers.json';

type RetailerConfig = typeof retailers[0];

/**
 * POST /api/vouchers/redeem
 *
 * Phase 1 — Voucher redemption endpoint.
 * Called by retailer POS systems (or in Phase 1, the beneficiary / simulated POS).
 *
 * Body: { voucher_code, store_id?, lat?, lng? }
 *
 * Captures:
 *   - redeemed_at timestamp
 *   - redemption_store_id
 *   - historical_redemption_anchor { lat, lng, city } — from store seed coordinates
 *     if not provided directly. No browser GPS per GEMINI.md §3.1.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { voucher_code, store_id, lat, lng } = req.body;

    if (!voucher_code) {
        return res.status(400).json({ error: 'Missing voucher_code' });
    }

    try {
        // 1. Lookup the voucher
        const lookup = await query(
            `SELECT id, status, retailer_id, expires_at, beneficiary_name, amount_local, local_currency
             FROM vouchers
             WHERE voucher_code = $1`,
            [voucher_code]
        );

        if (lookup.rows.length === 0) {
            return res.status(404).json({ error: 'Voucher not found' });
        }

        const voucher = lookup.rows[0];

        // 2. Validate state
        if (voucher.status !== 'ACTIVE') {
            return res.status(400).json({
                error: `Voucher cannot be redeemed. Current status: ${voucher.status}`,
                status: voucher.status,
            });
        }

        if (new Date(voucher.expires_at) < new Date()) {
            // Auto-expire
            await query(
                `UPDATE vouchers SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1`,
                [voucher.id]
            );
            return res.status(400).json({ error: 'Voucher has expired', status: 'EXPIRED' });
        }

        // 3. Resolve historical_redemption_anchor
        //    Priority: (a) lat/lng from request (POS webhook), (b) seeded store location
        let anchor: { lat: number; lng: number; city?: string } | null = null;

        if (lat && lng) {
            anchor = { lat: parseFloat(lat), lng: parseFloat(lng) };
        } else if (store_id) {
            // Match store_id against seeded retailer locations
            const retailer = (retailers as RetailerConfig[]).find(r => r.id === voucher.retailer_id);
            if (retailer?.locations) {
                const loc = retailer.locations.find((l: any) => l.store_id === store_id);
                if (loc) {
                    anchor = { lat: loc.lat, lng: loc.lng, city: loc.city };
                }
            }
        }

        // Fallback: pick first known location for this retailer (passive sorter)
        if (!anchor) {
            const retailer = (retailers as RetailerConfig[]).find(r => r.id === voucher.retailer_id);
            if (retailer?.locations?.[0]) {
                const loc = retailer.locations[0] as any;
                anchor = { lat: loc.lat, lng: loc.lng, city: loc.city };
            }
        }

        // 4. Mark REDEEMED
        const now = new Date();
        await query(
            `UPDATE vouchers
             SET status                     = 'REDEEMED',
                 redeemed_at               = $1,
                 redemption_store_id       = $2,
                 historical_redemption_anchor = $3,
                 updated_at                = $1
             WHERE id = $4`,
            [now, store_id || null, anchor ? JSON.stringify(anchor) : null, voucher.id]
        );

        return res.status(200).json({
            success: true,
            message: 'Voucher redeemed successfully',
            voucher: {
                id:                          voucher.id,
                status:                      'REDEEMED',
                beneficiary_name:            voucher.beneficiary_name,
                amount_local:                Number(voucher.amount_local),
                local_currency:              voucher.local_currency,
                redeemed_at:                 now.toISOString(),
                historical_redemption_anchor: anchor,
            },
        });

    } catch (err: any) {
        console.error('[vouchers/redeem] Error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

export default withAuth(handler);
