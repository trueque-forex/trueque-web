import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/withAuth';

export default withAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { corridor, amount, offerId, rate, userId } = req.body;

    // Mock reservation creation
    // Format: resv_<timestamp>_<amount>_<rate>
    const reservationId = `resv_${Date.now()}_${amount}_${rate}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return res.status(200).json({ reservationId, expiresAt });
});
