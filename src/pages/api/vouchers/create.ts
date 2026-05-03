import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { withAuth } from '../../../lib/withAuth';
import { TruequeSession } from '../../../types/auth';
import { deliverVoucher } from '../../../lib/voucherDelivery';
import retailers from '../../../config/retailers.json';

const CARD_FEE_PCT   = 0.029;
const CARD_FIXED_FEE = 0.30;
const LIQUIDITY_FEE_PCT = 0.015;
const RTP_FEE_PCT  = 0.0095;
const RTP_MIN_FEE  = 0.50;
const RTP_MAX_FEE  = 5.00;

/** GEMINI.md §3.1 — The Minimum Floor. Hard-reject any voucher below this value. */
const MIN_ORDER_VALUE = 20.00;

function generateVoucherCode(retailerId: string): string {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `SYM-${retailerId.slice(0, 4).toUpperCase()}-${ts}-${rand}`;
}

async function getLiveRate(fromCurrency: string, toCurrency: string) {
    const apiKey = process.env.OPENEXCHANGE_API_KEY;
    if (!apiKey || apiKey.startsWith('test_')) {
        return { rate: 17.50, source: 'Fallback', fallback: true };
    }
    try {
        const res  = await fetch(
            `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&symbols=${fromCurrency},${toCurrency}`,
            { signal: AbortSignal.timeout(5000) }
        );
        const data  = await res.json();
        const rates = data.rates || {};
        return { rate: rates[toCurrency] / rates[fromCurrency], source: 'OpenExchangeRates', fallback: false };
    } catch {
        return { rate: 17.50, source: 'Fallback (API error)', fallback: true };
    }
}

/**
 * POST /api/vouchers/create
 *
 * Phase 1 — Closed-loop voucher issuance.
 * Mid-market rate, zero Symmetri fees.
 * Processor fee only for card payments.
 * Delivers voucher code to beneficiary via WhatsApp (SMS fallback).
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    // User UUID from JWT-verified session — injected by withAuth. Never trust req.body.
    const session = (req as any).session as TruequeSession;
    const ownerId = session.user.id;

    const {
        retailer_id,
        amount_usd,
        payment_method,
        beneficiary_name,
        beneficiary_phone,
    } = req.body;

    if (!retailer_id || !amount_usd || !payment_method) {
        return res.status(400).json({ error: 'Missing required fields: retailer_id, amount_usd, payment_method' });
    }
    if (!beneficiary_name || !beneficiary_phone) {
        return res.status(400).json({ error: 'Missing beneficiary_name or beneficiary_phone' });
    }

    const retailer = (retailers as any[]).find(r => r.id === retailer_id);
    if (!retailer) return res.status(400).json({ error: `Unknown retailer: ${retailer_id}` });

    const amountNum = parseFloat(amount_usd);
    // GEMINI.md §3.1 — The Minimum Floor: Hard-reject any transaction where principal < MIN_ORDER_VALUE.
    if (isNaN(amountNum) || amountNum < MIN_ORDER_VALUE) {
        return res.status(400).json({
            error: `Minimum voucher amount is $${MIN_ORDER_VALUE.toFixed(2)} USD. You entered $${(amountNum || 0).toFixed(2)}.`
        });
    }
    if (amountNum < retailer.minUSD || amountNum > retailer.maxUSD) {
        return res.status(400).json({
            error: `Amount must be between $${retailer.minUSD} and $${retailer.maxUSD} USD for ${retailer.name}`
        });
    }

    try {
        // 1. Live mid-market rate — zero Symmetri markup
        const { rate, source, fallback } = await getLiveRate('USD', retailer.currency);
        const amountLocal  = parseFloat((amountNum * rate).toFixed(2));

        // 2. Fees — processor fee for card/RTP, zero Symmetri fee always
        const processorFee = payment_method === 'card'
            ? parseFloat(((amountNum * CARD_FEE_PCT) + CARD_FIXED_FEE).toFixed(2))
            : payment_method === 'rtp'
            ? parseFloat((Math.min(Math.max(amountNum * RTP_FEE_PCT, RTP_MIN_FEE), RTP_MAX_FEE)).toFixed(2))
            : 0;
        const liquidityFee = payment_method === 'card' ? parseFloat((amountNum * LIQUIDITY_FEE_PCT).toFixed(2)) : 0;
        const totalCharged = parseFloat((amountNum + processorFee + liquidityFee).toFixed(2));

        // 3. Unique voucher code
        const voucherCode = generateVoucherCode(retailer_id);

        // TODO (Stripe): Change 'ACTIVE' → 'PENDING_PAYMENT' and activate on Stripe webhook
        const result = await query(`
            INSERT INTO vouchers (
                owner_id, amount_usd, amount_local, local_currency,
                exchange_rate, processor_fee, total_charged,
                retailer_id, retailer_name, voucher_code,
                payment_method, status, rate_source, rate_fallback,
                beneficiary_name, beneficiary_phone,
                delivery_method, delivery_status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'ACTIVE',$12,$13,$14,$15,'whatsapp','PENDING')
            RETURNING id, voucher_code, status, created_at, expires_at;
        `, [
            ownerId, amountNum, amountLocal, retailer.currency,
            rate, processorFee, totalCharged,
            retailer.id, retailer.name, voucherCode,
            payment_method, source, fallback,
            beneficiary_name, beneficiary_phone,
        ]);

        const voucher = result.rows[0];

        // Phase 1 delivery model: User shares the code themselves via the success page.
        // Server-side WhatsApp (Twilio) is disabled — no per-message cost incurred.
        // Switch to deliverVoucher() when Twilio credentials are added and auto-send is desired.
        await query(
            `UPDATE vouchers SET delivery_status = 'USER_SEND', updated_at = NOW() WHERE id = $1`,
            [voucher.id]
        );
        const delivery = { success: true, method: 'user_share', testMode: false };

        return res.status(201).json({
            success: true,
            voucher: {
                id:         voucher.id,
                code:       voucher.voucher_code,
                status:     voucher.status,
                created_at: voucher.created_at,
                expires_at: voucher.expires_at,
            },
            delivery: {
                sent:     delivery.success,
                method:   delivery.method,
                testMode: delivery.testMode,
                to:       beneficiary_phone,
            },
            summary: {
                amount_usd:       amountNum,
                amount_local:     amountLocal,
                local_currency:   retailer.currency,
                retailer_name:    retailer.name,
                exchange_rate:    rate,
                rate_source:      source,
                rate_fallback:    fallback,
                processor_fee:    processorFee,
                liquidity_fee:    liquidityFee,
                symmetri_fee:     0,
                total_charged:    totalCharged,
                payment_method,
                beneficiary_name,
                beneficiary_phone,
            },
        });

    } catch (err: any) {
        console.error('[vouchers/create] Error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

export default withAuth(handler);
