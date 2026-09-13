// src/pages/offers.tsx  —  Phase 2: Real DB offers + Post an Offer
import { useRouter } from 'next/router';
import { useSwap } from '../context/SwapContext';
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape returned by GET /api/offers */
type DbOffer = {
  id: string;
  swap_type: 'IMMEDIATE' | 'LIMIT';
  amount_offered: number;
  currency_offered: string;
  amount_wanted: number;
  currency_wanted: string;
  exchange_rate: number;
  fee_total: number;
  expires_at: string | null;
  created_at: string;
};


// ─── Main Offers Page ─────────────────────────────────────────────────────────

export default function Offers() {
  const router = useRouter();
  const { setSwapIntent } = useSwap();
  const { amountIntent: amountIntentQuery, rate: rateQuery, from, to } = router.query;

  // Parsed corridor params
  const currencyFrom = ((from as string) || 'USD').toUpperCase();
  const currencyTo   = ((to   as string) || 'MXN').toUpperCase();
  const marketRate   = parseFloat(rateQuery as string) || 0;

  const [offers, setOffers] = useState<DbOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState('');
  const [txCount, setTxCount] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fetchedMarketRate, setFetchedMarketRate] = useState<number>(marketRate);

  // ── Load offers from DB ────────────────────────────────────────────────────

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams();
      // API already maps currencyFrom to currency_wanted and currencyTo to currency_offered.
      if (currencyFrom) params.set('currencyFrom', currencyFrom);
      if (currencyTo)   params.set('currencyTo',   currencyTo);
      
      const [res, rateRes] = await Promise.all([
        fetch(`/api/offers?${params}`),
        fetch(`/api/rate?from=${currencyFrom}&to=${currencyTo}`)
      ]);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DbOffer[] = await res.json();
      setOffers(data);

      if (rateRes.ok) {
        const rateData = await rateRes.json();
        if (rateData.rate) {
          setFetchedMarketRate(rateData.rate);
        }
      }
    } catch (err: any) {
      console.error('[Offers] Failed to fetch offers:', err);
      setFetchError('Could not load offers. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [currencyFrom, currencyTo]);

  useEffect(() => {
    if (!router.isReady) return;
    loadOffers();
  }, [router.isReady, loadOffers]);

  // ── KYC guard ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (!data.user) return;
        const status = (data.user.kycStatus || data.user.kyc_status || 'NOT_STARTED').toUpperCase();
        const restricted = ['NONE', 'EMPTY', 'INCOMPLETE', 'NOT_STARTED'];
        if (restricted.includes(status)) {
          setIsRedirecting(true);
          router.replace('/kyc');
          return;
        }
        setKycStatus(status);
        setTxCount(data.user.txCount || 0);
      })
      .catch(() => setKycStatus('PENDING'));
  }, []);

  const isSandbox = kycStatus.toUpperCase() === 'PENDING';
  const SANDBOX_LIMIT_USD = 200;

  // ── Offer selection ────────────────────────────────────────────────────────

  const handleSelectOffer = (offer: DbOffer) => {
    // pg returns NUMERIC columns as strings — cast everything to Number() defensively
    const amountOffered  = Number(offer.amount_offered);
    const amountWanted   = Number(offer.amount_wanted);
    const exchangeRate   = Number(offer.exchange_rate);

    // Sandbox: block if over limit or trial exhausted
    const amountInUsd = offer.currency_offered === 'USD'
      ? amountOffered
      : amountOffered / exchangeRate;

    if (isSandbox && txCount >= 1) {
      alert('Trial completed. Please complete KYC for full access.');
      return;
    }
    if (isSandbox && amountInUsd > SANDBOX_LIMIT_USD) {
      alert(`Trial Limit: This offer exceeds your $${SANDBOX_LIMIT_USD} limit. Complete KYC for full access.`);
      return;
    }

    const userRate = amountOffered / amountWanted;

    setSwapIntent({
      amount: amountWanted,
      source_currency: offer.currency_wanted,
      target_currency: offer.currency_offered,
      exchange_rate: userRate,
      timeFrame: 0,
      provider: offer.id,
    });

    router.push({
      pathname: '/beneficiary-selection',
      query: {
        amountIntent: amountWanted,
        expectedReceive: amountOffered.toFixed(2),
        rate: userRate,
        from: offer.currency_wanted,
        to: offer.currency_offered,
        timeFrame: 0,
        offerId: offer.id,
      },
    });
  };

  // ── Render guards ──────────────────────────────────────────────────────────

  if (isRedirecting) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Redirecting…</div>;
  }

  const restrictedStatuses = ['NONE', 'EMPTY', 'INCOMPLETE', 'NOT_STARTED'];
  if (!loading && restrictedStatuses.includes(kycStatus.toUpperCase()) && kycStatus !== '') {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Redirecting to profile verification…</div>;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
      <Header />

      <main style={{ padding: '0 24px', maxWidth: '1020px', margin: '40px auto' }}>
        {/* Card wrapper */}
        <div style={{
          backgroundColor: 'white', borderRadius: '20px',
          padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          {/* ── Top bar ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={() => router.push(`/offers/create?from=${currencyFrom}&to=${currencyTo}`)}
              id="post-offer-btn"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: 'white', border: 'none', padding: '10px 22px',
                borderRadius: '10px', fontWeight: '700', fontSize: '14px',
                cursor: 'pointer', letterSpacing: '0.3px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.35)'; }}
            >
              + Post an Offer
            </button>
          </div>

          {/* ── Heading ── */}
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>
            Select an Offer
          </h1>

          {/* ── Discovery Bar ── */}
          <div style={{
            display: 'flex', gap: '16px', alignItems: 'center',
            background: '#f8fafc', padding: '16px 24px', borderRadius: '12px',
            marginBottom: '28px', border: '1px solid #e2e8f0',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>I want to send</label>
              <select 
                value={currencyFrom} 
                onChange={(e) => router.push(`/offers?from=${e.target.value}&to=${currencyTo}`)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', fontWeight: '600', color: '#0f172a', minWidth: '120px' }}
              >
                {['EUR', 'DOP', 'COP', 'USD', 'MXN'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div style={{ color: '#94a3b8', fontSize: '20px', paddingTop: '20px' }}>→</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>They receive</label>
              <select 
                value={currencyTo} 
                onChange={(e) => router.push(`/offers?from=${currencyFrom}&to=${e.target.value}`)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', fontWeight: '600', color: '#0f172a', minWidth: '120px' }}
              >
                {['EUR', 'DOP', 'COP', 'USD', 'MXN'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {fetchedMarketRate > 0 && (
                <div style={{ marginLeft: 'auto', textAlign: 'right', paddingLeft: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Market Rate</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                      {(currencyTo === 'USD' || currencyTo === 'EUR')
                    ? `1 ${currencyTo} = ${(1/Number(fetchedMarketRate)).toFixed(4)} ${currencyFrom}`
                    : `1 ${currencyFrom} = ${Number(fetchedMarketRate).toFixed(4)} ${currencyTo}`}
                    </div>
                </div>
            )}
          </div>

          {/* ── Sandbox banner ── */}
          {isSandbox && (
            <div style={{
              background: '#fefce8', border: '1px solid #fde047',
              borderRadius: '12px', padding: '16px 20px',
              marginBottom: '28px', display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '20px' }}>🚧</span>
              <div>
                <strong style={{ display: 'block', color: '#78350f', marginBottom: '4px' }}>
                  Account Verification in Progress
                </strong>
                <span style={{ fontSize: '13px', color: '#92400e' }}>
                  You're eligible for one trial swap up to <strong>${SANDBOX_LIMIT_USD}</strong> while KYC is pending.
                </span>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {fetchError && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
              borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', fontSize: '14px',
              display: 'flex', gap: '12px', alignItems: 'center',
            }}>
              <span>⚠️</span> {fetchError}
              <button onClick={loadOffers} style={{
                marginLeft: 'auto', background: '#fca5a5', border: 'none', padding: '6px 14px',
                borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#7f1d1d', fontSize: '13px',
              }}>
                Retry
              </button>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
              <p style={{ fontWeight: '600' }}>Loading secure matches…</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && !fetchError && offers.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                No active offers for {currencyFrom} → {currencyTo}
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px', maxWidth: '380px', margin: '0 auto 28px' }}>
                Be the first to post a {currencyFrom}→{currencyTo} offer.
                Other verified users will be matched to yours automatically.
              </p>
              <button
                onClick={() => router.push(`/offers/create?from=${currencyFrom}&to=${currencyTo}`)}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: 'white', border: 'none', padding: '14px 32px',
                  borderRadius: '12px', fontWeight: '700', fontSize: '15px',
                  cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
                }}
              >
                + Post an Offer
              </button>
            </div>
          )}

          {/* ── Offer Table ── */}
          {!loading && offers.length > 0 && (
            <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '16px 20px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      You Pay <span style={{ textTransform: 'none', fontWeight: 'normal', color: '#94a3b8', fontSize: '11px' }}>(before fees)</span>
                    </th>
                    <th style={{ padding: '16px 20px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      You Get
                    </th>
                    <th style={{ padding: '16px 20px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transaction Rate</th>
                    <th style={{ padding: '16px 20px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => {
                    const amountInUsd = offer.currency_offered === 'USD'
                      ? offer.amount_offered
                      : offer.amount_offered / (offer.exchange_rate || 1);

                    const isSandboxLocked  = isSandbox && txCount >= 1;
                    const isSandboxOverLimit = isSandbox && amountInUsd > SANDBOX_LIMIT_USD;
                    const isDisabled = isSandboxLocked || isSandboxOverLimit;

                    let badgeText = '';
                    if (isSandboxLocked)    badgeText = 'Trial Used';
                    if (isSandboxOverLimit) badgeText = 'Over Limit';

                    return (
                      <tr 
                        key={offer.id} 
                        style={{ 
                          borderBottom: '1px solid #f1f5f9', 
                          opacity: isDisabled ? 0.5 : 1,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.background = 'transparent'; }}
                        title={badgeText}
                      >
                        <td style={{ padding: '16px 20px', fontWeight: '700', color: '#15803d', fontSize: '15px' }}>
                          {Number(offer.amount_wanted).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span style={{ fontSize: '12px', color: '#64748b' }}>{offer.currency_wanted}</span>
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>
                          {Number(offer.amount_offered).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span style={{ fontSize: '12px', color: '#64748b' }}>{offer.currency_offered}</span>
                        </td>
                        <td style={{ padding: '16px 20px', color: '#374151', fontSize: '14px', fontWeight: '600' }}>
                          <div>
                            {(offer.currency_wanted === 'USD' || offer.currency_wanted === 'EUR')
                              ? `1 ${offer.currency_wanted} = ${(offer.amount_offered / offer.amount_wanted).toFixed(4)} ${offer.currency_offered}`
                              : `1 ${offer.currency_offered} = ${(offer.amount_wanted / offer.amount_offered).toFixed(4)} ${offer.currency_wanted}`
                            }
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <button
                            onClick={() => !isDisabled && handleSelectOffer(offer)}
                            disabled={isDisabled}
                            style={{
                              background: isDisabled ? '#cbd5e1' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                              color: 'white', border: 'none', padding: '8px 20px',
                              borderRadius: '8px', fontWeight: '600', fontSize: '13px',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              boxShadow: isDisabled ? 'none' : '0 2px 8px rgba(37,99,235,0.25)',
                            }}
                          >
                            {isDisabled ? badgeText || 'Locked' : 'Accept'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}