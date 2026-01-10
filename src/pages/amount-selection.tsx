
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { fetchExchangeRate } from '../lib/exchangeRate';
import Header from '../components/Header';
import { useSwap } from '../context/SwapContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { formatNumber } from '../lib/formatNumber';

import { useAuth } from '../context/AuthContext'; // Import useAuth directly

// Currency mappings
const CURRENCIES = [
    { country: 'Argentina', code: 'ARS', symbol: '$', flag: '🇦🇷' },
    { country: 'Bolivia', code: 'BOB', symbol: 'Bs', flag: '🇧🇴' },
    { country: 'Brazil', code: 'BRL', symbol: 'R$', flag: '🇧🇷' },
    { country: 'Colombia', code: 'COP', symbol: '$', flag: '🇨🇴' },
    { country: 'El Salvador', code: 'USD', symbol: '$', flag: '🇸🇻' },
    { country: 'Guatemala', code: 'GTQ', symbol: 'Q', flag: '🇬🇹' },
    { country: 'Mexico', code: 'MXN', symbol: '$', flag: '🇲🇽' },
    { country: 'Portugal', code: 'EUR', symbol: '€', flag: '🇵🇹' },
    { country: 'Spain', code: 'EUR', symbol: '€', flag: '🇪🇸' },
    { country: 'United States', code: 'USD', symbol: '$', flag: '🇺🇸' },
    { country: 'Venezuela', code: 'VES', symbol: 'Bs.S', flag: '🇻🇪' },
];

export default function AmountSelectionPage() {
    useRequireAuth();
    const router = useRouter();
    const { user } = useAuth(); // Use Auth Context
    const { validateSwapLimit, setSwapIntent } = useSwap();

    const [currencyFrom, setCurrencyFrom] = useState<string | null>(null);
    const [currencyTo, setCurrencyTo] = useState<string | null>(null);
    const [amountFrom, setAmountFrom] = useState('');
    const [isHydrated, setIsHydrated] = useState(false);
    const [marketRate, setMarketRate] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [rateError, setRateError] = useState<string | null>(null);
    const [limitError, setLimitError] = useState<string | null>(null);

    // Derived State from Context (Reactive)
    const userName = user?.name || 'Friend';
    const kycStatus = (user?.kycStatus || '').toUpperCase();
    const txCount = user?.txCount || 0;

    const getCurrencyCode = (val: string) => {
        if (!val) return '';
        const parts = val.split('-');
        return parts.length > 1 ? parts[1] : '';
    };

    useEffect(() => {
        // 1. Re-hydrate Swap State only
        const savedState = sessionStorage.getItem('trueque_swap_state');
        if (savedState) {
            try {
                const { currencyFrom: sFrom, currencyTo: sTo, amount: sAmt } = JSON.parse(savedState);
                if (sFrom) setCurrencyFrom(sFrom);
                if (sTo) setCurrencyTo(sTo);
                if (sAmt) setAmountFrom(sAmt);
            } catch (e) { }
        }
        setIsHydrated(true);

        // 2. Query Params
        const findCurrencyValue = (code: string) => {
            const match = CURRENCIES.find(c => c.code === code);
            return match ? `${match.country}-${match.code}` : null;
        };
        if (router.query.amount) setAmountFrom(router.query.amount as string);
        if (router.query.from) {
            const val = findCurrencyValue(router.query.from as string);
            if (val) setCurrencyFrom(val);
        }
        if (router.query.to) {
            const val = findCurrencyValue(router.query.to as string);
            if (val) setCurrencyTo(val);
        }

    }, [router.query]);

    // Persistence
    useEffect(() => {
        if (!isHydrated) return;
        const state = { currencyFrom: currencyFrom || '', currencyTo: currencyTo || '', amount: amountFrom };
        sessionStorage.setItem('trueque_swap_state', JSON.stringify(state));
    }, [currencyFrom, currencyTo, amountFrom, isHydrated]);

    // Fetch Rate
    useEffect(() => {
        const updateRate = async () => {
            if (!currencyFrom || !currencyTo) return;
            setLoading(true);
            try {
                const from = getCurrencyCode(currencyFrom || '');
                const to = getCurrencyCode(currencyTo || '');
                const rate = await fetchExchangeRate(from, to);
                setMarketRate(rate);
                setRateError(null);
            } catch (err) {
                console.error(err);
                setRateError('Failed to fetch rate');
                setMarketRate(null);
            } finally {
                setLoading(false);
            }
        };
        if (currencyFrom && currencyTo) updateRate();
    }, [currencyFrom, currencyTo]);

    const amountTo = (amountFrom && marketRate) ? (parseFloat(amountFrom) * marketRate).toFixed(2) : '';

    // State for dynamic limit warning
    const [limitRefSource, setLimitRefSource] = useState<string>('');

    // Validation
    useEffect(() => {
        if (!amountFrom) {
            setLimitError(null);
            setLimitRefSource('');
            return;
        }
        const val = parseFloat(amountFrom);
        if (isNaN(val)) return;

        // KYC Check Code (Simplified from swap.tsx)
        const status = (kycStatus || '').toUpperCase();

        // RESTRICTED: PENDING, VERIFYING, IN_REVIEW, REJECTED
        // Logic: Must be <= $200 USD equivalent
        if (status !== 'APPROVED') {
            const getRate = (currencyCode: string | null) => {
                const code = currencyCode ? getCurrencyCode(currencyCode) : 'USD';
                // Approx rates to USD (Conservative for Security)
                const rates: Record<string, number> = {
                    'ARS': 0.0012, 'EUR': 1.10, 'USD': 1.0, 'BRL': 0.20, 'MXN': 0.05,
                    'BOB': 0.15, 'COP': 0.00025, 'GTQ': 0.13, 'VES': 0.02
                };
                return rates[code] || 1.0;
            };

            const rate = getRate(currencyFrom);
            const approxUSD = val * rate;

            if (approxUSD > 200) {
                const maxAllowed = 200 / rate;
                setLimitRefSource(formatNumber(maxAllowed) + ' ' + getCurrencyCode(currencyFrom || ''));
                setLimitError('KYC_LIMIT_EXCEEDED');
                return;
            }
        }

        if (status === 'APPROVED') {
            setLimitError(null);
            return;
        }

        const check = validateSwapLimit(val, getCurrencyCode(currencyFrom || ''));
        if (!check.allowed) setLimitError(check.reason || 'Limit exceeded');
        else setLimitError(null);

    }, [amountFrom, currencyFrom, validateSwapLimit, kycStatus, txCount]); // Removed limitError

    const handleContinue = () => {
        if (limitError) return; // Prevent continue if error exists
        const amt = parseFloat(amountFrom);
        if (!amt || !marketRate) return;

        // 1. Update Global Context
        setSwapIntent({
            amount: amt,
            currencyFrom: getCurrencyCode(currencyFrom || ''),
            currencyTo: getCurrencyCode(currencyTo || ''),
            rate: marketRate,
            offerType: 'bank'
        });

        // 2. Navigate to Offers (Market Matching)
        router.push({
            pathname: '/offers',
            query: {
                amountIntent: amt,
                rate: marketRate,
                from: getCurrencyCode(currencyFrom || ''),
                to: getCurrencyCode(currencyTo || '')
            }
        });
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' }}>
            <Header />
            <main style={{ padding: '0 40px', maxWidth: '1000px', margin: '40px auto' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

                    {/* Navigation Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <button
                            onClick={() => router.push('/dashboard')}
                            style={{
                                background: 'none', border: 'none', color: '#7f8c8d', fontSize: '14px',
                                fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                            }}
                        >
                            ← Back to Dashboard
                        </button>

                        <button
                            onClick={() => {
                                sessionStorage.removeItem('trueque_swap_state');
                                router.push('/dashboard');
                            }}
                            style={{
                                background: 'none', border: 'none', color: '#e74c3c', fontSize: '14px',
                                fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            Cancel ✕
                        </button>
                    </div>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333333', margin: '0 0 30px 0' }}>
                        Amount and Currency to Swap
                    </h2>

                    {userName && (
                        <h3 style={{ margin: '0 0 25px 0', color: '#4A90E2', fontSize: '20px' }}>
                            Hello, {userName} 👋
                        </h3>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
                        {/* Left Column */}
                        <div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '15px', fontWeight: 'bold', color: '#333333' }}>
                                    Select Currency to Swap
                                </label>
                                <select
                                    value={currencyFrom || ''}
                                    onChange={(e) => setCurrencyFrom(e.target.value)}
                                    style={{
                                        width: '100%', padding: '14px', fontSize: '16px',
                                        border: '2px solid #bdc3c7', borderRadius: '10px', // High Contrast Border
                                        backgroundColor: 'white', cursor: 'pointer',
                                        color: currencyFrom ? '#333333' : '#7f8c8d'
                                    }}
                                >
                                    <option value="" disabled>Select Currency</option>
                                    {CURRENCIES.map(curr => (
                                        <option key={`from-${curr.code}-${curr.country}`} value={`${curr.country}-${curr.code}`}>
                                            {curr.flag} {curr.country} ({curr.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '15px', fontWeight: 'bold', color: '#333333' }}>
                                    Amount to Swap
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        value={amountFrom}
                                        onChange={(e) => setAmountFrom(e.target.value)}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        disabled={kycStatus === 'PENDING' && txCount > 0}
                                        style={{
                                            width: '100%', padding: '14px 60px 14px 14px',
                                            fontSize: '20px', fontWeight: 'bold', // Bold text
                                            border: limitError ? '2px solid #e74c3c' : '2px solid #bdc3c7', // High Contrast
                                            borderRadius: '10px', textAlign: 'right', boxSizing: 'border-box',
                                            backgroundColor: (kycStatus === 'PENDING' && txCount > 0) ? '#f2f2f2' : 'white',
                                            cursor: (kycStatus === 'PENDING' && txCount > 0) ? 'not-allowed' : 'text',
                                            color: '#333333'
                                        }}
                                    />
                                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#555555', fontSize: '16px', fontWeight: '600' }}>
                                        {getCurrencyCode(currencyFrom || '')}
                                    </span>
                                </div>
                                {limitError === 'KYC_LIMIT_EXCEEDED' ? (
                                    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#e8f4fc', border: '1px solid #bdc3c7', borderRadius: '8px', color: '#2c3e50', borderLeft: '5px solid #3498db' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>New Account Limit</div>
                                        <div style={{ fontSize: '14px', marginBottom: '10px', lineHeight: '1.5' }}>
                                            Your first swap is capped at $200.00 USD (Currently ~{limitRefSource}).
                                        </div>
                                        <a href="/kyc" style={{ display: 'inline-block', backgroundColor: '#3498db', color: 'white', padding: '8px 12px', borderRadius: '5px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                                            Check Status &rarr;
                                        </a>
                                    </div>
                                ) : limitError && (
                                    <div style={{ color: '#e74c3c', fontSize: '13px', marginTop: '6px', fontWeight: 'bold' }}>
                                        ⚠️ {limitError}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '15px', fontWeight: 'bold', color: '#333333' }}>
                                    Select Currency to Swap for
                                </label>
                                <select
                                    value={currencyTo || ''}
                                    onChange={(e) => setCurrencyTo(e.target.value)}
                                    style={{
                                        width: '100%', padding: '14px', fontSize: '16px',
                                        border: '2px solid #bdc3c7', borderRadius: '10px', // High Contrast
                                        backgroundColor: 'white', cursor: 'pointer',
                                        color: currencyTo ? '#333333' : '#7f8c8d'
                                    }}
                                >
                                    <option value="" disabled>Select Currency</option>
                                    {CURRENCIES.map(curr => (
                                        <option key={`to-${curr.code}-${curr.country}`} value={`${curr.country}-${curr.code}`}>
                                            {curr.flag} {curr.country} ({curr.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '5px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '15px', fontWeight: 'bold', color: '#333333' }}>
                                    Value to Deliver
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={amountTo ? formatNumber(parseFloat(amountTo.replace(/,/g, ''))) : ''}
                                        readOnly
                                        placeholder="0.00"
                                        style={{
                                            width: '100%', padding: '14px 60px 14px 14px',
                                            fontSize: '20px', fontWeight: 'bold',
                                            border: '2px solid #bdc3c7', // High Contrast
                                            borderRadius: '10px', textAlign: 'right',
                                            backgroundColor: '#f8f9fa', color: '#333333',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#555555', fontSize: '16px', fontWeight: '600' }}>
                                        {getCurrencyCode(currencyTo || '')}
                                    </span>
                                </div>
                            </div>

                            <div style={{ fontSize: '12px', color: '#555555', fontStyle: 'italic', marginBottom: '20px', lineHeight: '1.4' }}>
                                Note: This amount is an estimate based on the market rate and is before fees in the destination country.
                            </div>
                        </div>
                    </div>

                    {/* Rate Display */}
                    <div style={{ marginBottom: '30px', textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px', border: '1px solid #bdc3c7' }}>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px', fontWeight: 'bold', color: '#333333', marginBottom: '5px' }}>
                            Current Market Rate
                            <span style={{ fontSize: '18px', fontWeight: '700', color: loading ? '#95a5a6' : '#27ae60' }}>
                                {loading ? 'Loading...' : (marketRate ? marketRate.toFixed(4) : '---')}
                            </span>
                        </label>
                        <div style={{ fontSize: '13px', color: '#555555' }}>
                            1 {getCurrencyCode(currencyFrom || '')} = {marketRate ? marketRate.toFixed(4) : '---'} {getCurrencyCode(currencyTo || '')}
                        </div>
                    </div>

                    {/* Hard Lock Message */}
                    {/* Hard Lock Message - High Contrast */}
                    {kycStatus === 'PENDING' && txCount > 0 && (
                        <div style={{
                            marginBottom: '20px',
                            padding: '20px',
                            backgroundColor: 'white',
                            border: '2px solid #333',
                            borderRadius: '8px',
                            color: '#333',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '24px' }}>🔒</span>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Verification in Progress</div>
                            </div>
                            <div style={{ fontSize: '16px', lineHeight: '1.5', fontWeight: '500' }}>
                                You have already performed your initial swap. Please wait for the result of your KYC process to continue.
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleContinue}
                        disabled={(!amountFrom || parseFloat(amountFrom) <= 0 || !marketRate || loading || !!limitError) || (kycStatus === 'PENDING' && txCount > 0)}
                        style={{
                            width: '100%', padding: '18px', fontSize: '18px', fontWeight: '600', color: 'white',
                            background: ((!amountFrom || parseFloat(amountFrom) <= 0 || !marketRate || loading || !!limitError) || (kycStatus === 'PENDING' && txCount > 0))
                                ? '#bdc3c7'
                                : 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                            border: 'none', borderRadius: '12px',
                            cursor: ((!amountFrom || parseFloat(amountFrom) <= 0 || !marketRate || loading || !!limitError) || (kycStatus === 'PENDING' && txCount > 0)) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                        }}
                    >
                        {(kycStatus === 'PENDING' && txCount > 0) ? 'Locked - Verification Pending' : 'Ready to Swap'}
                    </button>
                </div>
            </main>
        </div>
    );
}
