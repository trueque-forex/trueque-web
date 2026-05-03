// src/pages/api/mobile/signup.ts
// Mobile-specific signup endpoint with JWT token support
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import getPool from '../../../lib/db';
import { generateTruequeId } from '../../../lib/truequeId';
import { getUtcDate } from '../../../lib/time';
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
            tid: user.tid
        },
        secret,
        { expiresIn: '7d' }
    );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiSuccess | ApiError>) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email: rawEmail, password, firstName, lastName, country, phone } = req.body || {};

    // Validate required fields
    if (!rawEmail || !password || !firstName || !lastName) {
        return res.status(400).json({
            error: 'Missing required fields',
            message: 'email, password, firstName, and lastName are required'
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const email = canonicalize(rawEmail);

    try {
        const pool = typeof getPool === 'function' ? getPool() : getPool;
        if (!pool) throw new Error('DB pool not available');

        // Check if user already exists
        const checkQuery = `SELECT id FROM users WHERE email = $1 LIMIT 1`;
        const existing = await pool.query(checkQuery, [rawEmail]);

        if (existing.rows.length > 0) {
            return res.status(409).json({
                error: 'Email already exists',
                message: 'An account with this email already exists'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate Trueque ID
        const now = getUtcDate();
        const truequeId = typeof generateTruequeId === 'function'
            ? generateTruequeId(now, country || 'CO', Math.floor(Math.random() * 10000))
            : `SYM-${Date.now()}`;

        // Insert new user
        const insertQuery = `
      INSERT INTO users (
        email, password_hash, first_name, last_name,
        country, tid, created_at, phone_number, kyc_status, mfa_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, 'EMPTY', true)
      RETURNING id, email, first_name, last_name, country, tid, created_at
    `;

        const result = await pool.query(insertQuery, [
            rawEmail,
            passwordHash,
            firstName,
            lastName,
            country || 'US',
            truequeId,
            phone
        ]);

        const newUser = result.rows[0];

        // Format user object for mobile app
        const userResponse = {
            id: String(newUser.id),
            tid: newUser.tid,
            symmetriId: newUser.tid,
            email: newUser.email,
            country: newUser.country,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            phone: phone,
            kyc_status: 'not_started', // Not in DB yet
            created_at: newUser.created_at,
            is_admin: false // Not in DB yet
        };

        console.log('[MOBILE SIGNUP] Created new user:', newUser.tid);

        // Always require MFA on signup
        await generateMfaToken(newUser.email);
        
        return res.status(201).json({
            mfa_required: true,
            email: newUser.email,
            last4: phone ? phone.slice(-4) : '',
        });

    } catch (err: any) {
        console.error('Mobile signup error', err);

        // Handle unique constraint violations
        if (err.code === '23505') {
            return res.status(409).json({
                error: 'Email already exists',
                message: 'An account with this email already exists'
            });
        }

        return res.status(500).json({
            error: 'Server error',
            message: 'An error occurred during signup'
        });
    }
}
