import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import { query } from '@/lib/db';
import { TruequeSession } from '@/types/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end();
    }

    const session = (req as any).session as TruequeSession;
    // DEBUG: Inspect session content
    console.log('[SWAPS] Session User:', session.user.email);

    try {
        const { amount, currencyFrom, currencyTo, beneficiaryId, provider } = req.body;

        // Use a consistent ID format for the Offer/Transaction
        const txId = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        // For the 'uuid' column in 'offers', we should probably use the User's ID or a generated Offer UUID?
        // history.py filters by uuid. If we pass user's uuid, we get user's history? 
        // Based on offer_model.py, 'uuid' is UNIQUE. So it must be the Offer UUID.
        // But history.py filters WHERE uuid = :uuid. This implies history.py expects a USER UUID.
        // Let's assume 'uuid' in the DB is the Transaction ID, and 'user_id' is the User ID.
        // But 'user_id' is Integer. session.userId is likely string (e.g. 'T...').
        // We might have a schema mismatch.
        // However, for Flow A, let's insert into 'offers' with what we have.

        // We'll use the session.userId (string) in the 'country' or 'status' column if needed, 
        // OR we just use a numeric stub for user_id.
        // Wait, offer_model.py says: user_id = Column(Integer, nullable=False)
        // We probably don't have a numeric ID for the user if we rely on 'T...' strings.
        // Let's check if we can insert '0' or hash it? or is there a 'users' table?

        // SAFE BET: Insert into 'offers'.
        // user_id: 1 (Mock for now, or fetch from DB if we have a users table)
        // uuid: txId (The public ID)
        // country: 'ES' (Derived from user or context)
        // currency_from: 'EUR'
        // currency_to: currencyTo
        // amount: amount
        // market_rate: 1.0 (or fetch)
        // timestamp: NOW()

        // Explicitly convert amount to string for precision safety
        const amountStr = String(amount);

        // Generate Idempotency Key (UUID v4)
        const idempotencyKey = crypto.randomUUID();

        // PROXY TO PYTHON BACKEND (SQLite)
        // Since backend uses SQLite and Node uses PG, we must route writes via Python API
        const pythonRes = await fetch('http://127.0.0.1:8000/api/offers/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify({
                amount: amountStr, // Precision Handshake: Send as String
                currency_from: currencyFrom || 'EUR',
                currency_to: currencyTo,
                country: 'ES', // Default for now, should be dynamic
                // MAPPING: FE 'id' (UUID string) -> BE 'user_id' (String column)
                user_id: session.user.id
            })
        });

        if (!pythonRes.ok) {
            const errText = await pythonRes.text();
            console.error('Python backend error:', errText);
            throw new Error('Backend failed to persist offer');
        }

        const data = await pythonRes.json();
        const finalTxId = data.id;

        return res.status(201).json({
            id: finalTxId,
            status: 'pending',
            message: 'Swap initiated successfully'
        });
    } catch (e: any) {
        console.error('Swap creation failed', e);
    }
}

export default withAuth(handler);


