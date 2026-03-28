// src/pages/offers.tsx
import { useRouter } from 'next/router';
import { useSwap } from '../context/SwapContext';
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

// Types including quote data (even if some fields are hidden now)
type Offer = {
  id: string;
  provider: string;
  amount: number;
  rate: number;
  min: number;
  max: number;
  speed: string;
  trust: number;
  offerAmount: number;
  currencyFrom: string;
  currencyTo: string;
  marketRate: number;
  totalCost?: number;
  effectiveRate?: number;
  isRound?: boolean;
};

// Helper to generate a mock Trueque ID format: T YYYYMMDD CC SSSS K
const getMockTruequeID = (country: string, index: number) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(index + 1).padStart(4, '0');
  // Simple mock checksum char
  const checksum = "X";
  return `T${date}${country}${seq}${checksum}`;
};

const generateMockOffers = (
  amountIntent: number,
  currencyFrom: string,
  currencyTo: string,
  marketRate: number
): Offer[] => {
  // Mock Profiles - Now anonymous, just Country based routing logic ideally
  // but we can just assign random countries for diversity in the ID
  const baseProfiles = [
    { country: 'AR', min: 10, max: 500, trust: 4.8 },
    { country: 'MX', min: 50, max: 1000, trust: 4.9 },
    { country: 'CO', min: 100, max: 2000, trust: 4.7 },
    { country: 'BR', min: 20, max: 300, trust: 4.6 },
    { country: 'US', min: 200, max: 5000, trust: 5.0 },
  ];

  const offers: Offer[] = [];
  const target = amountIntent;

  // Helper to create an offer object
  const createOffer = (amount: number, profileIndex: number, idSuffix: string, isRound: boolean): Offer => {
    const profile = baseProfiles[profileIndex % baseProfiles.length];
    const providerId = getMockTruequeID(profile.country, profileIndex * 100 + Math.floor(amount)); // Unique-ish ID

    return {
      id: `OFF${amount}${idSuffix}`,
      provider: providerId, // NOW AN ID, NOT A NAME
      amount: amount,
      rate: marketRate,
      min: profile.min,
      max: profile.max,
      speed: 'Instant',
      trust: profile.trust,
      offerAmount: amount,
      currencyFrom,
      currencyTo,
      marketRate,
      isRound
    };
  };

  // Inject specific test offers for Sandbox Verification (ES -> AR)
  // Offer 1: 120,000 ARS (Available, approx €114)
  offers.push(createOffer(120000, 0, 'ARS1', true));

  // Offer 2: 250,000 ARS (Restricted, approx €238 > €190)
  offers.push(createOffer(250000, 1, 'ARS2', false));

  // Offer 3: 1,000,000 ARS (Restricted, approx €952 > €190)
  offers.push(createOffer(1000000, 2, 'ARS3', true));

  // Return mixed sorted offers
  return offers.sort((a, b) => a.amount - b.amount);
};

export default function Offers() {
  const router = useRouter();
  const { setSwapIntent } = useSwap();
  const {
    amountIntent: amountIntentQuery,
    rate: rateQuery,
    from,
    to,
    timeFrame // Should be 0 (Instant) from swap.tsx
  } = router.query;

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBracket, setActiveBracket] = useState(0); // Default to Instant (0)
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Initialize
  useEffect(() => {
    if (!router.isReady) return;

    // Ensure we have necessary data, default to ES->AR values if missing
    const amount = parseFloat(amountIntentQuery as string) || 100000;
    const cFrom = from as string || 'EUR';
    const cTo = to as string || 'ARS';

    let rate = parseFloat(rateQuery as string) || 1055.00; // EUR->ARS rate
    // Fix for low-magnitude rate passed from previous screen (e.g. 1.055 instead of 1055)
    if (cTo === 'ARS' && rate < 100) {
      rate = rate * 1000;
    }

    // if (isNaN(amount) || isNaN(rate)) return; -> Removed to allow direct access

    // Use passed timeFrame if available (mapped to bracket), or default to 0
    let bracket = 0;
    if (timeFrame) {
      bracket = parseInt(timeFrame as string);
    }
    setActiveBracket(bracket);

    // Generate mock offers
    const generatedOffers = generateMockOffers(amount, cFrom, cTo, rate);
    setOffers(generatedOffers);
    setLoading(false);

  }, [router.isReady, amountIntentQuery, rateQuery, from, to, timeFrame]);

  // Sandbox / KYC Logic
  const [kycStatus, setKycStatus] = useState<string>('');
  const [txCount, setTxCount] = useState<number>(0);

  useEffect(() => {
    // Fetch fresh session to check KYC status
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          const currentKycStatus = (data.user.kycStatus || data.user.kyc_status || 'NOT_STARTED').toUpperCase();
          const restrictedStatuses = ['NONE', 'EMPTY', 'INCOMPLETE', 'NOT_STARTED'];

          let statusResult = currentKycStatus;
          if (!data.user.firstName && !data.user.first_name && currentKycStatus === 'NOT_STARTED') {
            statusResult = 'NOT_STARTED';
          }

          if (restrictedStatuses.includes(statusResult)) {
            console.warn(`[Offers Guard] Redirecting to KYC: Status=${statusResult}`);
            setIsRedirecting(true);
            router.replace('/kyc');
            return;
          }

          setKycStatus(statusResult);
          setTxCount(data.user.txCount || 0);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch session, defaulting to RESTRICTED/PENDING for safety");
        setKycStatus('PENDING');
      });
  }, []);

  const isSandbox = (kycStatus || '').toUpperCase() === 'PENDING';
  const SANDBOX_LIMIT = 190; // €190 Limit (approx $200 USD)

  // Fetch Quotes for offers (Background - optional now if we hide friction)
  // We might still want to fetch it to have the QuoteID ready for the next step?
  // User says: "Remove friction columns... Show only 'Match Amount' and 'Market Rate'"
  // So we don't strictly *need* to display the quote data here, but fetching it might pre-warm the cache or validation.
  // For simplicity and performance, effectively we just show the mock offers now. 
  // However, let's keep the fetch logic but not display the friction, to ensure backend connectivity is healthy.

  useEffect(() => {
    const fetchQuotes = async () => {
      if (offers.length === 0) return;

      const updatedOffers = await Promise.all(offers.map(async (offer) => {
        try {
          // Hardcoding bracket to 0 as per new requirements "The system should automatically flag all matches as instant_priority"
          const url = `http://localhost:8001/api/quotes/transparent?amount=${offer.offerAmount}&currency_from=${offer.currencyFrom}&currency_to=${offer.currencyTo}&rate=${offer.marketRate}&settlement_bracket=0`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            return {
              ...offer,
              totalCost: data.total_cost_to_sender, // Stored but hidden
              effectiveRate: data.effective_exchange_rate // Stored but hidden
              // We could store quote_id here if needed
            };
          }
        } catch (e) {
          console.error("Failed to fetch quote for offer", offer.id, e);
        }
        return offer;
      }));
      setOffers(updatedOffers);
    };

    // Slight delay to allow initial render
    if (!loading && offers.length > 0 && !offers[0].totalCost) {
      fetchQuotes();
    }
  }, [loading, activeBracket]); // Adjusted dependencies


  const handleSelectOffer = (offer: Offer) => {
    // Redundant Security Check (Hard Click-Block)
    // Redundant Security Check (Hard Click-Block)
    const eurEquivalent = offer.offerAmount / 1055; // Fixed divisor as per requirement
    const isOverLimit = isSandbox && eurEquivalent > SANDBOX_LIMIT;
    const isTrialExhausted = isSandbox && txCount >= 1;

    if (isOverLimit || isTrialExhausted) {
      alert("Trial Limit Reached: This swap exceeds your $200 limit. Please complete KYC for full access.");
      console.warn("Transfer blocked by Sandbox Rules");
      return;
    }

    // Navigate to Beneficiary first (Step 2.5) -> Then Review/Payment (Step 3)
    // GLOBAL STATE: Set Swap Intent
    setSwapIntent({
      amount: offer.offerAmount,
      currencyFrom: offer.currencyFrom, // EUR
      currencyTo: offer.currencyTo || 'ARS',
      rate: offer.marketRate,
      timeFrame: 0, // Hardcoded Instant
      provider: offer.provider
    });

    router.push({
      pathname: '/beneficiary',
      query: {
        amountIntent: offer.offerAmount,
        expectedReceive: (offer.offerAmount * offer.marketRate).toFixed(2),
        rate: offer.marketRate,
        from: offer.currencyFrom,
        to: offer.currencyTo,
        timeFrame: 0,
        provider: offer.provider
      }
    });
  };

  const getCurrencyCode = (val: string) => {
    if (!val) return '';
    // val might be "Country-Code" or just "Code"
    if (val.includes('-')) return val.split('-')[1];
    return val;
  };

  if (loading || isRedirecting) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>Loading secure matches...</div>;
  }

  const currentStatus = (kycStatus || '').toUpperCase();
  const restrictedStatuses = ['NONE', 'EMPTY', 'INCOMPLETE', 'NOT_STARTED'];
  if (restrictedStatuses.includes(currentStatus)) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>Redirecting to security profile...</div>;
  }
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
          {/* Navigation Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <button
              onClick={() => router.push({ pathname: '/amount-selection', query: router.query })}
              style={{
                background: 'none',
                border: 'none',
                color: '#7f8c8d',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              ← Back to Swap
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

          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '10px',
            color: '#2c3e50'
          }}>
            Select a Counterparty
          </h2>
          {isSandbox && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeeba',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '25px',
              display: 'flex',
              gap: '12px',
              alignItems: 'start'
            }}>
              <span style={{ fontSize: '20px' }}>🚧</span>
              <div>
                <strong style={{ display: 'block', color: '#856404', marginBottom: '4px' }}>
                  Account Verification in Progress
                </strong>
                <span style={{ fontSize: '14px', color: '#856404' }}>
                  Your identity verification is currently in progress. To help you get started immediately, you are eligible for <strong>one trial swap of up to €{SANDBOX_LIMIT}</strong> until your KYC is fully approved.
                </span>
              </div>
            </div>
          )}

          <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
            Choose a match to proceed. Transaction speed is <strong>Instant</strong>.
          </p>

          {loading ? (
            <div>Loading offers...</div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {offers.filter(o => o.currencyTo === 'ARS').map((offer) => {
                const isExact = Math.abs(offer.amount - parseFloat(amountIntentQuery as string)) < 0.01;

                // ES-AR Logic:
                // Market Rate is EUR->ARS (e.g. 1050).
                // Offer Amount is in ARS.
                // Cost in EUR = Amount / Rate.
                const costInEur = offer.offerAmount / offer.marketRate;
                const eurEquivalent = offer.offerAmount / 1055; // Fixed check for limit

                // Sandbox Enforcement
                const hasUsedTrial = isSandbox && txCount >= 1;
                const isOverLimit = isSandbox && eurEquivalent > SANDBOX_LIMIT;

                // Lockout Logic
                // If single swap used, EVERYTHING is view-only (disabled).
                // If over limit, specific offer is disabled.
                const isLocallyDisabled = isOverLimit;
                const isGloballyLocked = hasUsedTrial;
                const isDisabled = isGloballyLocked || isLocallyDisabled;

                // Visual State
                const opacity = isDisabled ? 0.4 : 1; // Updated to 0.4
                const pointerEvents = isDisabled ? 'none' : 'auto';

                // Tooltip & Badge Message
                let badgeMsg = "";
                let titleMsg = "";

                if (isGloballyLocked) {
                  titleMsg = "Trial completed. View Only.";
                  badgeMsg = "Trial Completed - View Only";
                } else if (isOverLimit) {
                  titleMsg = `Trial Limit Reached: This swap exceeds your $200 limit.`;
                  badgeMsg = "Trial Limit Exceeded";
                }

                return (
                  <div
                    key={offer.id}
                    title={titleMsg}
                    onClick={() => !isDisabled && handleSelectOffer(offer)}
                    style={{
                      border: isExact ? '2px solid #4A90E2' : '1px solid #e1e8ed',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      backgroundColor: isDisabled ? '#f9f9f9' : (isExact ? '#f0f7ff' : 'white'),
                      opacity: opacity,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabled) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDisabled) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {/* Badge Overlay for Restricted Items */}
                    {isDisabled && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '20px',
                        backgroundColor: isGloballyLocked ? '#7f8c8d' : '#e74c3c',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {badgeMsg}
                      </div>
                    )}

                    {/* 1. Left: Provider Info */}
                    <div style={{ flex: '0 0 25%' }}>
                      <div style={{ fontWeight: '700', fontSize: '18px', color: '#2c3e50' }}>
                        {offer.provider}
                      </div>
                      <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '4px' }}>
                        Trust Score: {offer.trust} ⭐
                      </div>
                      {offer.isRound && (
                        <div style={{
                          marginTop: '5px',
                          color: '#27ae60',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: '#e8f5e9',
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          Efficient Match ✨
                        </div>
                      )}
                    </div>

                    {/* 2. Center-Left: Match Amount (ARS) */}
                    <div style={{ flex: '0 0 20%', textAlign: 'left' }}>
                      <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        You Get
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '20px', color: '#27ae60' }}>
                        {offer.offerAmount.toLocaleString()} ARS
                      </div>
                    </div>

                    {/* 3. Center: Rate (The Bridge) */}
                    <div style={{ flex: '0 0 15%', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ARS/EUR
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '16px', color: '#34495e', backgroundColor: '#ecf0f1', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                        {offer.marketRate.toFixed(2)}
                      </div>
                    </div>

                    {/* 4. Center-Right: Cost (EUR) */}
                    <div style={{ flex: '0 0 20%', textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        You Swap
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '18px', color: '#2c3e50' }}>
                        €{costInEur.toFixed(2)}
                      </div>
                      {isOverLimit && (
                        <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '2px', fontWeight: 'bold' }}>
                          Above Trial Limit
                        </div>
                      )}
                    </div>

                    {/* 5. Right: Action Arrow */}
                    <div style={{
                      flex: '0 0 10%',
                      textAlign: 'right',
                      color: isDisabled ? '#bdc3c7' : '#4A90E2',
                      fontWeight: 'bold',
                      fontSize: '24px'
                    }}>
                      &rarr;
                    </div>
                  </div>
                );
              })}
            </div >
          )}
        </div >
      </main >
    </div >
  );
}