/**
 * voucherDelivery.ts
 * 
 * Sends voucher codes to beneficiaries via WhatsApp (primary) or SMS (fallback).
 * Uses the Twilio REST API directly — no SDK dependency required.
 * 
 * In test/dev mode (no valid TWILIO_ACCOUNT_SID), logs the message instead.
 * Swap to production by adding real Twilio credentials to .env.
 */

export interface VoucherDeliveryParams {
    beneficiaryName:  string;
    beneficiaryPhone: string;  // E.164 format e.g. +521012345678
    voucherCode:      string;
    retailerName:     string;
    retailerLogo?:    string;
    amountLocal:      number;
    currency:         string;
    expiresAt:        string;
    deliveryMethod?:  'whatsapp' | 'sms';
}

export interface DeliveryResult {
    success:  boolean;
    method:   string;
    sid?:     string;
    error?:   string;
    testMode: boolean;
}

function formatPhone(phone: string): string {
    // Ensure E.164 — strip spaces, dashes, parens
    return phone.replace(/[\s\-\(\)]/g, '');
}

function buildMessage(p: VoucherDeliveryParams): string {
    const expiry = new Date(p.expiresAt).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    return [
        `🎟️ *Hola ${p.beneficiaryName}!*`,
        ``,
        `Te enviaron un vale de ${p.retailerName}:`,
        ``,
        `*Código:* \`${p.voucherCode}\``,
        `*Valor:* $${p.amountLocal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${p.currency}`,
        `*Válido hasta:* ${expiry}`,
        ``,
        `Muestra este mensaje o el código en cualquier caja de ${p.retailerName} en México.`,
        ``,
        `_Enviado con Symmetri — sin comisiones, al tipo de cambio real._`,
    ].join('\n');
}

async function sendViaTwilio(
    to: string,
    body: string,
    method: 'whatsapp' | 'sms'
): Promise<{ sid: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken  = process.env.TWILIO_AUTH_TOKEN!;
    const fromNumber = process.env.TWILIO_FROM_NUMBER || '+14155238886'; // Twilio sandbox default

    const fromFormatted = method === 'whatsapp' ? `whatsapp:${fromNumber}` : fromNumber;
    const toFormatted   = method === 'whatsapp' ? `whatsapp:${to}` : to;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const formData = new URLSearchParams();
    formData.append('From', fromFormatted);
    formData.append('To',   toFormatted);
    formData.append('Body', body);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type':  'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
    });

    const data = await res.json() as any;
    if (!res.ok) {
        throw new Error(`Twilio error ${data.code}: ${data.message}`);
    }

    return { sid: data.sid };
}

export async function deliverVoucher(params: VoucherDeliveryParams): Promise<DeliveryResult> {
    const phone  = formatPhone(params.beneficiaryPhone);
    const body   = buildMessage(params);
    const method = params.deliveryMethod ?? 'whatsapp';

    const accountSid     = process.env.TWILIO_ACCOUNT_SID || '';
    const isTestMode     = !accountSid || accountSid.startsWith('test_') || accountSid === 'YOUR_TWILIO_ACCOUNT_SID';

    if (isTestMode) {
        // ─── TEST MODE: log to console, no real message sent ───────────────────
        console.log('\n══════════════════════════════════════════');
        console.log('[VOUCHER DELIVERY — TEST MODE]');
        console.log(`Method : ${method.toUpperCase()}`);
        console.log(`To     : ${phone}`);
        console.log(`Message:\n${body}`);
        console.log('══════════════════════════════════════════\n');

        return { success: true, method, testMode: true };
    }

    // ─── PRODUCTION: try WhatsApp, fall back to SMS ─────────────────────────
    try {
        const { sid } = await sendViaTwilio(phone, body, 'whatsapp');
        return { success: true, method: 'whatsapp', sid, testMode: false };
    } catch (waErr: any) {
        console.warn('[DELIVERY] WhatsApp failed, falling back to SMS:', waErr.message);
        try {
            const { sid } = await sendViaTwilio(phone, body, 'sms');
            return { success: true, method: 'sms', sid, testMode: false };
        } catch (smsErr: any) {
            console.error('[DELIVERY] SMS fallback also failed:', smsErr.message);
            return { success: false, method: 'sms', error: smsErr.message, testMode: false };
        }
    }
}
