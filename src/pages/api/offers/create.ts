// src/pages/api/offers/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import { TruequeSession } from '@/types/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();
    const session = (req as any).session as TruequeSession;

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

        // Support both camelCase and snake_case
        const amount = body.amount;
        const rate = body.rate;
        const currencyFrom = body.currencyFrom || body.currency_from;
        const currencyTo = body.currencyTo || body.currency_to;

        if (!amount || Number.isNaN(Number(amount))) {
            return res.status(400).json({ error: 'invalid_amount' });
        }

        if (!currencyFrom || !currencyTo) {
            return res.status(400).json({ error: 'missing_currencies', message: 'currencyFrom and currencyTo are required' });
        }

        // For now, if rate is null the server may apply market rate later.
        const parsedAmount = Number(amount);
        const parsedRate = rate == null ? null : Number(rate);

        // TODO: persist offer in DB and validate maker permissions/KYC if required.
        const offerId = `offer_${Date.now()}`;
        const offerUuid = `uuid_${Date.now()}`;
        const createdAt = new Date().toISOString();

        // Return payload matching mobile app expectations
        return res.status(201).json({
            id: parseInt(offerId.replace('offer_', '')),
            uuid: offerUuid,
            user_id: session.user.id,
            currency_from: currencyFrom,
            currency_to: currencyTo,
            amount: parsedAmount,
            market_rate: parsedRate || 0,
            status: currencyFrom === 'COP' ? 'matched' : 'open',
            counterparty_id: currencyFrom === 'COP' ? 'mock-counterparty-uuid' : null,
            created_at: createdAt,
            // Legacy fields for web app compatibility
            offerId,
            owner: session.user.id,
            rate: parsedRate,
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'internal_error', message: err?.message || String(err) });
    }
}

export default withAuth(handler);
