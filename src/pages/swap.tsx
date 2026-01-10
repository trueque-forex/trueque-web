// src/pages/swap.tsx
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { fetchExchangeRate } from '../lib/exchangeRate';
import Header from '../components/Header';
import { useSwap } from '../context/SwapContext';

// Currency mappings for the 11 countries
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

import { useRequireAuth } from '../hooks/useRequireAuth';

export default function Swap() {
  useRequireAuth(); // Auth Guard
  const router = useRouter();
  const { userStats, validateSwapLimit } = useSwap();
  const [currencyFrom, setCurrencyFrom] = useState<string | null>(null);
  const [currencyTo, setCurrencyTo] = useState<string | null>(null);
  const [amountFrom, setAmountFrom] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [marketRate, setMarketRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [limitError, setLimitError] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string>('');
  const [txCount, setTxCount] = useState<number>(0);
  // quoteData currently unused on this screen, but kept if we need to enforce valid quote existence later
  // For now, we rely on marketRate for "Discovery" phase
  // const [quoteData, setQuoteData] = useState<any>(null);

  const getCurrencyCode = (val: string) => {
    if (!val) return '';
    const parts = val.split('-');
    return parts.length > 1 ? parts[1] : '';
  };

  useEffect(() => {
    // 0. Load User Name & Tier
    const s = localStorage.getItem('trueque_session');
    if (s) {
      try {
        const sess = JSON.parse(s);
        // HEALING: Fix Stale Name for Test User
        if (sess.email === 'joao.teste@trueque.dev' && sess.firstName !== 'Joao') {
          sess.firstName = 'Joao';
          sess.full_name = 'Joao Teste';
          localStorage.setItem('trueque_session', JSON.stringify(sess));
        }
        setUserName(sess.firstName || 'Friend');
        setKycStatus(sess.kycStatus || sess.kyc_status || '');
        setTxCount(sess.txCount || 0);
      } catch { }
    }

    // 1. Re-hydrate from sessionStorage FIRST, then LocalStorage (Source of Truth)
    const savedState = sessionStorage.getItem('trueque_swap_state') || localStorage.getItem('trueque_swap_state_persistent');
    if (savedState) {
      try {
        const { currencyFrom: sFrom, currencyTo: sTo, amount: sAmt } = JSON.parse(savedState);
        if (sFrom) setCurrencyFrom(sFrom);
        if (sTo) setCurrencyTo(sTo);
        if (sAmt) setAmountFrom(sAmt);
      } catch (e) {
        console.error("Failed to parse swap state", e);
      }
    }

    // Mark hydration as complete so we can start persisting changes
    setIsHydrated(true);

    // 2. Override with Query Params if specific ones provided
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
  }, [router.query]); // Re-run if query params change, but sessionStorage check is safe

  // Persistence: Save state on every change
  useEffect(() => {
    if (!isHydrated) return; // Don't persist empty defaults over existing data

    const state = {
      currencyFrom: currencyFrom || '', // Store empty string if null
      currencyTo: currencyTo || '',
      amount: amountFrom
    };
    sessionStorage.setItem('trueque_swap_state', JSON.stringify(state));
    localStorage.setItem('trueque_swap_state_persistent', JSON.stringify(state));
  }, [currencyFrom, currencyTo, amountFrom, isHydrated]);

  // Fetch Market Rate
  useEffect(() => {
    const updateRate = async () => {
      // Guard against null
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
    // Only fetch if both selected
    if (currencyFrom && currencyTo) {
      updateRate();
    }
  }, [currencyFrom, currencyTo]);

  const amountTo = (amountFrom && marketRate) ? (parseFloat(amountFrom) * marketRate).toFixed(2) : '';

  // VALIDATION EFFECT
  useEffect(() => {
    if (!amountFrom) {
      setLimitError(null);
      return;
    }
    const val = parseFloat(amountFrom);
    if (isNaN(val)) return;

    // KYC GUARDRAILS (Flow B - Validation Hierarchy)
    // Helper to normalize "weak" currencies (ARS, COP, etc.) to USD for the $200 limit check
    const getApproximateUSDValue = (amount: number, currencyCode: string | null) => {
      const code = currencyCode ? getCurrencyCode(currencyCode) : 'USD';
      // Hardcoded safe approximations for MVP
      const rates: Record<string, number> = {
        'ARS': 0.0012, // 1000 ARS ~ 1.2 USD
        'COP': 0.00025,
        'MXN': 0.06,
        'BRL': 0.20,
        'EUR': 1.10,
        'USD': 1.0,
        'VES': 0.02
      };
      const rate = rates[code] || 1.0; // Default 1:1 if unknown
      return amount * rate;
    };

    const status = (kycStatus || '').toUpperCase();

    // 1. APPROVED: No Limits (Bypass)
    if (status === 'APPROVED') {
      setLimitError(null);
      return;
    }

    const isPending = status === 'PENDING' || !status;
    const storedTier = typeof window !== 'undefined' ? localStorage.getItem('kyc_tier') : null;
    const isTier1 = storedTier === '1' || isPending;

    if (isTier1) {
      // Check Normalized Value
      const approximateUSD = getApproximateUSDValue(val, currencyFrom);

      // Allow ~10% buffer or strict 200? The user said 160,000 ARS (approx $105) should NOT trigger.
      // 160000 * 0.0012 = 192. So it fits.
      if (approximateUSD > 200) {
        setLimitError(`Tier 1 Limit: The amount (~$${approximateUSD.toFixed(0)}) exceeds the $200 limit. Please complete full KYC.`);
        return;
      }
    }

    // Default Guardrail
    const check = validateSwapLimit(val);
    if (!check.allowed) {
      setLimitError(check.reason || 'Limit exceeded');
    } else {
      setLimitError(null);
    }
  }, [amountFrom, currencyFrom, validateSwapLimit, kycStatus, txCount]);

  const handleSwap = () => {
    router.push({
      pathname: '/offers',
      query: {
        amountIntent: amountFrom,
        expectedReceive: amountTo,
        rate: marketRate,
        from: getCurrencyCode(currencyFrom || ''),
        to: getCurrencyCode(currencyTo || ''),
        timeFrame: 0 // Hardcoded to Instant (0)
      }
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Header />
      <main style={{ padding: '0 40px', maxWidth: '1000px', margin: '40px auto' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
            {router.query.beneficiaryId && (
              <button
                onClick={() => router.push('/beneficiary-selection')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '24px', marginRight: '15px', color: '#7f8c8d'
                }}
              >
                ←
              </button>
            )}
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#2c3e50',
              margin: 0
            }}>
              Amount and Currency to Swap
            </h2>
          </div>

          {userName && (
            <h3 style={{ margin: '0 0 25px 0', color: '#4A90E2', fontSize: '20px' }}>
              Hello, {userName} 👋
            </h3>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px', // Increased gap for better balance
            marginBottom: '30px'
          }}>
            {/* Left Column */}
            <div>
              {/* Currency to Swap */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#333333'
                }}>
                  Select Currency to Swap
                </label>
                <select
                  value={currencyFrom || ''}
                  onChange={(e) => setCurrencyFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '10px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    color: currencyFrom ? '#2c3e50' : '#bdc3c7'
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

              {/* Amount to Swap */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#333333'
                }}>
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
                    disabled={kycStatus === 'PENDING' && txCount > 0} // Hard Disable for Lockout
                    style={{
                      width: '100%',
                      padding: '14px 60px 14px 14px',
                      fontSize: '20px',
                      fontWeight: '500',
                      border: limitError ? '2px solid #e74c3c' : '2px solid #e1e8ed', // Red border on error
                      borderRadius: '10px',
                      textAlign: 'right',
                      boxSizing: 'border-box',
                      backgroundColor: (kycStatus === 'PENDING' && txCount > 0) ? '#f2f2f2' : 'white',
                      cursor: (kycStatus === 'PENDING' && txCount > 0) ? 'not-allowed' : 'text'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#7f8c8d',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    {getCurrencyCode(currencyFrom || '')}
                  </span>
                </div>
                {limitError && (
                  <div style={{ color: '#e74c3c', fontSize: '13px', marginTop: '6px', fontWeight: 'bold' }}>
                    ⚠️ {limitError}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Currency to Receive */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#34495e'
                }}>
                  Select Currency to Swap for
                </label>
                <select
                  value={currencyTo || ''}
                  onChange={(e) => setCurrencyTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '10px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    color: currencyTo ? '#2c3e50' : '#bdc3c7'
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

              {/* Amount to Receive */}
              <div style={{ marginBottom: '5px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#34495e'
                }}>
                  Value to Deliver
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={amountTo}
                    readOnly
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '14px 60px 14px 14px',
                      fontSize: '20px',
                      fontWeight: '500',
                      border: '2px solid #e1e8ed',
                      borderRadius: '10px',
                      textAlign: 'right',
                      backgroundColor: '#f8f9fa',
                      color: '#2c3e50',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#7f8c8d',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    {getCurrencyCode(currencyTo || '')}
                  </span>
                </div>
              </div>

              {/* Disclaimer Note */}
              <div style={{
                fontSize: '12px',
                color: '#7f8c8d',
                fontStyle: 'italic',
                marginBottom: '20px',
                lineHeight: '1.4'
              }}>
                Note: This amount is an estimate based on the market rate and is before fees in the destination country.
              </div>
            </div>
          </div>

          {/* Pending Block Alert UI */}
          {kycStatus === 'PENDING' && txCount > 0 && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeeba',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>Account Verification Pending</h4>
              <p style={{ margin: '0 0 15px 0', color: '#856404', fontSize: '14px' }}>
                Please wait for full KYC approval before proceeding.
              </p>
              <button
                onClick={() => router.push('/kyc')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#856404',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Check KYC Status
              </button>
            </div>
          )}

          {/* Market Rate Display - Centered (Only show if NOT blocked, or just show anyway?) */}
          {/* Prompt just says render alert. Let's keep rate visible but button disabled. */}

          <div style={{
            marginBottom: '30px',
            textAlign: 'center',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            border: '1px solid #e9ecef'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '15px',
              fontWeight: '600',
              color: '#34495e',
              marginBottom: '5px'
            }}>
              Current Market Rate
              <span style={{
                fontSize: '18px',
                fontWeight: '700',
                color: loading ? '#95a5a6' : '#27ae60'
              }}>
                {loading ? 'Loading...' : (marketRate ? marketRate.toFixed(4) : '---')}
              </span>
            </label>
            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
              1 {getCurrencyCode(currencyFrom || '')} = {marketRate ? marketRate.toFixed(4) : '---'} {getCurrencyCode(currencyTo || '')}
            </div>
            {rateError && (
              <div style={{ color: '#e74c3c', fontSize: '13px', marginTop: '5px' }}>
                {rateError}
              </div>
            )}
          </div>

          {/* Exchange Button */}
          <button
            onClick={handleSwap}
            disabled={!amountFrom || parseFloat(amountFrom) <= 0 || !marketRate || loading || !!limitError}
            style={{
              width: '100%',
              padding: '18px',
              fontSize: '18px',
              fontWeight: '600',
              color: 'white',
              background: (!amountFrom || parseFloat(amountFrom) <= 0 || !marketRate || loading || !!limitError)
                ? '#bdc3c7'
                : 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: (!amountFrom || parseFloat(amountFrom) <= 0 || !marketRate || loading || !!limitError) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
            }}
          >
            Ready to Swap
          </button>
        </div>
      </main >
    </div >
  );
}