import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';
import PaymentMethodForm, { PaymentData } from '../components/shared/PaymentMethodForm';
import TransactionSummary from '../components/shared/TransactionSummary';
import InlineBeneficiaryForm from '../components/shared/InlineBeneficiaryForm';

const MIN_ORDER_VALUE = 20.00;
const MAX_PER_TX_USD  = 250.00;
const MAX_MONTHLY_USD = 750.00;

type Retailer = {
    id: string;
    name: string;
    city: string;
    category: string;
    logo?: string;
    description?: string;
    minUSD: number;
    maxUSD: number;
    currency: string;
};

function getCategoryEmoji(category: string) {
    if (!category) return '🛒';
    const c = category.toLowerCase();
    if (c.includes('farmacia')) return '💊';
    if (c.includes('conveniencia')) return '🏪';
    return '🛒';
}

export default function VoucherPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1=retailer, 2=amount+payment, 3=beneficiary, 4=confirm
    // Saved payment method
    const [savedPayment, setSavedPayment] = useState<{ type: string; label: string; token?: string } | null>(null);
    const [usingSaved, setUsingSaved] = useState(false);
    
    const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
    const [countries, setCountries] = useState<any>({});
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [inboundGateways, setInboundGateways] = useState<any[]>([]);
    
    const [amountUSD, setAmountUSD] = useState('');
    
    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [isPaymentValid, setIsPaymentValid] = useState(false);
    
    const [liveRate, setLiveRate] = useState<number | null>(null);
    const [rateSource, setRateSource] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Beneficiary State
    const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
    const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
    const [isAddingBeneficiary, setIsAddingBeneficiary] = useState(false);

    // Monthly usage state
    const [monthlyUsed, setMonthlyUsed]       = useState(0);
    const [monthlyLimit, setMonthlyLimit]     = useState(MAX_MONTHLY_USD);
    const [usageLoaded, setUsageLoaded]       = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('symmetri_saved_payment');
            if (saved) setSavedPayment(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetch('/api/config/corridors')
            .then(res => res.json())
            .then(data => {
                setCountries(data);
                if (data['MX']) {
                    setSelectedCountry('MX');
                } else {
                    const keys = Object.keys(data);
                    if (keys.length > 0) setSelectedCountry(keys[0]);
                }
                
                if (data['US'] && data['US'].inbound_gateways) {
                     const gateways = Object.keys(data['US'].inbound_gateways).map(key => ({
                       id: key,
                       ...data['US'].inbound_gateways[key]
                     }));
                     setInboundGateways(gateways);
                }
            })
            .catch(err => console.error('Failed to load corridors:', err));
    }, []);

    useEffect(() => {
        fetch('/api/vouchers/monthly-usage', { credentials: 'include' })
            .then(r => r.json())
            .then(d => {
                if (typeof d.used === 'number') setMonthlyUsed(d.used);
                if (typeof d.limit === 'number') setMonthlyLimit(d.limit);
                setUsageLoaded(true);
            })
            .catch(() => setUsageLoaded(true));
    }, []);

    useEffect(() => {
        if (step >= 2 && beneficiaries.length === 0) {
            const fetchBens = async () => {
                try {
                    const res = await fetch('/api/beneficiaries');
                    if (res.ok) {
                        const data = await res.json();
                        const bens = Array.isArray(data) ? data : (data.beneficiaries || []);
                        setBeneficiaries(bens);
                    }
                } catch (err) {}
            };
            fetchBens();
        }
    }, [step]);

    useEffect(() => {
        if (!selectedRetailer) return;
        fetch(`/api/rate?from=USD&to=${selectedRetailer.currency}`)
            .then(r => r.json())
            .then(d => {
                setLiveRate(parseFloat(d.rate));
                setRateSource(d.source || 'OpenExchangeRates');
            })
            .catch(() => setLiveRate(null));
    }, [selectedRetailer]);

    const validBeneficiaries = beneficiaries.filter(b => b.country === selectedCountry);

    const amountNum = parseFloat(amountUSD) || 0;
    const effectiveMin = selectedRetailer ? Math.max(MIN_ORDER_VALUE, selectedRetailer.minUSD) : MIN_ORDER_VALUE;
    const effectiveMax = selectedRetailer ? Math.min(MAX_PER_TX_USD, selectedRetailer.maxUSD) : MAX_PER_TX_USD;
    const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
    const allowedMax = Math.min(effectiveMax, monthlyRemaining);
    
    const exceedsPerTx   = amountNum > effectiveMax;
    const exceedsMonthly = amountNum > monthlyRemaining;
    
    const selectedInbound = inboundGateways.find(g => g.id === paymentMethod);
    const inboundFeeRaw = selectedInbound ? (amountNum * selectedInbound.pct + selectedInbound.fixed) : 0;
    
    const inboundFee = parseFloat(inboundFeeRaw.toFixed(2));
    
    const totalCharged  = parseFloat((amountNum + inboundFee).toFixed(2));
    const amountLocal   = liveRate ? parseFloat((amountNum * liveRate).toFixed(2)) : 0;
    const effectiveRate = totalCharged > 0 ? (amountLocal / totalCharged).toFixed(4) : "0.0000";

    const paymentReady = (usingSaved && paymentMethod !== '') || isPaymentValid;

    const handlePurchase = async () => {
        setError('');
        setLoading(true);
        try {
            const userId = (user as any)?.id || (user as any)?.userId;
            if (!userId) { router.push('/signin'); return; }

            const ben = validBeneficiaries.find(b => b.id === selectedDestinationId);
            if (!ben) throw new Error("Beneficiary not found");

            const fullPhone = ben.identifiers?.phone_number || '';
            const fullName  = ben.name;

            const res = await fetch('/api/vouchers/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    retailer_id: selectedRetailer!.id,
                    amount_usd: amountNum,
                    payment_method: paymentMethod,
                    adyen_stored_payment_id: paymentData?.token || savedPayment?.token || null,
                    beneficiary_name: fullName,
                    beneficiary_phone: fullPhone,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Purchase failed');

            if (paymentMethod && paymentData?.maskedNumber) {
                const toSave = { type: paymentMethod, label: `${paymentMethod} ****${paymentData.maskedNumber}`, token: paymentData.token };
                try { localStorage.setItem('symmetri_saved_payment', JSON.stringify(toSave)); } catch { /* ignore */ }
                setSavedPayment(toSave);
            }

            router.push({
                pathname: '/voucher-success',
                query: {
                    code: data.fastapi_response.barcode_data,
                    id: data.fastapi_response.transaction_id,
                    retailer: selectedRetailer!.name,
                    amountLocal: amountLocal,
                    currency: selectedRetailer!.currency,
                    amountUsd: amountNum,
                    total: totalCharged,
                    paymentMethod: paymentMethod,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
            </Head>
            <Header />
            <main style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px' }}>

                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#1A73E8', letterSpacing: '0.1em', marginBottom: '8px' }}>
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
                            background: step > i + 1 ? '#dcfce7' : step === i + 1 ? '#1A73E8' : '#e2e8f0',
                            color: step > i + 1 ? '#166534' : step === i + 1 ? 'white' : '#94a3b8',
                        }}>{step > i + 1 ? '✓ ' : ''}{label}</div>
                    ))}
                </div>

                {/* ── STEP 1: Choose Retailer ── */}
                {step === 1 && (
                    <div>
                        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                            {Object.entries(countries).map(([code, cData]: [string, any]) => {
                                if (!cData.retailers || cData.retailers.length === 0) return null;
                                const isSelected = selectedCountry === code;
                                return (
                                    <button
                                        key={code}
                                        onClick={() => setSelectedCountry(code)}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: '24px',
                                            border: `2px solid ${isSelected ? '#1A73E8' : '#e2e8f0'}`,
                                            background: isSelected ? '#e8f0fe' : 'white',
                                            color: isSelected ? '#1A73E8' : '#64748b',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {cData.name} ({cData.currency})
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {selectedCountry && countries[selectedCountry]?.retailers?.map((rawR: any) => {
                                const r: Retailer = {
                                    id: rawR.id,
                                    name: rawR.name,
                                    city: rawR.city,
                                    category: rawR.category,
                                    logo: getCategoryEmoji(rawR.category),
                                    description: `${rawR.category} · ${rawR.city}`,
                                    minUSD: MIN_ORDER_VALUE,
                                    maxUSD: MAX_PER_TX_USD,
                                    currency: countries[selectedCountry].currency,
                                };
                                return (
                                    <button key={r.id} onClick={() => { setSelectedRetailer(r); setStep(2); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'white', border: '2px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s' }}
                                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#1A73E8')}
                                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
                                        <span style={{ fontSize: '36px' }}>{r.logo}</span>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b' }}>{r.name}</div>
                                            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{r.description}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>${r.minUSD}–${r.maxUSD} USD</div>
                                        </div>
                                        <span style={{ marginLeft: 'auto', color: '#c7d2fe' }}>›</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Amount + Payment Method ── */}
                {step === 2 && selectedRetailer && (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#1A73E8', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '20px', padding: 0 }}>← Change retailer</button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                            <span style={{ fontSize: '28px' }}>{selectedRetailer.logo}</span>
                            <div>
                                <div style={{ fontWeight: '700', color: '#1e293b' }}>{selectedRetailer.name}</div>
                                <div style={{ fontSize: '13px', color: '#64748b' }}>{selectedRetailer.description}</div>
                            </div>
                        </div>

                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Beneficiary receives (USD)</label>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 8px' }}>Enter the amount your beneficiary should receive. Gateway fees are added on top.</p>
                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#94a3b8' }}>$</span>
                            <input
                                type="number"
                                min={effectiveMin}
                                max={allowedMax}
                                value={amountUSD}
                                onChange={e => setAmountUSD(e.target.value)}
                                placeholder={`${effectiveMin} – ${allowedMax}`}
                                style={{ width: '100%', padding: '14px 16px 14px 36px', fontSize: '24px', fontWeight: '800', border: `2px solid ${exceedsPerTx || exceedsMonthly ? '#ef4444' : '#1A73E8'}`, borderRadius: '12px', outline: 'none', boxSizing: 'border-box' as const, color: '#1e293b' }}
                            />
                        </div>

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
                                    </div>
                                )}
                            </div>
                        )}

                        {savedPayment && amountNum >= effectiveMin && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                    Saved payment method
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '16px 20px', borderRadius: '14px', cursor: 'pointer',
                                    border: `2px solid ${usingSaved ? '#1A73E8' : '#e2e8f0'}`,
                                    background: usingSaved ? '#e8f0fe' : '#f8fafc',
                                    transition: 'border-color 0.15s',
                                }}
                                    onClick={() => {
                                        setUsingSaved(true);
                                        setPaymentMethod(savedPayment.type);
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '22px' }}>💳</span>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{savedPayment.label}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {usingSaved && <span style={{ fontSize: '13px', fontWeight: '700', color: '#1A73E8' }}>✓ Selected</span>}
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            setUsingSaved(false);
                                            setPaymentMethod('');
                                            try { localStorage.removeItem('symmetri_saved_payment'); } catch { /* ignore */ }
                                            setSavedPayment(null);
                                        }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!usingSaved && (
                            <div className="mb-4">
                                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>How will you pay?</label>
                                <PaymentMethodForm
                                    gateways={inboundGateways}
                                    selectedMethodId={paymentMethod}
                                    onMethodSelect={setPaymentMethod}
                                    onDataChange={(isValid, data) => {
                                        setPaymentData(data);
                                        setIsPaymentValid(isValid);
                                    }}
                                />
                            </div>
                        )}

                        <button
                            disabled={!amountNum || amountNum < effectiveMin || exceedsPerTx || exceedsMonthly || monthlyRemaining <= 0 || !paymentReady}
                            onClick={() => setStep(3)}
                            style={{ width: '100%', padding: '16px', background: '#1A73E8', color: 'white', fontWeight: '700', fontSize: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', opacity: (!amountNum || amountNum < effectiveMin || exceedsPerTx || exceedsMonthly || !paymentReady) ? 0.4 : 1 }}>
                            Add Beneficiary →
                        </button>
                    </div>
                )}

                {/* ── STEP 3: Beneficiary Info ── */}
                {step === 3 && (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                        <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: '#1A73E8', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '20px', padding: 0 }}>← Back</button>
                        <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: '#1e293b' }}>Who receives this voucher?</h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>They'll get the code on WhatsApp instantly.</p>

                        {isAddingBeneficiary ? (
                            <InlineBeneficiaryForm
                                targetCurrency={selectedRetailer?.currency || 'MXN'}
                                onSuccess={(data) => {
                                    setBeneficiaries(prev => [...prev, data]);
                                    setSelectedDestinationId(data.id);
                                    setIsAddingBeneficiary(false);
                                }}
                                onCancel={() => setIsAddingBeneficiary(false)}
                            />
                        ) : (
                            <div className="space-y-4">
                                {validBeneficiaries.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-gray-500 mb-4">No saved beneficiaries found.</p>
                                        <button onClick={() => setIsAddingBeneficiary(true)} className="py-2 px-4 border border-blue-500 rounded text-blue-600 font-semibold">
                                            + Add Beneficiary
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            {validBeneficiaries.map(ben => (
                                                <div 
                                                    key={ben.id} 
                                                    onClick={() => setSelectedDestinationId(ben.id)}
                                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${selectedDestinationId === ben.id ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{ben.name}</p>
                                                            <p className="text-xs text-gray-500">{ben.identifiers?.phone_number || 'Phone Only'}</p>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedDestinationId === ben.id ? 'border-blue-500' : 'border-gray-300'}`}>
                                                            {selectedDestinationId === ben.id && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => setIsAddingBeneficiary(true)} className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-blue-600 font-medium hover:bg-gray-50 transition-colors">
                                            + Add a new beneficiary
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        <button
                            disabled={!selectedDestinationId}
                            onClick={() => setStep(4)}
                            style={{ marginTop: '24px', width: '100%', padding: '16px', background: '#1A73E8', color: 'white', fontWeight: '700', fontSize: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', opacity: !selectedDestinationId ? 0.4 : 1 }}>
                            Review & Confirm →
                        </button>
                    </div>
                )}

                {/* ── STEP 4: Confirm ── */}
                {step === 4 && selectedRetailer && (
                    <div className="relative">
                        <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: '#1A73E8', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '24px', padding: 0 }}>← Edit</button>

                        <TransactionSummary
                            amount={amountUSD}
                            sourceCurrency="USD"
                            amountReceived={amountLocal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            targetCurrency={selectedRetailer.currency}
                            beneficiaryName={validBeneficiaries.find(b => b.id === selectedDestinationId)?.name || '-'}
                            fundingMethodName={selectedInbound?.label || savedPayment?.label || '-'}
                            symmetriFee="0.00"
                            inboundFee={inboundFee.toFixed(2)}
                            outboundFee="0.00"
                            totalFees={inboundFee.toFixed(2)}
                            effectiveRate={effectiveRate}
                            title="Confirm Your Voucher"
                            subtitle={`You are sending $${amountNum.toFixed(2)} USD`}
                            hideHeader={false}
                        />

                        {error && <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

                        <button onClick={handlePurchase} disabled={loading}
                            style={{ width: '100%', padding: '18px', background: loading ? '#8AB4F8' : '#1A73E8', color: 'white', fontWeight: '800', fontSize: '17px', border: 'none', borderRadius: '14px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(26,115,232,0.4)' }}>
                            {loading ? 'Generating Voucher...' : `Purchase Voucher — $${totalCharged.toFixed(2)}`}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
