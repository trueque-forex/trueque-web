
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { useSwap } from '../context/SwapContext';
import { useRequireAuth } from '../hooks/useRequireAuth';

// GLOBAL COMPLIANCE ENGINE
interface TaxRule {
    label: string;
    rate: number;
}
interface CountryCompliance {
    name: string;
    rules: TaxRule[];
}
const COMPLIANCE_REGISTRY: Record<string, CountryCompliance> = {
    'ARS': {
        name: 'Argentina',
        rules: [
            { label: 'Impuesto Créditos/Débitos', rate: 0.006 },
            { label: 'Ingresos Brutos (IIBB)', rate: 0.00 }
        ]
    },
    'BRL': { name: 'Brazil', rules: [{ label: 'IOF', rate: 0.0038 }] },
    'EUR': { name: 'Eurozone', rules: [] },
    'USD': { name: 'United States', rules: [] },
    'MXN': { name: 'Mexico', rules: [{ label: 'SPEI Fee', rate: 0.00 }, { label: 'IVA', rate: 0.16 }] }
};

const GATEWAY_PROCESSING_COST = 2.50;
const TRUEQUE_PLATFORM_FEE = 0.005;
const RETAILER_VOUCHER_FEE = 2.00;
const CARD_DEBIT_INBOUND_PCT = 0.015;
const CARD_DEBIT_LIQUIDITY_PCT = 0.005;
const CARD_CREDIT_INBOUND_PCT = 0.029;
const CARD_CREDIT_LIQUIDITY_PCT = 0.015;
const CARD_FIXED_FEE = 0.30;

const Tooltip = ({ text }: { text: string }) => (
    <span title={text} style={{ cursor: 'help', marginLeft: '6px', color: '#bdc3c7', fontSize: '14px' }}>ⓘ</span>
);
const currencyFmt = (amount: number) =>
    amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SwapSummaryPage() {
    useRequireAuth();
    const router = useRouter();
    const { swapIntent, beneficiary: contextBeneficiary, validateSwapLimit } = useSwap();
    const { from: qFrom, to: qTo, methodType, methodLabel, methodLast4, methodCardType } = router.query;

    // Hydration Helper
    const resolveBeneficiary = () => {
        if (contextBeneficiary) return contextBeneficiary;
        if (typeof window !== 'undefined') {
            try { return JSON.parse(localStorage.getItem('selected_beneficiary') || 'null'); } catch { }
        }
        return null;
    };
    const effectiveBeneficiary = resolveBeneficiary();

    const resolveSwapIntent = () => {
        if (swapIntent) return swapIntent;
        if (typeof window !== 'undefined') {
            try {
                const s = JSON.parse(localStorage.getItem('trueque_swap_state_persistent') || 'null');
                if (s) return { amount: parseFloat(s.amount), currencyTo: (s.currencyTo || '').split('-')[1] };
            } catch { }
        }
        return {};
    };
    const effectiveSwapIntent: any = resolveSwapIntent();

    const [loading, setLoading] = useState(false);
    const [breakdown, setBreakdown] = useState({
        principalSource: 0,
        grossReceive: 0,
        inboundFee: 0,
        liquidityFee: 0,
        gatewayFee: 0,
        outboundFee: 0,
        retailerFee: 0,
        platformFee: 0,
        appliedTaxes: [] as { label: string, amountSource: number }[],
        totalFeesSource: 0,
        totalToPaySource: 0,
        cardFixedFee: 0
    });
    const [holidayModeCountry, setHolidayModeCountry] = useState<string | null>(null);

    // FETCH: Holiday Config
    useEffect(() => {
        fetch('/api/config/status')
            .then(res => res.json())
            .then(data => setHolidayModeCountry(data.holiday_mode))
            .catch(err => console.error("Failed to fetch holiday status", err));
    }, []);

    // Calculation Logic
    useEffect(() => {
        const amount = effectiveSwapIntent?.amount || parseFloat(router.query.amountIntent as string) || 0;
        const rate = effectiveSwapIntent?.rate || parseFloat(router.query.rate as string) || 1050.00;
        const toCurrency = (effectiveSwapIntent?.currencyTo || qTo || 'ARS') as string;

        if (!amount || !rate) return;

        let principalSource = 0;
        let grossReceive = 0;

        if (toCurrency === 'ARS' && amount > 5000) {
            grossReceive = amount;
            principalSource = amount / rate;
        } else {
            principalSource = amount;
            grossReceive = amount * rate;
        }

        const isCard = methodType === 'CARD';
        const isCredit = methodCardType === 'credit';
        const deliveryMethod = effectiveBeneficiary?.banking?.deliveryMethod || 'bank_rtp';
        const isVoucher = effectiveSwapIntent?.offerType === 'retail_voucher' || effectiveSwapIntent?.offerType === 'merchant_voucher';

        let inboundPctFee = 0;
        let cardFixedFee = 0;
        let liquidityFee = 0;

        if (isCard) {
            const iPct = isCredit ? CARD_CREDIT_INBOUND_PCT : CARD_DEBIT_INBOUND_PCT;
            let lPct = isCredit ? CARD_CREDIT_LIQUIDITY_PCT : CARD_DEBIT_LIQUIDITY_PCT;

            // HOLIDAY MODE CHECK
            if (holidayModeCountry && holidayModeCountry === toCurrency) {
                lPct *= 2.0;
            }

            inboundPctFee = principalSource * iPct;
            cardFixedFee = CARD_FIXED_FEE;
            liquidityFee = principalSource * lPct;
        }

        const gatewayFee = GATEWAY_PROCESSING_COST;
        const platformFee = principalSource * TRUEQUE_PLATFORM_FEE;
        let outboundFee = 0;
        if (deliveryMethod === 'card_push') outboundFee = principalSource * 0.015;
        else if (deliveryMethod === 'wallet') outboundFee = 0.50;

        let retailerFee = 0;
        if (isVoucher) {
            outboundFee = 0;
            retailerFee = RETAILER_VOUCHER_FEE;
        }

        if (toCurrency === 'ARS') {
            COMPLIANCE_REGISTRY['ARS'].rules = [
                { label: 'ARS Bank Tax (0.6%)', rate: 0.006 },
                { label: 'Ingresos Brutos (IIBB)', rate: 0.00 }
            ];
        }

        const compliance = COMPLIANCE_REGISTRY[toCurrency] || { rules: [] };
        const appliedTaxes = compliance.rules
            .map(rule => {
                const destTaxAmount = grossReceive * rule.rate;
                const sourceTaxAmount = destTaxAmount / rate;
                return { label: rule.label, amountSource: sourceTaxAmount };
            })
            .filter(t => t.amountSource > 0);

        const matchTaxesTotal = appliedTaxes.reduce((acc, t) => acc + t.amountSource, 0);
        const totalFeesSource = inboundPctFee + cardFixedFee + liquidityFee + gatewayFee + outboundFee + retailerFee + platformFee + matchTaxesTotal;
        const totalToPaySource = principalSource + totalFeesSource;

        setBreakdown({
            principalSource, grossReceive, inboundFee: inboundPctFee, liquidityFee,
            gatewayFee, outboundFee, retailerFee, platformFee, appliedTaxes,
            totalFeesSource, totalToPaySource, cardFixedFee
        });

    }, [effectiveSwapIntent, router.query, effectiveBeneficiary, qTo, methodType, methodCardType, holidayModeCountry]);

    const [showMFA, setShowMFA] = useState(false);
    const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
    const [mfaError, setMfaError] = useState('');
    const [method, setMethod] = useState<'whatsapp' | 'sms'>('whatsapp');
    const mfaInputs = useRef<(HTMLInputElement | null)[]>([]);

    const handleMfaInput = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...mfaCode];
        newCode[index] = value.slice(-1);
        setMfaCode(newCode);
        if (value && index < 5 && mfaInputs.current[index + 1]) {
            mfaInputs.current[index + 1]?.focus();
        }
    };

    const processSwap = async () => {
        setLoading(true);
        try {
            const s = JSON.parse(localStorage.getItem('trueque_session') || '{}');
            const name = s.firstName || s.email?.split('@')[0] || 'Joao';
            const brandedId = `${name.toUpperCase()} TID`;

            const payload = {
                amount: breakdown.totalToPaySource,
                currencyFrom: 'EUR',
                currencyTo: swapIntent?.currencyTo || qTo,
                beneficiaryId: effectiveBeneficiary?.id,
                provider: swapIntent?.provider
            };

            const res = await fetch('/api/swaps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Swap failed');

            s.txCount = (s.txCount || 0) + 1;
            localStorage.setItem('trueque_session', JSON.stringify(s));

            router.push({
                pathname: '/secure-swap',
                query: {
                    transactionId: brandedId,
                    amountTotal: breakdown.totalToPaySource.toFixed(2),
                    amountPrincipal: breakdown.principalSource.toFixed(2),
                    amountFees: breakdown.totalFeesSource.toFixed(2),
                    currency: 'EUR',
                    tid: brandedId,
                    amountReceive: breakdown.grossReceive.toFixed(2),
                    currencyTo: swapIntent?.currencyTo || qTo,
                    methodType: methodType || 'RTP',
                    init: 'true'
                }
            });
        } catch (e) {
            console.error(e);
            alert('Transaction failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        // 1. GUARDRAIL CHECK
        // Allow APPROVED users to bypass limit checks
        const s = JSON.parse(localStorage.getItem('trueque_session') || '{}');
        const isApproved = (s.kycStatus || '').toUpperCase() === 'APPROVED';

        if (!isApproved) {
            const guard = validateSwapLimit ? validateSwapLimit(breakdown.totalToPaySource) : { allowed: true };
            if (!guard.allowed) {
                alert(guard.reason || "Transaction limit exceeded.");
                return;
            }
        }
        setShowMFA(true);
    };

    const handleVerifyMFA = () => {
        const fullCode = mfaCode.join('');
        if (fullCode === '123456') {
            setShowMFA(false);
            processSwap();
        } else {
            setMfaError('Invalid code. Try 123456');
        }
    };

    const isVoucher = swapIntent?.offerType === 'retail_voucher' || swapIntent?.offerType === 'merchant_voucher';
    const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: '#57606f' };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
            <Header />
            <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>

                {/* BACK BUTTON */}
                <button
                    onClick={() => router.push({ pathname: '/funding-method', query: router.query })}
                    style={{
                        background: 'none', border: 'none', color: '#333', fontSize: '14px', fontWeight: '600',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px'
                    }}
                >
                    ← Change Funding Method
                </button>

                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '30px' }}>Review & Confirm</h2>

                    {/* SUMMARY CARDS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '30px', marginBottom: '30px' }}>

                        {/* 1. BENEFICIARY */}
                        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '1px solid #e1e8ed' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', textTransform: 'uppercase', color: '#95a5a6' }}>Beneficiary</h4>
                            <div style={{ fontWeight: 'bold' }}>{effectiveBeneficiary?.name}</div>
                            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>{effectiveBeneficiary?.bank_name} • {effectiveBeneficiary?.account_type}</div>
                        </div>

                        {/* 2. FUNDING METHOD (READ ONLY) */}
                        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '1px solid #e1e8ed', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ fontSize: '28px' }}>{methodType === 'RTP' ? '🏦' : '💳'}</div>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{methodLabel}</div>
                                <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                                    {methodType === 'RTP' ? 'Linked Bank Account' : `${(methodCardType || 'Debit').toString().toUpperCase()} •••• ${methodLast4}`}
                                </div>
                            </div>
                            <div style={{ marginLeft: 'auto', color: '#27ae60', fontSize: '12px', fontWeight: 'bold', background: '#eafaf1', padding: '4px 8px', borderRadius: '4px' }}>VERIFIED</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '700', color: '#2c3e50', border: '1px solid #dcdde1', textAlign: 'center' }}>
                        Effective Rate: 1 EUR = {(breakdown.principalSource > 0 ? (breakdown.grossReceive / breakdown.totalToPaySource).toFixed(2) : '0.00')} {swapIntent?.currencyTo || 'ARS'} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#7f8c8d' }}>(includes all friction)</span>
                    </div>

                    {/* COST BREAKDOWN */}
                    <div style={{ backgroundColor: '#fdfdfd', border: '1px solid #e1e8ed', borderRadius: '12px', padding: '24px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2c3e50' }}>Transaction Breakdown</h3>

                        <div style={{ ...rowStyle, fontSize: '16px', marginBottom: '10px' }}>
                            <span>Swap Amount <span style={{ fontSize: '11px', color: '#7f8c8d', background: '#ecf0f1', padding: '2px 6px', borderRadius: '4px' }}>SACRED</span></span>
                            <span style={{ fontWeight: '600', color: '#2c3e50' }}>€{currencyFmt(breakdown.principalSource)}</span>
                        </div>

                        <div style={{ ...rowStyle, fontSize: '16px', marginBottom: '20px', color: '#27ae60' }}>
                            <span style={{ fontWeight: '600' }}>Beneficiary Receives (Sacred)</span>
                            <span style={{ fontWeight: '800' }}>{currencyFmt(breakdown.grossReceive)} {swapIntent?.currencyTo || 'ARS'}</span>
                        </div>

                        {/* TOTAL COST */}
                        <div style={{ ...rowStyle, color: '#e67e22', fontWeight: 'bold', fontSize: '16px' }}>
                            <span>Total Additional Cost (Friction)</span>
                            <span>+ €{currencyFmt(breakdown.totalFeesSource)}</span>
                        </div>

                        <div style={{ borderTop: '1px solid #eee', margin: '15px 0' }}></div>

                        {/* FEES */}
                        <div style={rowStyle}>
                            <span>Inbound Fuel ({(breakdown as any).inboundFee > 0 ? 'Variable' : 'Free'}) <Tooltip text="The cost your bank or local payment app charges to move your money into the system" /></span>
                            <span style={{ color: '#2c3e50' }}>+ €{currencyFmt(breakdown.inboundFee)}</span>
                        </div>
                        {(breakdown as any).cardFixedFee > 0 && <div style={rowStyle}><span>Card Proc. <Tooltip text="Network fixed fee" /></span><span>+ €{currencyFmt((breakdown as any).cardFixedFee)}</span></div>}
                        {breakdown.liquidityFee > 0 && <div style={rowStyle}>
                            <span>Instant Liquidity <Tooltip text="This covers the cost for the independent Gateway institution to advance money to your recipient immediately, even if your bank or card takes days to finish the transfer" /></span>
                            <span style={{ color: '#2c3e50' }}>+ €{currencyFmt(breakdown.liquidityFee)}</span>
                        </div>}
                        <div style={rowStyle}><span>Gateway Processing <Tooltip text="A small fee paid to an independent financial institution (the 'Gateway') that handles your money. This institution acts as a buffer to ensure your personal bank details are never shared directly with the recipient or their bank" /></span><span>+ €{currencyFmt(breakdown.gatewayFee)}</span></div>
                        <div style={rowStyle}><span>Platform Fee <Tooltip text="The cost for using the Trueque app to find the best market rate and organize your swap from start to finish" /></span><span>+ €{currencyFmt(breakdown.platformFee)}</span></div>
                        {!isVoucher && <div style={rowStyle}><span>Outbound Fuel (Delivery) <Tooltip text="The cost your bank or local payment app charges to delivery the funds to the recipient" /></span><span>+ €{currencyFmt(breakdown.outboundFee)}</span></div>}

                        {breakdown.appliedTaxes.map((tax, i) => (
                            <div key={i} style={rowStyle}><span>{tax.label} <Tooltip text="Mandatory taxes required by the government in the destination country. These are deducted by the local bank or delivery partner; Trueque does not receive or handle these funds" /></span><span>+ €{currencyFmt(tax.amountSource)}</span></div>
                        ))}

                        <div style={{ borderTop: '2px solid #e1e8ed', margin: '15px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>Total Cost to You</span>
                            <span style={{ fontSize: '24px', fontWeight: '800', color: '#2c3e50' }}>€{currencyFmt(breakdown.totalToPaySource)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        style={{
                            width: '100%', padding: '20px', marginTop: '30px', borderRadius: '12px',
                            border: 'none', backgroundColor: '#4A90E2', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                            fontSize: '18px', boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)'
                        }}
                    >
                        {loading ? 'Processing...' : `Confirm & Pay €${currencyFmt(breakdown.totalToPaySource)}`}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                        <button onClick={() => router.push('/offers')} style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}>
                            Cancel Transaction
                        </button>
                    </div>

                    {/* MFA UI - SAME AS SIGNIN */}
                    {showMFA && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                            <div style={{ background: 'white', padding: '40px', borderRadius: '16px', width: '400px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                                <div style={{ fontSize: '40px', marginBottom: '20px' }}>🔒</div>
                                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px' }}>Two-Step Verification</h2>
                                <p style={{ color: '#7f8c8d', marginBottom: '30px', lineHeight: '1.5' }}>
                                    For your security, we've sent a 6-digit code to your registered number via <strong>{method === 'whatsapp' ? 'WhatsApp' : 'SMS'}</strong>.
                                </p>

                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
                                    <button onClick={() => setMethod('whatsapp')} style={{ padding: '8px 16px', borderRadius: '20px', border: method === 'whatsapp' ? '2px solid #2ecc71' : '1px solid #e1e8ed', backgroundColor: method === 'whatsapp' ? '#e8f8f5' : 'white', color: method === 'whatsapp' ? '#27ae60' : '#95a5a6', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>WhatsApp</button>
                                    <button onClick={() => setMethod('sms')} style={{ padding: '8px 16px', borderRadius: '20px', border: method === 'sms' ? '2px solid #3498db' : '1px solid #e1e8ed', backgroundColor: method === 'sms' ? '#ebf5fb' : 'white', color: method === 'sms' ? '#2980b9' : '#95a5a6', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>SMS</button>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                    {mfaCode.map((digit, i) => (
                                        <input key={i} ref={el => { mfaInputs.current[i] = el; }} type="text" maxLength={1} value={digit} onChange={(e) => handleMfaInput(i, e.target.value)}
                                            style={{ width: '45px', height: '55px', fontSize: '24px', textAlign: 'center', borderRadius: '8px', border: mfaError ? '2px solid #e74c3c' : '2px solid #e1e8ed', outline: 'none', color: '#2c3e50', fontWeight: 'bold' }}
                                        />
                                    ))}
                                </div>
                                {mfaError && <div style={{ color: '#e74c3c', marginBottom: '20px', fontSize: '14px' }}>{mfaError}</div>}

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setShowMFA(false)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #bdc3c7', borderRadius: '8px', cursor: 'pointer', color: '#7f8c8d' }}>Cancel</button>
                                    <button onClick={handleVerifyMFA} style={{ flex: 1, padding: '14px', background: '#2c3e50', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>Verify & Swap</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
