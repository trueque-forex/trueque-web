import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * MOCK MERCHANT (CARREFOUR) API BRIDGE
 * 
 * Logic Lock Constraint:
 * - MUST strip all Sender PII (Name, IBAN).
 * - MUST only transmit Sacred Amount & Beneficiary Phone.
 * - Source of Funds MUST be 'Trueque Gateway'.
 */

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { senderName, senderIban, sacredAmount, beneficiaryPhone, offerType } = req.body;

    // 1. PRIVACY BUFFER LOGIC (The "Logic Lock")
    // Explicitly stripping PII before "sending" to Merchant
    const merchantPayload = {
        amount: sacredAmount,
        currency: 'ARS',
        recipient_phone: beneficiaryPhone,
        source_of_funds: 'Trueque Gateway', // Hardcoded Institutional Source
        // sender_name: undefined,  <-- STRIPPED
        // sender_iban: undefined,  <-- STRIPPED
        ref: `MERCH-${Date.now()}`
    };

    // 2. LOG THE BUFFER ACTION
    console.log(`[PRIVACY BUFFER] Relaying Order to Merchant (${offerType})`);
    console.log(`[PRIVACY BUFFER] Blocked PII: ${senderName ? 'YES' : 'NO'}, ${senderIban ? 'YES' : 'NO'}`);
    console.log(`[PRIVACY BUFFER] Payload:`, JSON.stringify(merchantPayload));

    // 3. MOCK SUCCESS RESPONSE
    return res.status(200).json({
        status: 'confirmed',
        voucher_code: 'CARREFOUR-1234-5678',
        delivery: 'whatsapp',
        privacy_enforced: true
    });
}
