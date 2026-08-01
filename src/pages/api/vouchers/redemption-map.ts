import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';
import retailers from '../../../config/retailers.json';

// =============================================================================
// TECHNICAL DEBT — Sprint Migration Required
// -----------------------------------------------------------------------------
// This Next.js API route directly accesses the PostgreSQL database via
// src/lib/db.ts. This violates the "FastAPI as Sole Orchestrator" pattern
// established in GEMINI.md §4 / §5. All direct DB access from Next.js must
// be migrated to the corresponding FastAPI router (backend/routes/) in a
// future sprint. Until migrated, this file is the authoritative handler for
// GET /api/vouchers/redemption-map.
// =============================================================================

type RetailerConfig = typeof retailers[0];

/**
 * GET /api/vouchers/redemption-map
 *
 * Returns aggregated redemption data for the retailer map.
 * Access: MERCHANT-ONLY (userType === 'MERCHANT'). Regular PEER users → 403.
 * VOUCHER_MAP_ACCESS controls the data scope:
 *   'retailer' → merchant sees redemptions at their own stores
 *   'admin'    → sees all redemptions across all retailers
 */

// ─── ACCESS CONTROL ───────────────────────────────────────────────────────────
const VOUCHER_MAP_ACCESS: 'retailer' | 'admin' = 'retailer';
// ──────────────────────────────────────────────────────────────────────────────

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const session = (req as any).session as TruequeSession;

    // MERCHANT-ONLY GUARD — regular PEER users must not access retailer analytics (GEMINI.md §3.1)
    if (session.user.userType !== 'MERCHANT') {
        return res.status(403).json({ error: 'Access restricted to retailers.' });
    }

    try {
        let rows;

        if (VOUCHER_MAP_ACCESS === 'retailer') {
            // Retailer view: merchant sees redemptions at their own stores.
            const retailerId = session.user.symmetriId || session.user.id;

            const result = await query(
                `SELECT
                    retailer_id,
                    retailer_name,
                    historical_redemption_anchor,
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
            // NOTE: owner_id is the correct FK — never user_id (GEMINI.md §2.2)
            const result = await query(
                `SELECT
                    retailer_id,
                    retailer_name,
                    historical_redemption_anchor,
                    redeemed_at,
                    amount_local,
                    local_currency,
                    beneficiary_name,
                    voucher_code,
                    redemption_store_id,
                    owner_id
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
            // Use the canonical field name — no 'anchor' alias (GEMINI.md §2.2)
            const historical_redemption_anchor = typeof row.historical_redemption_anchor === 'string'
                ? JSON.parse(row.historical_redemption_anchor)
                : row.historical_redemption_anchor;

            if (!historical_redemption_anchor?.lat || !historical_redemption_anchor?.lng) continue;

            const key = row.redemption_store_id
                || `${historical_redemption_anchor.lat.toFixed(3)}_${historical_redemption_anchor.lng.toFixed(3)}`;

            if (!pinMap[key]) {
                pinMap[key] = {
                    retailer_id:    row.retailer_id,
                    retailer_name:  row.retailer_name,
                    lat:            historical_redemption_anchor.lat,
                    lng:            historical_redemption_anchor.lng,
                    city:           historical_redemption_anchor.city || '',
                    count:          0,
                    total_local:    0,
                    local_currency: row.local_currency,
                    last_redeemed:  row.redeemed_at,
                    redemptions:    [],
                };
            }

            pinMap[key].count++;
            pinMap[key].total_local += Number(row.amount_local);
            if (row.redeemed_at > pinMap[key].last_redeemed) {
                pinMap[key].last_redeemed = row.redeemed_at;
            }
            pinMap[key].redemptions.push({
                voucher_code:     row.voucher_code,
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
            access_mode:    VOUCHER_MAP_ACCESS,
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
