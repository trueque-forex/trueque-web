import type { NextApiRequest, NextApiResponse } from 'next';
import { respondWithSession } from '../../../lib/authResponse';
import { getKnex } from '../../../lib/db';

// Helper to ensure dev users are loaded (Code reuse from signin.ts)
function ensureDevUsers() {
    const g: any = global;
    if (!g.__DEV_USERS) {
        try {
            const dev = require('../../../lib/devUsers')?.default || require('../../../lib/devUsers')?.DEV_USERS || require('../../../lib/devUsers');
            g.__DEV_USERS = g.__DEV_USERS || dev;
            if (g.__DEV_USERS?.DEV_USERS) g.__DEV_USERS = g.__DEV_USERS.DEV_USERS;
        } catch (e) { }
    }
    return (global as any).__DEV_USERS;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { email, last4, dob } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        if (!email || !last4 || !dob) {
            return res.status(400).json({ error: 'invalid_request', message: 'Missing fields (Expected email, last 4 digits of phone, and DOB)' });
        }

        const devUsers = ensureDevUsers();
        let user: any = null;

        // DB Lookup First
        try {
            const db = getKnex();
            user = await db('users').where({ email }).first();
        } catch (e) { console.warn('DB lookup failed in recovery', e); }

        // Fallback to DevUsers
        if (!user && devUsers && devUsers[email]) {
            user = devUsers[email];
        }

        if (!user) {
            return res.status(404).json({ error: 'user_not_found', message: 'User not found' });
        }

        // Verify Phone Last 4
        const phone = user.phone;
        if (!phone) {
            return res.status(400).json({ error: 'no_phone_data', message: 'No phone number on file for this user.' });
        }

        // Clean phone (remove spaces/dashes) and check suffix
        const cleanPhone = String(phone).replace(/\D/g, '');
        const idMatch = cleanPhone.endsWith(String(last4).trim());

        // Verify DOB match (Compare YYYY-MM-DD)
        const userDob = user.dob ? (user.dob instanceof Date ? user.dob : new Date(user.dob)).toISOString().slice(0, 10) : '';
        const dobMatch = userDob === dob;

        // Verify Trueque ID (Optional High Trust Factor)
        const { tid } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const tidProvided = !!tid;
        const tidMatch = tidProvided && (user.tid === tid);

        if ((idMatch && dobMatch) || (tidMatch && (idMatch || dobMatch))) {
            // Logic: Phone+DOB is Standard. TID + (Phone OR DOB) is High Trust.
            // Or just enforce Phone+DOB always, and TID adds flag.
            // Prompt: "recognizes it as a high-trust recovery factor".
            // Let's settle on: Phone+DOB is mandatory baseline. TID adds High Trust tag.
            // Actually, if TID is high trust, maybe it can substitute one factor?
            // "TID + (Phone OR DOB)" seems safer than just TID.

            // Success!
            // Issue session with special permission
            return await respondWithSession(req, res, {
                ...user,
                mfaResetAllowed: true, // State Transition
                recoveryTrustLevel: tidMatch ? 'HIGH' : 'STANDARD',
                tid: user.tid || 'FRESH_RECOVERY'
            });
        } else {
            return res.status(401).json({ error: 'challenge_failed', message: 'Verification failed. Phone digits or Date of Birth does not match.' });
        }
    } catch (err: any) {
        console.error('ID Challenge error', err);
        return res.status(500).json({ error: 'internal_error' });
    }
}
