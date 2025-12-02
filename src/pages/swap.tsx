// src/pages/swap.tsx
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { fetchExchangeRate } from '../lib/exchangeRate';

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

// Time frame options in hours
const TIME_FRAMES = [
  { label: 'Instant (Now)', hours: 0 },
  { label: 'Within 1 hour', hours: 1 },
  { label: 'Within 6 hours', hours: 6 },
  { label: 'Within 12 hours', hours: 12 },
  { label: 'Within 24 hours (1 day)', hours: 24 },
  { label: 'Within 48 hours (2 days)', hours: 48 },
  { label: 'Within 72 hours (3 days)', hours: 72 },
  { label: 'Within 96 hours (4 days)', hours: 96 },
];

export default function SwapPage() {
  const router = useRouter();
  
  // User info - would come from session/context in real app
  const [userName, setUserName] = useState('User');
  
  // Form state - using "Country-CODE" format to distinguish between countries with same currency
  const [currencyFrom, setCurrencyFrom] = useState('United States-USD');
  const [amountFrom, setAmountFrom] = useState('');
  const [timeFrameHours, setTimeFrameHours] = useState<number | null>(null);
  const [currencyTo, setCurrencyTo] = useState('Mexico-MXN');
  const [marketRate, setMarketRate] = useState<number | null>(null);
  const [amountTo, setAmountTo] = useState('0');
  const [loading, setLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Fetch user info from session/localStorage
  useEffect(() => {
    // Try to get user from session storage or context
    const sessionData = localStorage.getItem('trueque_session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setUserName(session.firstName || session.email?.split('@')[0] || 'User');
      } catch (e) {
        setUserName('User');
      }
    }
  }, []);

  // Helper functions to work with "Country-CODE" format
  const getCurrencyInfo = (identifier: string) => {
    // identifier format: "Country-CODE"
    return CURRENCIES.find(c => `${c.country}-${c.code}` === identifier) || CURRENCIES[0];
  };

  const getCurrencyCode = (identifier: string) => {
    const info = getCurrencyInfo(identifier);
    return info.code;
  };

  // Fetch exchange rate when currencies change
  useEffect(() => {
    const codeFrom = getCurrencyCode(currencyFrom);
    const codeTo = getCurrencyCode(currencyTo);
    
    if (codeFrom && codeTo && codeFrom !== codeTo) {
      fetchRate();
    } else if (codeFrom === codeTo) {
      setMarketRate(1);
    }
  }, [currencyFrom, currencyTo]);

  // Calculate amount to receive when amount or rate changes
  useEffect(() => {
    if (amountFrom && marketRate) {
      const calculated = parseFloat(amountFrom) * marketRate;
      setAmountTo(calculated.toFixed(2));
    } else {
      setAmountTo('0');
    }
  }, [amountFrom, marketRate]);

  const fetchRate = async () => {
    setLoading(true);
    setRateError(null);
    try {
      const codeFrom = getCurrencyCode(currencyFrom);
      const codeTo = getCurrencyCode(currencyTo);
      const rate = await fetchExchangeRate(codeFrom, codeTo);
      setMarketRate(rate);
    } catch (error: any) {
      setRateError(error.message || 'Failed to fetch exchange rate');
      setMarketRate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    if (!amountFrom || parseFloat(amountFrom) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (timeFrameHours === null) {
      alert('Please select a time frame');
      return;
    }
    if (!marketRate) {
      alert('Exchange rate not available');
      return;
    }

    const codeFrom = getCurrencyCode(currencyFrom);
    const codeTo = getCurrencyCode(currencyTo);

    // Navigate to offers page with swap details
    router.push({
      pathname: '/offers',
      query: {
        from: codeFrom,
        to: codeTo,
        amountIntent: amountFrom,
        expectedReceive: amountTo,
        rate: marketRate,
        timeFrame: timeFrameHours,
        delivery: `Within ${TIME_FRAMES.find(tf => tf.hours === timeFrameHours)?.label || 'selected timeframe'}`
      }
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
        padding: '30px 40px',
        color: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '600',
            margin: 0
          }}>
            Hello {userName},
          </h1>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button 
              onClick={() => router.push('/app')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Dashboard
            </button>
            <span style={{ fontSize: '24px', cursor: 'pointer' }}>🔔</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: 900,
        margin: '40px auto',
        padding: '0 40px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '30px',
            color: '#2c3e50'
          }}>
            Amount and Currency to Exchange
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
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
                  color: '#34495e'
                }}>
                  Select Currency to Swap
                </label>
                <select
                  value={currencyFrom}
                  onChange={(e) => setCurrencyFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '10px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                >
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
                  color: '#34495e'
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
                    style={{
                      width: '100%',
                      padding: '14px 60px 14px 14px',
                      fontSize: '20px',
                      fontWeight: '500',
                      border: '2px solid #e1e8ed',
                      borderRadius: '10px',
                      textAlign: 'right',
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
                    {getCurrencyCode(currencyFrom)}
                  </span>
                </div>
              </div>

              {/* Time Frame */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#34495e'
                }}>
                  Select Time Frame
                  <span 
                    title="Choose when you want the transaction to be completed"
                    style={{
                      marginLeft: '8px',
                      width: '18px',
                      height: '18px',
                      border: '2px solid #95a5a6',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#95a5a6',
                      cursor: 'help',
                      fontWeight: '700'
                    }}
                  >
                    i
                  </span>
                </label>
                <select
                  value={timeFrameHours ?? ''}
                  onChange={(e) => setTimeFrameHours(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '10px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    color: timeFrameHours === null ? '#95a5a6' : '#2c3e50'
                  }}
                >
                  <option value="">Select Duration Time</option>
                  {TIME_FRAMES.map(tf => (
                    <option key={tf.hours} value={tf.hours}>{tf.label}</option>
                  ))}
                </select>
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
                  Select Currency to Receive
                </label>
                <select
                  value={currencyTo}
                  onChange={(e) => setCurrencyTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '10px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {CURRENCIES.map(curr => (
                    <option key={`to-${curr.code}-${curr.country}`} value={`${curr.country}-${curr.code}`}>
                      {curr.flag} {curr.country} ({curr.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Market Rate */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#34495e'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Market Rate
                    <span 
                      title="Exchange rates are updated in real-time from official sources. The final rate will be locked when you confirm the transaction."
                      style={{
                        marginLeft: '8px',
                        width: '18px',
                        height: '18px',
                        border: '2px solid #95a5a6',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#95a5a6',
                        cursor: 'help',
                        fontWeight: '700'
                      }}
                    >
                      i
                    </span>
                  </span>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: loading ? '#95a5a6' : '#27ae60'
                  }}>
                    {loading ? 'Loading...' : (marketRate ? marketRate.toFixed(4) : '---')}
                  </span>
                </label>
                {rateError && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '13px',
                    marginTop: '5px'
                  }}>
                    {rateError}
                  </div>
                )}
                <div style={{
                  fontSize: '13px',
                  color: '#7f8c8d',
                  marginTop: '5px'
                }}>
                  1 {getCurrencyCode(currencyFrom)} = {marketRate ? marketRate.toFixed(4) : '---'} {getCurrencyCode(currencyTo)}
                </div>
              </div>

              {/* Amount to Receive */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#34495e'
                }}>
                  Amount to Receive
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={amountTo}
                    readOnly
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
                    {getCurrencyCode(currencyTo)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Button */}
          <button
            onClick={handleSwap}
            disabled={!amountFrom || parseFloat(amountFrom) <= 0 || timeFrameHours === null || !marketRate || loading}
            style={{
              width: '100%',
              padding: '18px',
              fontSize: '18px',
              fontWeight: '600',
              color: 'white',
              background: (!amountFrom || parseFloat(amountFrom) <= 0 || timeFrameHours === null || !marketRate || loading)
                ? '#bdc3c7'
                : 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: (!amountFrom || parseFloat(amountFrom) <= 0 || timeFrameHours === null || !marketRate || loading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
            }}
          >
            Ready to Exchange
          </button>
        </div>
      </main>
    </div>
  );
}