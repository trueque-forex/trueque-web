import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import { supabase } from '@/lib/supabaseClient'; 
import { TruequeSession } from '@/types/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end();
    }

    // 1. Real Authentication
    const session = (req as any).session as TruequeSession;

    try {
        const { amount, currencyFrom, currencyTo, payoutMethod } = req.body;
        const amountStr = String(amount);
        
        // 2. Standard Payload (Correct Architecture)
        // We send exactly what the business logic needs
        const pythonPayload = {
            amount: parseFloat(amountStr),
            // We satisfy the Pydantic schema by mirroring amount to specific fields
            amount_from: parseFloat(amountStr),
            amount_to: parseFloat(amountStr), // Assumes 1:1 for initial estimate
            currency_from: currencyFrom || 'EUR',
            currency_to: currencyTo,
            country: 'ES',
            user_id: session.user.id,
            remittance_purpose: 'FAMILY_SUPPORT',
            uuid: crypto.randomUUID() // Valid UUID for validation
        };

        // 3. Call Python Backend
        const pythonRes = await fetch('http://127.0.0.1:8000/api/offers/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pythonPayload)
        });

        if (!pythonRes.ok) {
            const errText = await pythonRes.text();
            // We LOG the error but do not throw yet, to allow debugging the schema
            console.error('Python backend error:', errText);
            throw new Error('Backend Schema Error: ' + errText);
        }

        const data = await pythonRes.json();
        const finalTxId = data.id;

        // 4. Symmetri Orchestration
        const expiresAt = new Date(Date.now() + 15 * 60000).toISOString(); 
        
        const { error: updateError } = await supabase
            .from('transactions')
            .update({
                handshake_expires_at: expiresAt,
                payout_rail: payoutMethod || 'BANK_RTP',
                inbound_verified: false 
            })
            .eq('id', finalTxId); // Match ID returned by Python

        if (updateError) console.error('[Symmetri] DB Update Failed:', updateError);

        return res.status(201).json({
            id: finalTxId,
            status: 'pending',
            message: 'Swap initiated successfully',
            expiresAt: expiresAt 
        });

    } catch (e: any) {
        console.error('Swap creation failed', e);
        return res.status(500).json({ error: e.message });
    }
}

export default withAuth(handler);