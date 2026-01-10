
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useSwap } from '../context/SwapContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useAuth } from '../context/AuthContext';
import { MarketMap } from '../config/marketMap';

// Types
type AccountType = 'checking' | 'savings';
type RelationshipType = 'self' | 'family' | 'friend' | 'business';

// Validation RegEx patterns
const PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    CBU: /^\d{22}$/,         // Argentina CBU
    CUIT: /^\d{11}$/,
    CLABE: /^\d{18}$/,       // Mexico CLABE
    IBAN: /^[A-Z]{2}\d{2}[A-Z\d]{4,30}$/,
    BIC: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/
};

// UI Components
const InputGroup = ({ label, error, children }: { label: string, error?: string, children: React.ReactNode }) => (
    <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333333', fontSize: '14px' }}>
            {label}
        </label>
        {children}
        {error && <div style={{ color: '#e74c3c', fontSize: '13px', marginTop: '5px' }}>{error}</div>}
    </div>
);

export default function BeneficiaryDetailsPage() {
    const { user } = useAuth();
    useRequireAuth();
    const router = useRouter();
    const { swapIntent, beneficiary: contextForm, setBeneficiary } = useSwap();
    // (Removed unused savedBeneficiaries, setEditingIndex for clarity if not needed, or keep for context)

    // 1. Query Params
    const { amountIntent } = router.query;

    const [viewMode, setViewMode] = useState<'selection' | 'form'>('form');
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Phone State
    const [phoneCode, setPhoneCode] = useState('+54');
    const [phoneNumber, setPhoneNumber] = useState('');

    // MAPPER CONTEXT
    const getTargetCurrency = () => {
        const queryCurrency = router.query.currency as string;
        return queryCurrency || swapIntent?.currencyTo || 'ARS';
    };
    const targetCurrency = getTargetCurrency();
    const marketConfig = MarketMap[targetCurrency] || MarketMap['USD']; // Fallback USD
    const destCountry = marketConfig.country === 'Argentina' ? 'AR' :
        marketConfig.country === 'Spain' ? 'EU' :
            marketConfig.country === 'Mexico' ? 'MX' : 'US';

    const isVoucher = swapIntent?.offerType === 'retail_voucher' || swapIntent?.offerType === 'merchant_voucher';

    // Hydrate Phone
    useEffect(() => {
        if (contextForm.personal.phone && !phoneNumber) {
            const parts = contextForm.personal.phone.split(' ');
            if (parts.length >= 2) {
                setPhoneCode(parts[0]);
                setPhoneNumber(parts.slice(1).join(''));
            } else {
                setPhoneNumber(contextForm.personal.phone);
            }
        }
    }, [contextForm.personal.phone]);

    // Sync Phone
    useEffect(() => {
        const combined = `${phoneCode} ${phoneNumber}`;
        if (combined !== contextForm.personal.phone && phoneNumber) {
            setBeneficiary(prev => ({
                ...prev,
                personal: { ...prev.personal, phone: combined }
            }));
        }
    }, [phoneCode, phoneNumber]);

    // Persistence
    useEffect(() => {
        if (contextForm.personal.firstName || contextForm.personal.lastName) {
            localStorage.setItem('selected_beneficiary', JSON.stringify(contextForm));
        }
    }, [contextForm]);

    // Handlers
    const handlePersonalChange = (field: keyof typeof contextForm.personal, value: string) => {
        setBeneficiary(prev => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const handleBankingChange = (field: keyof typeof contextForm.banking, value: string) => {
        setBeneficiary(prev => ({ ...prev, banking: { ...prev.banking, [field]: value } }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    // Validation
    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        if (!contextForm.personal.firstName) newErrors.firstName = 'First Name is required';
        if (!contextForm.personal.lastName) newErrors.lastName = 'Last Name is required';
        if (!contextForm.personal.email || !PATTERNS.EMAIL.test(contextForm.personal.email)) newErrors.email = 'Valid email is required';
        if (!phoneNumber || phoneNumber.length < 5) newErrors.phone = 'Phone number is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors: Record<string, string> = {};
        const { deliveryMethod, bankName, cbu, iban, clabe, accountNumber, cardNumber, cardExpiry, walletProvider, walletId } = contextForm.banking;

        if (isVoucher) return true;

        if (deliveryMethod === 'bank_rtp') {
            if (!bankName) newErrors.bankName = 'Bank Name is required';

            const val = destCountry === 'AR' ? cbu :
                destCountry === 'EU' ? iban :
                    destCountry === 'MX' ? clabe : accountNumber;
            const cleanVal = (val || '').replace(/[\s-]/g, '');

            if (!cleanVal) {
                newErrors.accountNumber = `${marketConfig.label} is required`;
            } else if (marketConfig.type === 'numeric' && !/^\d+$/.test(cleanVal)) {
                newErrors.accountNumber = 'Must be specific digits only';
            }
            if (destCountry === 'AR' && cleanVal.length !== 22) newErrors.cbu = 'Must be 22 digits';
            if (destCountry === 'MX' && cleanVal.length !== 18) newErrors.clabe = 'Must be 18 digits';
        }

        if (deliveryMethod === 'card_push') {
            if (!cardNumber || cardNumber.replace(/\D/g, '').length < 16) newErrors.cardNumber = 'Valid 16-digit Card Number required';
            if (!cardExpiry) newErrors.cardExpiry = 'Expiry required';
        }

        if (deliveryMethod === 'wallet') {
            if (!walletProvider) newErrors.walletProvider = 'Select a provider';
            if (!walletId) newErrors.walletId = 'ID required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1) {
            if (validateStep1()) setStep(2);
        } else {
            if (validateStep2()) handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { personal, banking } = contextForm;
            // Determine Final Inputs based on Method
            let finalAccountNumber = '';
            let payloadAccountType = 'Bank';
            let finalBankName = banking.bankName;

            if (banking.deliveryMethod === 'bank_rtp') {
                if (destCountry === 'AR') finalAccountNumber = banking.cbu;
                else if (destCountry === 'EU') finalAccountNumber = banking.iban;
                else if (destCountry === 'MX') finalAccountNumber = banking.clabe;
                else finalAccountNumber = banking.accountNumber;

                // Type map
                if (banking.accountType === 'CBU') payloadAccountType = 'Bank';
                else if (banking.accountType === 'CVU') payloadAccountType = 'Wallet'; // CVU context
                else payloadAccountType = 'Bank';
            }
            else if (banking.deliveryMethod === 'card_push') {
                finalAccountNumber = banking.cardNumber;
                payloadAccountType = 'Card';
                finalBankName = 'Debit Card';
            }
            else if (banking.deliveryMethod === 'wallet') {
                finalAccountNumber = banking.walletId;
                payloadAccountType = 'Wallet';
                finalBankName = banking.walletProvider;
            }

            const payload = {
                name: `${personal.firstName} ${personal.lastName}`.trim(),
                method: banking.deliveryMethod,
                identifiers: {
                    email: personal.email,
                    phone_number: personal.phone,
                    bank_name: finalBankName,
                    account_type: payloadAccountType,
                    account_number: finalAccountNumber,
                    cbu: banking.cbu, // Redundancy
                    alias: banking.alias || '', // Ensure no undefined
                    wallet_provider: banking.walletProvider,
                    wallet_id: banking.walletId,
                    card_number: banking.cardNumber, // For card_push
                    country: destCountry
                },
                country: destCountry
            };

            const res = await fetch('/api/beneficiaries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Ensure session cookie is passed
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to save beneficiary');
            router.push('/counterparty-offers');
        } catch (err) {
            console.error(err);
            alert('Error saving beneficiary. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // STYLES - High Contrast
    const inputStyle = {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #bdc3c7',
        fontSize: '16px',
        boxSizing: 'border-box' as const,
        color: '#333333',
        fontWeight: '500' // Slight weight for readability
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
            <Header />

            <main style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>

                {/* Back Button */}
                <button
                    onClick={() => router.push('/beneficiary-list')}
                    style={{
                        background: 'none', border: 'none', color: '#333333', fontSize: '14px', fontWeight: '600',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px'
                    }}
                >
                    ← Back
                </button>

                {/* Progress Stepper */}
                <div style={{ display: 'flex', marginBottom: '30px', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ width: '120px', height: '4px', borderRadius: '2px', backgroundColor: step >= 1 ? '#4A90E2' : '#e1e8ed' }} />
                    <div style={{ width: '120px', height: '4px', borderRadius: '2px', backgroundColor: step >= 2 ? '#4A90E2' : '#e1e8ed' }} />
                </div>

                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ margin: '0 0 20px 0', color: '#333333' }}>
                        {step === 1 ? 'Beneficiary Details' : 'Banking Information'}
                    </h2>

                    {/* Context Summary */}
                    {swapIntent && (
                        <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px', fontSize: '14px', color: '#555555', border: '1px solid #e1e8ed' }}>
                            Sending <strong style={{ color: '#333' }}>{swapIntent.amount} {swapIntent.currencyFrom}</strong> to <strong style={{ color: '#333' }}>{targetCurrency} ({marketConfig.country})</strong>
                        </div>
                    )}

                    {/* STEP 1: PERSONAL */}
                    {step === 1 && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <InputGroup label="First Name" error={errors.firstName}>
                                    <input style={inputStyle} value={contextForm.personal.firstName} onChange={(e) => handlePersonalChange('firstName', e.target.value)} placeholder="e.g. Maria" />
                                </InputGroup>
                                <InputGroup label="Last Name" error={errors.lastName}>
                                    <input style={inputStyle} value={contextForm.personal.lastName} onChange={(e) => handlePersonalChange('lastName', e.target.value)} placeholder="e.g. Gonzalez" />
                                </InputGroup>
                            </div>
                            <InputGroup label="Mobile Phone" error={errors.phone}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} style={{ ...inputStyle, width: '100px' }}>
                                        <option value="+1">🇺🇸 +1</option>
                                        <option value="+54">🇦🇷 +54</option>
                                        <option value="+52">🇲🇽 +52</option>
                                        <option value="+55">🇧🇷 +55</option>
                                        <option value="+57">🇨🇴 +57</option>
                                        <option value="+34">🇪🇸 +34</option>
                                    </select>
                                    <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} placeholder="Mobile Number" style={{ ...inputStyle, flex: 1 }} />
                                </div>
                            </InputGroup>
                            <InputGroup label="Email" error={errors.email}>
                                <input style={inputStyle} type="email" value={contextForm.personal.email} onChange={(e) => handlePersonalChange('email', e.target.value)} placeholder="maria@example.com" />
                            </InputGroup>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* Delivery Method Toggle */}
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333333', fontSize: '14px' }}>
                                    Delivery Method
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['bank_rtp', 'card_push', 'wallet'].map(method => {
                                        if (method === 'wallet' && !['AR', 'EU'].includes(destCountry)) return null;
                                        const labels: Record<string, string> = { bank_rtp: 'Bank (RTP)', card_push: 'Debit Card', wallet: 'Wallet' };
                                        const isSelected = contextForm.banking.deliveryMethod === method;
                                        return (
                                            <button
                                                key={method}
                                                onClick={() => handleBankingChange('deliveryMethod', method)}
                                                style={{
                                                    flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                                                    borderColor: isSelected ? '#4A90E2' : '#cccccc',
                                                    backgroundColor: isSelected ? '#eef6fc' : 'white',
                                                    color: isSelected ? '#4A90E2' : '#555555',
                                                    fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
                                                }}>
                                                {labels[method]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* === BANK RTP Inputs (DYNAMIC) === */}
                            {contextForm.banking.deliveryMethod === 'bank_rtp' && (
                                <>
                                    <InputGroup label="Bank Name" error={errors.bankName}>
                                        <input style={inputStyle} value={contextForm.banking.bankName} onChange={(e) => handleBankingChange('bankName', e.target.value)} placeholder="Bank Name" />
                                    </InputGroup>

                                    {destCountry === 'AR' && targetCurrency === 'ARS' ? (
                                        <>
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333333', fontSize: '14px' }}>Account Type</label>
                                                <div style={{ display: 'flex', gap: '15px', background: '#f8f9fa', padding: '10px', borderRadius: '8px', border: '1px solid #cccccc' }}>
                                                    <div onClick={() => handleBankingChange('accountType', 'CBU')} style={{ flex: 1, padding: '12px 10px', borderRadius: '8px', border: (contextForm.banking.accountType !== 'CVU') ? '2px solid #4A90E2' : '1px solid #cccccc', backgroundColor: (contextForm.banking.accountType !== 'CVU') ? '#eef6fc' : 'white', color: (contextForm.banking.accountType !== 'CVU') ? '#4A90E2' : '#555555', cursor: 'pointer', fontWeight: 'bold', textAlign: 'center' }}>
                                                        🏦 Bank (CBU)
                                                    </div>
                                                    <div onClick={() => handleBankingChange('accountType', 'CVU')} style={{ flex: 1, padding: '12px 10px', borderRadius: '8px', border: (contextForm.banking.accountType === 'CVU') ? '2px solid #9b59b6' : '1px solid #cccccc', backgroundColor: (contextForm.banking.accountType === 'CVU') ? '#f5eef8' : 'white', color: (contextForm.banking.accountType === 'CVU') ? '#9b59b6' : '#555555', cursor: 'pointer', fontWeight: 'bold', textAlign: 'center' }}>
                                                        📱 Wallet (CVU)
                                                    </div>
                                                </div>
                                            </div>
                                            <InputGroup label={`${contextForm.banking.accountType === 'CVU' ? 'CVU' : 'CBU'} (${marketConfig.length} digits)`} error={errors.cbu}>
                                                <input style={inputStyle} value={contextForm.banking.cbu} onChange={(e) => handleBankingChange('cbu', e.target.value)} placeholder={marketConfig.placeholder || "0000..."} maxLength={22} />
                                            </InputGroup>
                                        </>
                                    ) : (
                                        <InputGroup label={marketConfig.label} error={errors.accountNumber || errors.iban || errors.clabe}>
                                            <input style={inputStyle}
                                                value={destCountry === 'EU' ? contextForm.banking.iban : destCountry === 'MX' ? contextForm.banking.clabe : contextForm.banking.accountNumber}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    if (destCountry === 'EU') handleBankingChange('iban', v);
                                                    else if (destCountry === 'MX') handleBankingChange('clabe', v);
                                                    else handleBankingChange('accountNumber', v);
                                                }}
                                                placeholder={marketConfig.placeholder}
                                            />
                                        </InputGroup>
                                    )}
                                </>
                            )}
                            {/* === CARD Inputs === */}
                            {contextForm.banking.deliveryMethod === 'card_push' && (
                                <>
                                    <InputGroup label="Cardholder Name" error={errors.cardHolder}>
                                        <input style={inputStyle} value={contextForm.personal.firstName + ' ' + contextForm.personal.lastName} readOnly placeholder="Cardholder Name" />
                                    </InputGroup>
                                    <InputGroup label="Card Number" error={errors.cardNumber}>
                                        <input style={inputStyle} value={contextForm.banking.cardNumber} onChange={(e) => handleBankingChange('cardNumber', e.target.value)} maxLength={19} placeholder="0000 0000 0000 0000" />
                                    </InputGroup>
                                    <InputGroup label="Expiry (MM/YY)" error={errors.cardExpiry}>
                                        <input style={inputStyle} value={contextForm.banking.cardExpiry} onChange={(e) => handleBankingChange('cardExpiry', e.target.value)} maxLength={5} placeholder="MM/YY" />
                                    </InputGroup>
                                </>
                            )}

                            {/* === WALLET Inputs === */}
                            {contextForm.banking.deliveryMethod === 'wallet' && (
                                <>
                                    <InputGroup label="Wallet Provider" error={errors.walletProvider}>
                                        <select style={inputStyle} value={contextForm.banking.walletProvider} onChange={e => handleBankingChange('walletProvider', e.target.value)}>
                                            <option value="">Select Provider</option>
                                            <option value="paypal">PayPal</option>
                                            <option value="mercadopago">Mercado Pago</option>
                                            <option value="lemon">Lemon Cash</option>
                                        </select>
                                    </InputGroup>
                                    <InputGroup label="Wallet ID (Email, Phone, or Alias)" error={errors.walletId}>
                                        <input style={inputStyle} value={contextForm.banking.walletId} onChange={(e) => handleBankingChange('walletId', e.target.value)} placeholder="e.g. user@email.com or @alias" />
                                    </InputGroup>
                                </>
                            )}
                        </>
                    )}

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                        <button onClick={() => { if (step === 2) setStep(1); else router.back(); }} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '2px solid #cccccc', backgroundColor: 'transparent', color: '#555555', fontWeight: 'bold', cursor: 'pointer' }}>
                            Back
                        </button>
                        <button onClick={handleNext} style={{ flex: 2, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#4A90E2', color: 'white', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                            {step === 1 ? 'Next Step' : 'Review & Confirm'}
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}
