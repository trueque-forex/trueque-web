
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/server/db';
import { decrypt } from '@/lib/session';
import { mapUserToUI } from '@/lib/mappers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const cookie = req.cookies.session || req.cookies.trueque_sid;
        if (!cookie) return res.status(401).json({ user: null });

        const session = await decrypt(cookie);
        if (!session?.user?.id) return res.status(401).json({ user: null });

        const userId = session.user.id;

        // Parallel Query: User Status + Tx Count
        // NOTE: 'transactions' table uses 'user_id' (legacy) or 'owner_id'. Error hint suggested 'user_id'.
        // NOTE: 'users' table might use 'kycStatus' or 'kyc_status'.
        const userQuery = `SELECT * FROM users WHERE id = $1`;
        const txQuery = `SELECT COUNT(*) as count FROM transactions WHERE owner_id = $1 AND status NOT IN ('DRAFT', 'CANCELLED', 'FAILED')`;
        const draftQuery = `SELECT COUNT(*) as count FROM transactions WHERE owner_id = $1 AND status = 'DRAFT'`;

        const [userRes, txRes, draftRes] = await Promise.all([
            query(userQuery, [userId]),
            query(txQuery, [userId]),
            query(draftQuery, [userId])
        ]);

        const userRow = userRes.rows[0] || {};
        // Fallback: Check snake_case and camelCase
        const kycStatus = userRow.kyc_status || userRow.kycStatus || userRow.status || 'PENDING';
        const txCount = parseInt(txRes.rows[0]?.count || '0');
        const draftCount = parseInt(draftRes.rows[0]?.count || '0');

        // DEBUG: value check
        console.log(`[Session API] User: ${userId} | Name: ${userRow.first_name} | KYC: ${kycStatus} | TxCount: ${txCount}`);

        const fullName = [userRow.first_name, userRow.last_name].filter(Boolean).join(' ');
        // Use the Single Source of Truth Mapper
        const mappedUser = mapUserToUI(userRow);

        return res.status(200).json({
            user: {
                ...mappedUser,
                name: fullName || null,
                id: userId, // Ensure session ID persists
                email: session.user.email,
                dob: userRow.dob,
                kycStatus: kycStatus, // Keep existing computed status for now
                txCount: txCount,
                draftCount: draftCount
            }
        });

    } catch (e: any) {
        console.error('Session API Error:', e);
        return res.status(500).json({ error: 'internal_error' });
    }
}
