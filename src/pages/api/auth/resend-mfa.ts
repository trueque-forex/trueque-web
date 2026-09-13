import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { mfa_token, email } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        console.log(`[MFA RESEND] Request received for email: ${email} (token: ${mfa_token?.slice(0, 8)}...)`);

        // Mock Generation
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save to global state for local testing verification
        (global as any).__DEV_MFA_CODE = newCode;

        // LOGGING (Critical for Dev)
        console.log('------------------------------------------------');
        console.log(`🔑 NEW OTP GENERATED: ${newCode}`);
        console.log(`📧 DESTINATION:       ${email || 'Unknown User'}`);
        console.log('------------------------------------------------');

        // Note: For dev flow, we allow both '123456' and the globally generated code.
        return res.status(200).json({ ok: true, message: 'Code resent' });
    } catch (e) {
        console.error('Resend failed', e);
        return res.status(500).json({ error: 'internal_error' });
    }
}
