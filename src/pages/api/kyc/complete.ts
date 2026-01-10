import type { NextApiRequest, NextApiResponse } from 'next';
import { getKnex } from '../../../lib/db';
import { buildTidAndReserve } from '../../../lib/buildTID';
import { getUtcDate } from '../../../lib/time';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

    const { userId, kycData } = req.body; // Expect session userId or explicit

    if (!userId) {
        return res.status(401).json({ ok: false, error: 'unauthorized', message: 'User ID required' });
    }

    const db = getKnex();

    try {
        const user = await db('users').where({ id: userId }).first();
        if (!user) {
            return res.status(404).json({ ok: false, error: 'user_not_found' });
        }

        if (user.tid && !user.tid.startsWith('TRQ-PENDING') && !user.tid.startsWith('TDEV')) {
            // Already has a valid TID? Just return it?
            // But user might be re-doing KYC. 
            // If standard TID exists, we shouldn't overwrite unless requested.
            // For now, return existing.
            return res.status(200).json({ ok: true, tid: user.tid, alreadyExists: true });
        }

        // Generate Real TID
        const country = kycData?.country || user.country_of_residence || 'XX';
        const finalTid = await db.transaction(async (trx: any) => {
            const tid = await buildTidAndReserve(trx, getUtcDate(), country);

            // Update User
            await trx('users').where({ id: userId }).update({
                tid: tid,
                kyc_status: 'pending', // Pending status triggers Sandbox Mode
                updated_at: getUtcDate()
            });

            // Save KYC Data Submission (Mock)
            // await trx('kyc_submissions').insert({ user_id: userId, data: kycData ... });

            return tid;
        });

        return res.status(200).json({ ok: true, tid: finalTid });

    } catch (err: any) {
        console.error('KYC Complete Error:', err);
        return res.status(500).json({ ok: false, error: 'internal_error', detail: err.message });
    }
}
