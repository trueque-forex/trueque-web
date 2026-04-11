import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import retailers from '../config/retailers.json';

const CARD_FEE_PCT  = 0.029;
const CARD_FIXED_FEE = 0.30;
/** RTP rail fee: 0.95% of transfer, $0.50 min, $5.00 cap. Added on top — beneficiary receives full intended amount. */
const RTP_FEE_PCT  = 0.0095;
const RTP_MIN_FEE  = 0.50;
const RTP_MAX_FEE  = 5.00;
/**
 * Minimum floor: $20.00.
 * Rationale: Symmetri earns ~15% retailer commission. At $20 → $3.00/tx covers
 * infrastructure (DB, SMS/WhatsApp delivery, ops overhead). Sub-$20 transactions
 * are loss-making until a micro-tx fee or higher retailer commission is negotiated.
 * Revisit when monthly volume > 10,000 transactions.
 */
const MIN_ORDER_VALUE = 20.00;
/** Standard (non-KYC) per-transaction ceiling. Based on Banxico avg. remittance data. */
const MAX_PER_TX_USD  = 250.00;
/** Standard (non-KYC) rolling 30-day cap. Covers a family of 3 food budget in Mexico. */
const MAX_MONTHLY_USD = 750.00;

type Retailer = typeof retailers[0];

export default function VoucherPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1=retailer, 2=amount+payment, 3=beneficiary, 4=confirm
    // Saved payment method — masked label stored in localStorage between sessions
    const [savedPayment, setSavedPayment] = useState<{ type: 'ach' | 'card' | 'zelle'; label: string } | null>(null);
    const [usingSaved, setUsingSaved] = useState(false); // true = user is using their saved method
    const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
    const [amountUSD, setAmountUSD] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'ach' | 'rtp' | 'card' | 'zelle' | null>(null);
    const [liveRate, setLiveRate] = useState<number | null>(null);
    const [rateSource, setRateSource] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // Step 3: Beneficiary
    const [beneficiaryName, setBeneficiaryName] = useState('');
    const [beneficiaryPhone, setBeneficiaryPhone] = useState('');
    const [phoneCode, setPhoneCode] = useState('+52'); // MX default
    const [isSelf, setIsSelf] = useState(false);
    // Payment method details
    const [zelleConfirmed, setZelleConfirmed] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardName, setCardName] = useState('');
    const [bankRouting, setBankRouting] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankAccountType, setBankAccountType] = useState<'checking' | 'savings'>('checking');
    const [bankHolderName, setBankHolderName] = useState('');

    // Monthly usage state
    const [monthlyUsed, setMonthlyUsed]       = useState(0);
    const [monthlyLimit, setMonthlyLimit]     = useState(MAX_MONTHLY_USD);
    const [usageLoaded, setUsageLoaded]       = useState(false);

    // Load saved payment method from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('symmetri_saved_payment');
            if (saved) setSavedPayment(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    // Fetch rolling 30-day usage on mount
    useEffect(() => {
        fetch('/api/vouchers/monthly-usage', { credentials: 'include' })
            .then(r => r.json())
            .then(d => {
                if (typeof d.used === 'number') setMonthlyUsed(d.used);
                if (typeof d.limit === 'number') setMonthlyLimit(d.limit);
                setUsageLoaded(true);
            })
            .catch(() => setUsageLoaded(true)); // fail open — don't block the user
    }, []);

    // Fetch live rate when retailer is selected
    useEffect(() => {
        if (!selectedRetailer) return;
        fetch(`/api/rate?from=USD&to=${selectedRetailer.currency}`)
            .then(r => r.json())
            .then(d => {
                setLiveRate(d.rate);
                setRateSource(d.source || 'OpenExchangeRates');
            })
            .catch(() => setLiveRate(null));
    }, [selectedRetailer]);

    const amountNum = parseFloat(amountUSD) || 0;
    // Effective minimum is the higher of the global floor or the retailer's own minimum
    const effectiveMin = selectedRetailer ? Math.max(MIN_ORDER_VALUE, selectedRetailer.minUSD) : MIN_ORDER_VALUE;
    // Effective per-transaction max: lower of retailer max and our $250 cap
    const effectiveMax = selectedRetailer
        ? Math.min(MAX_PER_TX_USD, selectedRetailer.maxUSD)
        : MAX_PER_TX_USD;
    // Remaining monthly budget for this user
    const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
    // Final allowed max for THIS transaction: can't exceed monthly budget either
    const allowedMax = Math.min(effectiveMax, monthlyRemaining);
    // Flag states
    const exceedsPerTx   = amountNum > effectiveMax;
    const exceedsMonthly = amountNum > monthlyRemaining;
    // Fee on top — beneficiary always gets full amountNum; sender pays amountNum + fee
    const rtpFeeRaw     = amountNum > 0 ? Math.min(Math.max(amountNum * RTP_FEE_PCT, RTP_MIN_FEE), RTP_MAX_FEE) : 0;
    const rtpFee        = parseFloat(rtpFeeRaw.toFixed(2));
    const cardFeeRaw    = amountNum > 0 ? (amountNum * CARD_FEE_PCT) + CARD_FIXED_FEE : 0;
    const cardFee       = parseFloat(cardFeeRaw.toFixed(2));
    const processorFee  = paymentMethod === 'card' ? cardFee : paymentMethod === 'rtp' ? rtpFee : 0;
    // Always show fee previews regardless of selected method (for option labels)
    const cardFeePreview = amountNum > 0 ? cardFee : null;
    const rtpFeePreview  = amountNum > 0 ? rtpFee  : null;
    // Total the sender pays = intended amount + gateway fee (beneficiary always gets full amountNum)
    const totalCharged  = parseFloat((amountNum + processorFee).toFixed(2));
    const amountLocal   = liveRate ? parseFloat((amountNum * liveRate).toFixed(2)) : 0;
    const zelleHandle     = process.env.NEXT_PUBLIC_ZELLE_HANDLE || 'payments@symmetri.app';
    const zelleDisplayName = process.env.NEXT_PUBLIC_ZELLE_DISPLAY_NAME || 'Symmetri';
    // Gate: is the selected payment method fully filled in?
    const zelleReady  = paymentMethod === 'zelle' && zelleConfirmed;
    const cardReady   = paymentMethod === 'card'  && cardNumber.replace(/\s/g,'').length >= 15 && cardExpiry.length >= 4 && cardCvv.length >= 3 && cardName.trim().length > 1;
    const achReady    = (paymentMethod === 'ach' || paymentMethod === 'rtp') && bankRouting.length === 9 && bankAccount.length >= 4 && bankHolderName.trim().length > 1;
    // usingSaved counts as ready as long as the payment type is set (Zelle still needs checkbox)
    const paymentReady = (usingSaved && paymentMethod !== null && (paymentMethod !== 'zelle' || zelleConfirmed)) || zelleReady || cardReady || achReady;

    const handlePurchase = async () => {
        setError('');
        setLoading(true);
        try {
            const userId = (user as any)?.id || (user as any)?.userId;
            if (!userId) { router.push('/signin'); return; }

            const fullPhone = isSelf ? ((user as any)?.phone || '') : `${phoneCode}${beneficiaryPhone.replace(/^0/, '')}`;
            const fullName  = isSelf ? `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() : beneficiaryName.trim();

            const res = await fetch('/api/vouchers/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    retailer_id: selectedRetailer!.id,
                    amount_usd: amountNum,
                    payment_method: paymentMethod,
                    beneficiary_name:  fullName,
                    beneficiary_phone: fullPhone,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Purchase failed');

            // Save masked payment label for next session (never save raw numbers)
            if (paymentMethod && paymentMethod !== 'zelle') {
                const maskedLabel =
                    paymentMethod === 'card'
                        ? `Card ****${cardNumber.replace(/\s/g, '').slice(-4)}`
                        : `ACH ****${bankAccount.slice(-4)}`;
                const toSave = { type: paymentMethod, label: maskedLabel };
                try { localStorage.setItem('symmetri_saved_payment', JSON.stringify(toSave)); } catch { /* ignore */ }
                setSavedPayment(toSave);
            }

            router.push({
                pathname: '/voucher-success',
                query: {
                    code: data.voucher.code,
                    id: data.voucher.id,
                    retailer: selectedRetailer!.name,
                    amountLocal: data.summary.amount_local,
                    currency: data.summary.local_currency,
                    amountUsd: data.summary.amount_usd,
                    total: data.summary.total_charged,
                    paymentMethod: paymentMethod,
                    expiresAt: data.voucher.expires_at,
                    beneficiaryName: fullName,
                    beneficiaryPhone: fullPhone,
                },
            });
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: "'Inter', sans-serif" }}>
            <Head>
                <title>Symmetri | Send a Voucher</title>
                <meta name="description" content="Send money to your family in Mexico as a retailer voucher. Mid-market rate, no Symmetri fees." />
            </Head>
            <Header />
            <main style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px' }}>

                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#7c3aed', letterSpacing: '0.1em', marginBottom: '8px' }}>
                        Phase 1 · Closed-Loop Voucher
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px' }}>
                        Send a Voucher
                    </h1>
                    <p style={{ color: '#64748b', margin: 0 }}>
                        Your family receives a retailer code at the <strong>mid-market rate</strong>. No Symmetri fees.
                    </p>
                </div>

                {/* Step Indicator */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                    {(['1. Choose Retailer', '2. Set Amount', '3. Beneficiary', '4. Confirm']).map((label, i) => (
                        <div key={i} style={{
                            flex: 1, padding: '8px', textAlign: 'center', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                            background: step > i + 1 ? '#dcfce7' : step === i + 1 ? '#7c3aed' : '#e2e8f0',
                            color: step > i + 1 ? '#166534' : step === i + 1 ? 'white' : '#94a3b8',
                        }}>{step > i + 1 ? '✓ ' : ''}{label}</div>
                    ))}
                </div>

                {/* ── STEP 1: Choose Retailer ── */}
                {step === 1 && (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {(retailers as Retailer[]).map(r => (
                            <button key={r.id} onClick={() => { setSelectedRetailer(r); setStep(2); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'white', border: '2px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = '#7c3aed')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
                                <span style={{ fontSize: '36px' }}>{r.logo}</span>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b' }}>{r.name}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{r.description}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>${r.minUSD}–${r.maxUSD} USD</div>
                                </div>
                                <span style={{ marginLeft: 'auto', color: '#c7d2fe' }}>›</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* ── STEP 2: Amount + Payment Method ── */}
                {step === 2 && selectedRetailer && (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '20px', padding: 0 }}>← Change retailer</button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                            <span style={{ fontSize: '28px' }}>{selectedRetailer.logo}</span>
                            <div>
                                <div style={{ fontWeight: '700', color: '#1e293b' }}>{selectedRetailer.name}</div>
                                <div style={{ fontSize: '13px', color: '#64748b' }}>{selectedRetailer.description}</div>
                            </div>
                        </div>

                        {/* Amount input — this is what the BENEFICIARY receives, not what sender pays */}
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Beneficiary receives (USD)</label>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 8px' }}>Enter the amount your beneficiary should receive. Gateway fees are added on top.</p>
                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#94a3b8' }}>$</span>
                            <input
                                id="voucher-amount-input"
                                type="number"
                                min={effectiveMin}
                                max={allowedMax}
                                value={amountUSD}
                                onChange={e => setAmountUSD(e.target.value)}
                                placeholder={`${effectiveMin} – ${allowedMax}`}
                                style={{ width: '100%', padding: '14px 16px 14px 36px', fontSize: '24px', fontWeight: '800', border: `2px solid ${exceedsPerTx || exceedsMonthly ? '#ef4444' : '#7c3aed'}`, borderRadius: '12px', outline: 'none', boxSizing: 'border-box' as const, color: '#1e293b' }}
                            />
                        </div>

                        {/* Usage meter — always visible once loaded */}
                        {usageLoaded && (
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                                    <span>Monthly allowance used</span>
                                    <span style={{ fontWeight: '700', color: monthlyUsed >= monthlyLimit * 0.8 ? '#f59e0b' : '#64748b' }}>
                                        ${monthlyUsed.toFixed(0)} / ${monthlyLimit.toFixed(0)} USD
                                    </span>
                                </div>
                                <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: '99px',
                                        width: `${Math.min(100, (monthlyUsed / monthlyLimit) * 100)}%`,
                                        background: monthlyUsed >= monthlyLimit * 0.8 ? '#f59e0b' : '#27ae60',
                                        transition: 'width 0.4s ease',
                                    }} />
                                </div>
                                {exceedsPerTx && (
                                    <div style={{ marginTop: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: '#dc2626', fontWeight: '600' }}>
                                        ⚠️ Standard accounts can send up to ${effectiveMax.toFixed(0)} per transaction.
                                        To send more, <a href="/kyc" style={{ color: '#dc2626' }}>verify your identity</a>.
                                    </div>
                                )}
                                {!exceedsPerTx && exceedsMonthly && monthlyRemaining > 0 && (
                                    <div style={{ marginTop: '8px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', fontSize: '13px', color: '#b45309', fontWeight: '600' }}>
                                        ⚠️ You have ${monthlyRemaining.toFixed(2)} remaining this month.
                                        To unlock higher limits, <a href="/kyc" style={{ color: '#b45309' }}>verify your identity</a>.
                                    </div>
                                )}
                                {monthlyRemaining <= 0 && (
                                    <div style={{ marginTop: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: '#dc2626', fontWeight: '600' }}>
                                        🚫 Monthly allowance reached. <a href="/kyc" style={{ color: '#dc2626' }}>Verify your identity</a> to send more.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Smart warning: card fee is disproportionate on small amounts */}
                        {paymentMethod === 'card' && amountNum > 0 && amountNum < 15 && (
                            <div style={{ marginBottom: '12px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', fontSize: '12px', color: '#b45309', fontWeight: '600' }}>
                                💡 Card fee on ${amountNum.toFixed(2)}: ~${cardFeePreview?.toFixed(2)} ({((cardFeePreview ?? 0) / amountNum * 100).toFixed(0)}% effective rate).
                                Consider <strong>ACH or Zelle</strong> — free for small amounts.
                            </div>
                        )}

                        {/* Live rate preview — shown once a valid amount is entered */}
                        {amountNum >= effectiveMin && liveRate && (
                            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', marginBottom: '24px', border: '1px solid #bbf7d0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#15803d', fontSize: '14px', fontWeight: '600' }}>Beneficiary receives</span>
                                    <strong style={{ color: '#15803d', fontSize: '18px' }}>{amountLocal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedRetailer.currency}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#86efac', marginBottom: '8px' }}>
                                    <span>Mid-market rate · {rateSource}</span>
                                    <span>1 USD = {liveRate.toFixed(4)} {selectedRetailer.currency}</span>
                                </div>
                                {processorFee > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderTop: '1px solid #bbf7d0', marginTop: '6px', color: '#166534' }}>
                                        <span>
                                            {paymentMethod === 'card' ? 'Card issuer fee (Visa/MC/Amex)' : 'RTP rail fee'}
                                        </span>
                                        <span style={{ fontWeight: '700', color: '#dc2626' }}>+ ${processorFee.toFixed(2)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: processorFee > 0 ? '#fef9c3' : '#dcfce7', borderRadius: '8px', marginTop: '8px', fontSize: '13px', fontWeight: '700' }}>
                                    <span style={{ color: '#1e293b' }}>You pay total</span>
                                    <span style={{ color: '#1e293b', fontSize: '15px' }}>${totalCharged.toFixed(2)} USD</span>
                                </div>
                                <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: '600', color: '#166534', textAlign: 'center' }}>
                                    ✓ Zero Symmetri fees · Beneficiary gets full ${amountNum.toFixed(2)}
                                </div>
                            </div>
                        )}

                        {/* ── SAVED PAYMENT (one-click re-use) ── */}
                        {savedPayment && amountNum >= effectiveMin && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                    Saved payment method
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '16px 20px', borderRadius: '14px', cursor: 'pointer',
                                    border: `2px solid ${usingSaved ? '#7c3aed' : '#e2e8f0'}`,
                                    background: usingSaved ? '#faf5ff' : '#f8fafc',
                                    transition: 'border-color 0.15s',
                                }}
                                    onClick={() => {
                                        setUsingSaved(true);
                                        setPaymentMethod(savedPayment.type);
                                        setZelleConfirmed(false);
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '22px' }}>
                                            {savedPayment.type === 'card' ? '💳' : savedPayment.type === 'rtp' ? '⚡' : savedPayment.type === 'ach' ? '🏦' : '💚'}
                                        </span>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{savedPayment.label}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Saved from last payment</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {usingSaved && (
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#7c3aed' }}>✓ Selected</span>
                                        )}
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            setUsingSaved(false);
                                            setPaymentMethod(null);
                                            try { localStorage.removeItem('symmetri_saved_payment'); } catch { /* ignore */ }
                                            setSavedPayment(null);
                                        }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', textDecoration: 'underline' }}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                                {!usingSaved && (
                                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', margin: '12px 0 4px', fontWeight: '500' }}>
                                        — or choose a different method —
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment Method — hidden if using saved (unless Zelle which needs checkbox) */}
                        {(!usingSaved || savedPayment?.type === 'zelle') && (
                        <div>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>How will you pay?</label>
                        <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                            {[
                                { id: 'ach',   label: 'Bank Transfer (ACH)',    icon: '🏦', fee: 'Free',                                                                            feeColor: '#16a34a', sub: '1–2 business days · No fee' },
                                { id: 'rtp',   label: 'Instant Bank (RTP)',      icon: '⚡', fee: rtpFeePreview !== null ? `$${rtpFeePreview.toFixed(2)} fee` : '0.95% · $0.50 min', feeColor: '#b45309', sub: 'Instant (seconds) · Added on top' },
                                { id: 'card',  label: 'Debit / Credit Card',     icon: '💳', fee: cardFeePreview !== null ? `$${cardFeePreview.toFixed(2)} fee` : '2.9% + $0.30',    feeColor: '#dc2626', sub: 'Instant · Card issuer fee added on top' },
                                { id: 'zelle', label: 'Zelle',                    icon: '💚', fee: 'Free',                                                                            feeColor: '#16a34a', sub: 'Instant · Send to Symmetri Zelle' },
                            ].map(opt => (
                                <button key={opt.id}
                                    onClick={() => { setPaymentMethod(opt.id as 'ach' | 'rtp' | 'card' | 'zelle'); setZelleConfirmed(false); setUsingSaved(false); }}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: `2px solid ${paymentMethod === opt.id && !usingSaved ? '#7c3aed' : '#e2e8f0'}`, borderRadius: '12px', background: paymentMethod === opt.id && !usingSaved ? '#faf5ff' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '24px' }}>{opt.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{opt.label}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{opt.sub}</div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: opt.feeColor, flexShrink: 0 }}>{opt.fee}</span>
                                </button>
                            ))}
                        </div>

                        {/* ── ACH / RTP BANK FORM ── shared form, rail chosen by payment method */}
                        {(paymentMethod === 'ach' || paymentMethod === 'rtp') && (
                            <div style={{ background: '#f8faff', border: '2px solid #c7d2fe', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
                                <div style={{ fontWeight: '700', color: '#3730a3', fontSize: '14px', marginBottom: '4px' }}>
                                    {paymentMethod === 'rtp' ? '⚡ Bank Account — Instant RTP' : '🏦 Bank Account Details'}
                                </div>
                                {paymentMethod === 'rtp' && (
                                    <div style={{ fontSize: '12px', color: '#b45309', marginBottom: '12px', fontWeight: '500' }}>
                                        RTP rail fee of ${rtpFee.toFixed(2)} will be added on top — beneficiary gets the full ${amountNum.toFixed(2)}
                                    </div>
                                )}
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Account Holder Name</label>
                                        <input id="ach-holder-name" type="text" value={bankHolderName} onChange={e => setBankHolderName(e.target.value)}
                                            placeholder="Full name on bank account"
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #c7d2fe', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Routing Number</label>
                                            <input id="ach-routing" type="text" inputMode="numeric" maxLength={9} value={bankRouting} onChange={e => setBankRouting(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                                placeholder="9-digit routing"
                                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${bankRouting.length > 0 && bankRouting.length < 9 ? '#fbbf24' : '#c7d2fe'}`, borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Account Number</label>
                                            <input id="ach-account" type="text" inputMode="numeric" value={bankAccount} onChange={e => setBankAccount(e.target.value.replace(/\D/g, ''))}
                                                placeholder="Account number"
                                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #c7d2fe', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Account Type</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {(['checking', 'savings'] as const).map(t => (
                                                <button key={t} onClick={() => setBankAccountType(t)}
                                                    style={{ flex: 1, padding: '8px', border: `2px solid ${bankAccountType === t ? '#6366f1' : '#e2e8f0'}`, borderRadius: '8px', background: bankAccountType === t ? '#eef2ff' : 'white', fontWeight: '600', fontSize: '13px', color: bankAccountType === t ? '#4338ca' : '#64748b', cursor: 'pointer', textTransform: 'capitalize' }}>
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {achReady && <div style={{ marginTop: '10px', fontSize: '12px', color: '#16a34a', fontWeight: '600', textAlign: 'center' }}>✓ Bank details ready</div>}
                            </div>
                        )}

                        {/* ── CARD FORM ── */}
                        {paymentMethod === 'card' && (
                            <div style={{ background: '#fff8f8', border: '2px solid #fecaca', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
                                <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '14px', marginBottom: '14px' }}>💳 Card Details</div>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Cardholder Name</label>
                                        <input id="card-holder-name" type="text" value={cardName} onChange={e => setCardName(e.target.value)}
                                            placeholder="Name on card"
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Card Number</label>
                                        <input id="card-number" type="text" inputMode="numeric" value={cardNumber}
                                            onChange={e => {
                                                const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                                                setCardNumber(digits.replace(/(.{4})/g, '$1 ').trim());
                                            }}
                                            placeholder="1234 5678 9012 3456" maxLength={19}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '15px', fontFamily: 'monospace', letterSpacing: '0.06em', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Expiry (MM/YY)</label>
                                            <input id="card-expiry" type="text" inputMode="numeric" value={cardExpiry} maxLength={5}
                                                onChange={e => {
                                                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                    setCardExpiry(v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v);
                                                }}
                                                placeholder="MM/YY"
                                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>CVV</label>
                                            <input id="card-cvv" type="text" inputMode="numeric" value={cardCvv} maxLength={4}
                                                onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                placeholder="123"
                                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                </div>
                                {cardFeePreview && <div style={{ marginTop: '10px', fontSize: '12px', color: '#dc2626', fontWeight: '600', textAlign: 'center' }}>Processor fee: ${cardFeePreview.toFixed(2)} — charged by the network, not Symmetri</div>}
                                {cardReady && <div style={{ marginTop: '6px', fontSize: '12px', color: '#16a34a', fontWeight: '600', textAlign: 'center' }}>✓ Card details ready</div>}
                            </div>
                        )}

                        {/* Close payment-picker conditional */}
                        </div>)}

                        {/* ── ZELLE INSTRUCTIONS ── always shown when zelle selected */}
                        {paymentMethod === 'zelle' && amountNum >= effectiveMin && (
                            <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
                                <div style={{ fontWeight: '800', color: '#166534', fontSize: '14px', marginBottom: '12px' }}>💚 Send your Zelle payment now</div>
                                <div style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
                                    {[
                                        ['Send to (Zelle)', zelleHandle],
                                        ['Amount',          `$${amountNum.toFixed(2)} USD`],
                                        ['Memo',            `Voucher for ${beneficiaryName || 'beneficiary'}`],
                                    ].map(([label, value]) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                            <span style={{ color: '#64748b', fontWeight: '500' }}>{label}</span>
                                            <strong style={{ color: '#166534', fontFamily: 'monospace' }}>{value}</strong>
                                        </div>
                                    ))}
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 14px', background: zelleConfirmed ? '#dcfce7' : 'white', border: `2px solid ${zelleConfirmed ? '#22c55e' : '#d1fae5'}`, borderRadius: '10px' }}>
                                    <input id="zelle-confirmed-checkbox" type="checkbox" checked={zelleConfirmed} onChange={e => setZelleConfirmed(e.target.checked)}
                                        style={{ width: '18px', height: '18px', accentColor: '#22c55e', cursor: 'pointer' }} />
                                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#166534' }}>
                                        I have sent ${amountNum.toFixed(2)} via Zelle to {zelleDisplayName}
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Validation hint */}
                        {amountNum >= effectiveMin && paymentMethod && !paymentReady && (
                            <p style={{ fontSize: '12px', color: '#f59e0b', textAlign: 'center', margin: '0 0 12px', fontWeight: '600' }}>
                                {paymentMethod === 'zelle' ? 'Confirm you have sent the Zelle payment above' : `Fill in your ${paymentMethod === 'card' ? 'card' : 'bank'} details above`}
                            </p>
                        )}
                        {(!paymentMethod || !amountNum || amountNum < effectiveMin) && (
                            <p style={{ fontSize: '12px', color: '#f59e0b', textAlign: 'center', margin: '0 0 12px', fontWeight: '600' }}>
                                {!amountNum ? 'Enter an amount above' : amountNum < effectiveMin ? `Minimum voucher is $${effectiveMin.toFixed(2)} USD` : 'Select a payment method above'}
                            </p>
                        )}
                        <button
                            disabled={!amountNum || amountNum < effectiveMin || exceedsPerTx || exceedsMonthly || monthlyRemaining <= 0 || !paymentReady}
                            onClick={() => setStep(3)}
                            style={{ width: '100%', padding: '16px', background: '#7c3aed', color: 'white', fontWeight: '700', fontSize: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', opacity: (!amountNum || amountNum < effectiveMin || exceedsPerTx || exceedsMonthly || !paymentReady) ? 0.4 : 1 }}>
                            Add Beneficiary →
                        </button>
                    </div>

                )}

                {/* ── STEP 3: Beneficiary Info ── */}
                {step === 3 && (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                        <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '20px', padding: 0 }}>← Back</button>
                        <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: '#1e293b' }}>Who receives this voucher?</h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>They'll get the code on WhatsApp instantly.</p>

                        {/* Self Toggle */}
                        <button onClick={() => setIsSelf(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', border: `2px solid ${isSelf ? '#7c3aed' : '#e2e8f0'}`, borderRadius: '12px', background: isSelf ? '#faf5ff' : 'white', cursor: 'pointer', marginBottom: '20px', width: '100%', textAlign: 'left' }}>
                            <span style={{ fontSize: '22px' }}>{isSelf ? '✅' : '👤'}</span>
                            <div>
                                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>I am the beneficiary</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Send the voucher to myself</div>
                            </div>
                        </button>

                        {!isSelf && (<>
                            <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Beneficiary Full Name</label>
                            <input id="beneficiary-name" value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} placeholder="First and Last Name" style={{ width: '100%', padding: '14px 16px', fontSize: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', outline: 'none', marginBottom: '20px', boxSizing: 'border-box' }} />

                            <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>WhatsApp Number</label>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)} style={{ padding: '14px 10px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', fontWeight: '600' }}>
                                    <option value="+52">🇲🇽 +52 MX</option>
                                    <option value="+502">🇬🇹 +502 GT</option>
                                    <option value="+1-809">🇩🇴 +1-809 DO</option>
                                    <option value="+1">🇺🇸 +1 US</option>
                                    <option value="+54">🇦🇷 +54 AR</option>
                                    <option value="+55">🇧🇷 +55 BR</option>
                                    <option value="+57">🇨🇴 +57 CO</option>
                                    <option value="+58">🇻🇪 +58 VE</option>
                                    <option value="+51">🇵🇪 +51 PE</option>
                                </select>
                                <input id="beneficiary-phone" type="tel" value={beneficiaryPhone} onChange={e => setBeneficiaryPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit number" style={{ flex: 1, padding: '14px 16px', fontSize: '16px', border: '2px solid #e2e8f0', borderRadius: '12px', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 20px' }}>📱 They'll receive the voucher code via WhatsApp</p>
                        </>)}

                        <button
                            disabled={!isSelf && (!beneficiaryName.trim() || beneficiaryPhone.length < 8)}
                            onClick={() => setStep(4)}
                            style={{ width: '100%', padding: '16px', background: '#7c3aed', color: 'white', fontWeight: '700', fontSize: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', opacity: (!isSelf && (!beneficiaryName.trim() || beneficiaryPhone.length < 8)) ? 0.4 : 1 }}>
                            Review & Confirm →
                        </button>
                    </div>
                )}

                {/* ── STEP 4: Confirm ── */}
                {step === 4 && selectedRetailer && (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                        <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '24px', padding: 0 }}>← Edit</button>

                        <h2 style={{ margin: '0 0 20px', fontSize: '20px', color: '#1e293b' }}>Confirm Your Voucher</h2>

                        {/* Prominent amount verification banner */}
                        <div style={{ background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>You are sending</div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b' }}>${amountNum.toFixed(2)} <span style={{ fontSize: '16px', color: '#64748b' }}>USD</span></div>
                            </div>
                            <button onClick={() => setStep(2)} style={{ background: 'none', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✏ Edit</button>
                        </div>

                        {/* Summary */}
                        <div style={{ background: '#fafafa', borderRadius: '14px', padding: '20px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                            {[
                                ['Retailer', `${selectedRetailer.logo} ${selectedRetailer.name}`],
                                ['You send', `$${amountNum.toFixed(2)} USD`],
                                ['Beneficiary receives', `${amountLocal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${selectedRetailer.currency}`],
                                ['Exchange rate', `1 USD = ${liveRate?.toFixed(4)} ${selectedRetailer.currency}`],
                                ['Rate source', rateSource],
                                ['Symmetri fee', '✦ $0.00 — None'],
                                ['Processor fee', processorFee > 0 ? `$${processorFee.toFixed(2)}` : '$0.00 (ACH)'],
                            ].map(([label, value]) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                                    <span style={{ color: '#64748b' }}>{label}</span>
                                    <strong style={{ color: label === 'Symmetri fee' ? '#16a34a' : '#1e293b' }}>{value}</strong>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                                <span>Total you pay</span>
                                <span>${totalCharged.toFixed(2)} USD</span>
                            </div>
                        </div>

                        {error && <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

                        <button onClick={handlePurchase} disabled={loading}
                            style={{ width: '100%', padding: '18px', background: loading ? '#a78bfa' : '#7c3aed', color: 'white', fontWeight: '800', fontSize: '17px', border: 'none', borderRadius: '14px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}>
                            {loading ? 'Generating Voucher...' : `Purchase Voucher — $${totalCharged.toFixed(2)}`}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '16px' }}>
                            Voucher valid for 30 days · Redeemable at {selectedRetailer.name} locations in Mexico
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
