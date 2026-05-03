// src/pages/api/mobile/verify-mfa.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyMfaToken } from '../../../lib/mfaToken';
import getPool from '../../../lib/db';
import jwt from 'jsonwebtoken';

type ApiError = { error: string; message?: string };
type ApiSuccess = { token: string; user: any };

function generateToken(user: any): string {
    const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            truequeId: user.tid
        },
        secret,
        { expiresIn: '7d' }
    );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiSuccess | ApiError>) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, code } = req.body || {};

    if (!email || !code) {
        return res.status(400).json({ error: 'Email and code are required' });
    }

    try {
        // 1. Verify OTP code
        const isValid = await verifyMfaToken(email, code);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid or expired verification code' });
        }

        const pool = typeof getPool === 'function' ? getPool() : getPool;
        if (!pool) throw new Error('DB pool not available');

        // 2. Fetch the user
        const query = `
      SELECT id, email, tid, first_name, last_name, country, phone_number, created_at, kyc_status, mfa_enabled
      FROM users
      WHERE email = $1
      LIMIT 1
    `;
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // 3. Mark MFA as enabled if this is their first time verifying
        if (!user.mfa_enabled) {
            await pool.query('UPDATE users SET mfa_enabled = true WHERE id = $1', [user.id]);
        }

        // 4. Generate fully authenticated JWT token
        const token = generateToken(user);

        // Format user object for mobile app
        const userResponse = {
            id: String(user.id),
            tid: user.tid || `TRQ-${user.id}`,
            symmetriId: user.tid || `TRQ-${user.id}`,
            email: user.email,
            country: user.country || 'US',
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone_number,
            kyc_status: user.kyc_status || 'not_started',
            created_at: user.created_at,
            is_admin: false,
        };

        return res.status(200).json({
            token,
            user: userResponse
        });

    } catch (err: any) {
        console.error('Mobile verify-mfa error', err);
        return res.status(500).json({
            error: 'Server error',
            message: 'An error occurred during MFA verification'
        });
    }
}
