import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * POST /api/auth/verify-mfa
 * Verifies a 6-digit MFA code submitted during a transaction.
 *
 * In APP_ENV=test: accepts '123456' as a universal bypass for automated testing.
 * In production: validates against the stored OTP (Twilio Verify or equivalent).
 *               Returns 501 if the SMS/OTP provider is not yet configured.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { code, mfa_token } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        if (!code || code.length !== 6) {
            return res.status(400).json({ ok: false, error: 'invalid_code_format' });
        }

        const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';
        const isTestEnv = appEnv === 'test';

        // ── TEST BYPASS ──────────────────────────────────────────────────────
        // Only active when APP_ENV=test. Never reaches production.
        if (isTestEnv && code === '123456') {
            console.log('[MFA] Test bypass used — APP_ENV=test');
            return res.status(200).json({ ok: true, verified: true });
        }
        // ── END TEST BYPASS ──────────────────────────────────────────────────

        // ── PRODUCTION VERIFICATION ──────────────────────────────────────────
        // TODO: Integrate Twilio Verify or equivalent OTP provider here.
        // Example flow:
        //   const result = await twilioVerify.check({ to: userPhone, code });
        //   if (result.status === 'approved') return res.json({ ok: true, verified: true });
        // Until configured, reject all production MFA with a clear 501 response.
        console.warn('[MFA] Production OTP provider not yet configured.');
        return res.status(501).json({
            ok: false,
            error: 'mfa_provider_not_configured',
            message: 'MFA verification requires a configured OTP provider. See /api/auth/verify-mfa.',
        });
        // ── END PRODUCTION VERIFICATION ──────────────────────────────────────

    } catch (e) {
        console.error('[MFA] Verification error', e);
        return res.status(500).json({ ok: false, error: 'internal_error' });
    }
}
