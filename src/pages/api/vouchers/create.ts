import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';

const MIN_ORDER_VALUE = 20.00;

/**
 * POST /api/vouchers/create
 * 
 * Proxies voucher creation directly to FastAPI which acts as the sole data orchestrator.
 * Explicitly structures the bilateral payload based on cookies/request state.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const session = (req as any).session as TruequeSession;
    const ownerId = session.user.id;

    const {
        retailer_id,
        amount_usd,
        payment_method,
        destination_market,
        destination_currency
    } = req.body;

    if (!retailer_id || !amount_usd) {
        return res.status(400).json({ error: 'Missing required fields: retailer_id, amount_usd' });
    }

    const amountNum = parseFloat(amount_usd);
    if (isNaN(amountNum) || amountNum < MIN_ORDER_VALUE) {
        return res.status(400).json({
            error: `Minimum voucher amount is $${MIN_ORDER_VALUE.toFixed(2)}. You entered $${(amountNum || 0).toFixed(2)}.`
        });
    }

    // 1. Bilateral State Resolution
    const originMarket = req.cookies['symmetri_market'] || 'US';
    const originCurrency = originMarket === 'ES' ? 'EUR' : 'USD';
    
    // Resolve destination from body, then cookies, fallback to MX
    const destMarket = destination_market || req.cookies['symmetri_dest'] || 'MX';
    const destCurrency = destination_currency || (destMarket === 'CO' ? 'COP' : destMarket === 'DO' ? 'DOP' : destMarket === 'GT' ? 'GTQ' : 'MXN');

    // 2. Strict Bilateral Payload Construction
    const payload = {
        sender_id: ownerId,
        origin_market: originMarket,
        origin_currency: originCurrency,
        destination_market: destMarket,
        destination_currency: destCurrency,
        amount_origin: amountNum,
        retailer_id: retailer_id,
        payment_success_token: "tok_simulated_success", // Simulated token for Synchronous Lock
        beneficiary_id: null
    };

    // 3. Proxy to FastAPI
    try {
        const fastApiRes = await fetch('http://127.0.0.1:8000/api/transactions/voucher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await fastApiRes.json();

        if (!fastApiRes.ok) {
            console.error('[vouchers/create] FastAPI rejected payload:', data);
            return res.status(fastApiRes.status).json({ error: data.detail || 'FastAPI Error' });
        }

        return res.status(201).json({
            success: true,
            fastapi_response: data,
            summary: {
                amount_origin: amountNum,
                origin_currency: originCurrency,
                destination_market: destMarket,
                retailer_id: retailer_id,
                payment_method
            }
        });

    } catch (err: any) {
        console.error('[vouchers/create] Proxy Error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

export default withAuth(handler);
