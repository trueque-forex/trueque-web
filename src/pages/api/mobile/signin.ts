// src/pages/api/mobile/signin.ts
// Mobile-specific signin endpoint with JWT token support
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import getPool from '../../../lib/db';
import { generateMfaToken } from '../../../lib/mfaToken';

type ApiError = { error: string; message?: string };
type ApiSuccess = { token: string; user: any };

function canonicalize(v?: unknown) {
    if (!v) return null;
    return String(v).trim().toLowerCase();
}

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

    const { email: rawEmail, password } = req.body || {};

    if (!rawEmail || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const email = canonicalize(rawEmail);

    try {
        const pool = typeof getPool === 'function' ? getPool() : getPool;
        if (!pool) throw new Error('DB pool not available');

        const query = `
      SELECT id, password_hash, email, tid, first_name, last_name, country, phone_number, created_at, kyc_status, mfa_enabled
      FROM users
      WHERE email = $1
      LIMIT 1
    `;

        const result = await pool.query(query, [rawEmail]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

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
            kyc_status: user.kyc_status || 'not_started',  // Read from DB
            created_at: user.created_at,
            is_admin: false,
        };

        // MFA check
        if (user.mfa_enabled) {
            await generateMfaToken(user.email);
            return res.status(200).json({
                mfa_required: true,
                email: user.email,
                last4: user.phone_number ? user.phone_number.slice(-4) : '',
            });
        }

        // Generate JWT token for non-MFA flow
        const token = generateToken(user);

        return res.status(200).json({
            token,
            user: userResponse
        });

    } catch (err: any) {
        console.error('Mobile signin error', err);
        return res.status(500).json({
            error: 'Server error',
            message: 'An error occurred during sign in'
        });
    }
}
