// src/pages/api/vouchers/retailers.ts
// GET /api/vouchers/retailers
// Returns the retailers list for the mobile app's retailer selection screen.
// Access: authenticated users only (mobile Bearer JWT or web cookie).
// GEMINI.md §3.1 — sorted by no margin preference; client sorts by proximity.

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/withAuth';
import retailers from '../../../config/retailers.json';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    // Return the full retailers list — client sorts by historicalRedemptionAnchor proximity.
    // GEMINI.md §3.1 Pillar 1: no margin-first ranking server-side.
    return res.status(200).json(retailers);
}

export default withAuth(handler);
