import type { NextApiRequest, NextApiResponse } from 'next';
import { getKnex } from '../../../lib/db';
import { buildTidAndReserve } from '../../../lib/buildTID';
import { getUtcDate } from '../../../lib/time';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

    const { id, userId, kycData } = req.body;
    const targetId = id || userId;

    if (!targetId) {
        return res.status(401).json({ ok: false, error: 'unauthorized', message: 'User ID required' });
    }

    // --- STRICT VALIDATION: Mandatory KYC Fields ---
    const mandatoryFields = [
        'fullLegalName', 'dateOfBirth', 'nationality',
        'street_address', 'city', 'state', 'postalCode', 'country',
        'documentNumber', 'documentIssueDate', 'documentExpiryDate', 'documentIssuingCountry'
    ];

    if (!kycData) {
        return res.status(400).json({ ok: false, error: 'missing_payload', message: 'KYC data is required' });
    }

    for (const field of mandatoryFields) {
        if (!kycData[field] || (typeof kycData[field] === 'string' && !kycData[field].trim())) {
            return res.status(400).json({
                ok: false,
                error: 'missing_field',
                message: `The field '${field}' is mandatory for verification.`
            });
        }
    }

    const db = getKnex();

    try {
        const user = await db('users').where({ id: targetId }).first();
        if (!user) {
            return res.status(404).json({ ok: false, error: 'user_not_found' });
        }

        if (user.tid && !user.tid.startsWith('TRQ-PENDING') && !user.tid.startsWith('TDEV')) {
            return res.status(200).json({ ok: true, tid: user.tid, alreadyExists: true });
        }

        // --- IMMUTABLE ANCHOR VALIDATION ---
        const profileCountry = user.country;
        if (profileCountry && kycData.country !== profileCountry) {
            return res.status(400).json({
                ok: false,
                error: 'anchor_mismatch',
                message: `Identity verification must be completed for your country of residence (${profileCountry}).`
            });
        }

        // Generate Real TID and set status to PENDING
        const country = kycData.country || user.country || 'XX';

        // Extract names from fullLegalName if profile is empty
        let firstName = user.first_name || '';
        let lastName = user.last_name || '';
        if (!firstName && kycData.fullLegalName) {
            const parts = kycData.fullLegalName.trim().split(/\s+/);
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        }

        const finalTid = await db.transaction(async (trx: any) => {
            const tid = await buildTidAndReserve(trx, getUtcDate(), country);

            // Update User Profile with "Truth" data from KYC
            await trx('users').where({ id: targetId }).update({
                tid: tid,
                kyc_status: 'PENDING',
                first_name: firstName,
                last_name: lastName,
                dob: kycData.dateOfBirth || user.dob,
                updated_at: getUtcDate()
            });

            return tid;
        });

        return res.status(200).json({ ok: true, tid: finalTid });

    } catch (err: any) {
        console.error('KYC Complete Error:', err);
        return res.status(500).json({ ok: false, error: 'internal_error', detail: err.message });
    }
}
