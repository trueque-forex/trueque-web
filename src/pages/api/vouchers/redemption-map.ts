import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';
import retailers from '../../../config/retailers.json';

type RetailerConfig = typeof retailers[0];

/**
 * GET /api/vouchers/redemption-map
 *
 * Returns aggregated redemption data for the retailer map.
 * Access:
 *   - VOUCHER_MAP_ACCESS = 'sender' → filters by session user_id (sender sees only their vouchers)
 *   - VOUCHER_MAP_ACCESS = 'admin'  → returns all redemptions (admin sees everyone's)
 *
 * To flip access: change the constant below.
 */

// ─── ACCESS CONTROL ───────────────────────────────────────────────────────────
// This endpoint is RETAILER-ONLY. Regular PEER users are blocked at the API level.
// VOUCHER_MAP_ACCESS controls the data scope:
//   'retailer' → merchant sees redemptions at their own stores (filter by retailer_id)
//   'admin'    → sees all redemptions across all retailers
const VOUCHER_MAP_ACCESS: 'retailer' | 'admin' = 'retailer';
// ──────────────────────────────────────────────────────────────────────────────

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const session = (req as any).session as TruequeSession;

    // MERCHANT-ONLY GUARD — regular PEER users must not access retailer analytics
    if (session.user.userType !== 'MERCHANT') {
        return res.status(403).json({ error: 'Access restricted to retailers.' });
    }

    const ownerId = session.user.id;

    try {
        let rows;

        if (VOUCHER_MAP_ACCESS === 'retailer') {
            // Retailer view: merchant sees redemptions at their own stores.
            // Uses symmetri_id (@handle) to match against retailer_id stored at voucher creation.
            const retailerId = session.user.symmetriId || session.user.id;

            const result = await query(
                `SELECT
                    retailer_id,
                    retailer_name,
                    historical_redemption_anchor AS anchor,
                    redeemed_at,
                    amount_local,
                    local_currency,
                    beneficiary_name,
                    voucher_code,
                    redemption_store_id
                 FROM vouchers
                 WHERE status = 'REDEEMED'
                   AND retailer_id = $1
                   AND historical_redemption_anchor IS NOT NULL
                 ORDER BY redeemed_at DESC`,
                [retailerId]
            );
            rows = result.rows;

        } else {
            // Admin view: all redemptions across all users
            const result = await query(
                `SELECT
                    retailer_id,
                    retailer_name,
                    historical_redemption_anchor AS anchor,
                    redeemed_at,
                    amount_local,
                    local_currency,
                    beneficiary_name,
                    voucher_code,
                    redemption_store_id,
                    user_id
                 FROM vouchers
                 WHERE status = 'REDEEMED'
                   AND historical_redemption_anchor IS NOT NULL
                 ORDER BY redeemed_at DESC`
            );
            rows = result.rows;
        }

        // Aggregate by store location
        const pinMap: Record<string, {
            retailer_id:    string;
            retailer_name:  string;
            lat:            number;
            lng:            number;
            city:           string;
            count:          number;
            total_local:    number;
            local_currency: string;
            last_redeemed:  string;
            redemptions:    any[];
        }> = {};

        for (const row of rows) {
            const anchor = typeof row.anchor === 'string'
                ? JSON.parse(row.anchor)
                : row.anchor;

            if (!anchor?.lat || !anchor?.lng) continue;

            // Key by store_id or lat/lng rounded to 3 decimal places
            const key = row.redemption_store_id
                || `${anchor.lat.toFixed(3)}_${anchor.lng.toFixed(3)}`;

            if (!pinMap[key]) {
                pinMap[key] = {
                    retailer_id:   row.retailer_id,
                    retailer_name: row.retailer_name,
                    lat:           anchor.lat,
                    lng:           anchor.lng,
                    city:          anchor.city || '',
                    count:         0,
                    total_local:   0,
                    local_currency: row.local_currency,
                    last_redeemed: row.redeemed_at,
                    redemptions:   [],
                };
            }

            pinMap[key].count++;
            pinMap[key].total_local += Number(row.amount_local);
            if (row.redeemed_at > pinMap[key].last_redeemed) {
                pinMap[key].last_redeemed = row.redeemed_at;
            }
            pinMap[key].redemptions.push({
                code:             row.voucher_code,
                beneficiary_name: row.beneficiary_name,
                amount_local:     Number(row.amount_local),
                redeemed_at:      row.redeemed_at,
            });
        }

        // Enrich with retailer logo from config
        const pins = Object.values(pinMap).map(pin => {
            const conf = (retailers as RetailerConfig[]).find(r => r.id === pin.retailer_id);
            return {
                ...pin,
                logo: conf?.logo || '📍',
                total_local: parseFloat(pin.total_local.toFixed(2)),
            };
        });

        return res.status(200).json({
            access_mode: VOUCHER_MAP_ACCESS,
            pins,
            total_redeemed: pins.reduce((s, p) => s + p.count, 0),
            total_value:    parseFloat(pins.reduce((s, p) => s + p.total_local, 0).toFixed(2)),
        });

    } catch (err: any) {
        console.error('[vouchers/redemption-map] Error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

export default withAuth(handler);
