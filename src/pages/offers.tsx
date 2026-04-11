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

/** Shape for the Post an Offer form */
type OfferDraft = {
  swap_type: 'IMMEDIATE' | 'LIMIT';
  amount_offered: string;
  currency_offered: string;
  amount_wanted: string;
  currency_wanted: string;
  exchange_rate: string;
};

// ─── Post an Offer Modal ──────────────────────────────────────────────────────

function PostOfferModal({
  defaultFrom,
  defaultTo,
  defaultRate,
  onClose,
  onPosted,
}: {
  defaultFrom: string;
  defaultTo: string;
  defaultRate: number;
  onClose: () => void;
  onPosted: () => void;
}) {
  const [form, setForm] = useState<OfferDraft>({
    swap_type: 'IMMEDIATE',
    amount_offered: '',
    currency_offered: defaultFrom,
    amount_wanted: '',
    currency_wanted: defaultTo,
    exchange_rate: defaultRate > 0 ? defaultRate.toFixed(4) : '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Auto-compute amount_wanted when offered or rate changes
  useEffect(() => {
    const offered = parseFloat(form.amount_offered);
    const rate = parseFloat(form.exchange_rate);
    if (!isNaN(offered) && !isNaN(rate) && offered > 0 && rate > 0) {
      setForm(prev => ({ ...prev, amount_wanted: (offered * rate).toFixed(2) }));
    }
  }, [form.amount_offered, form.exchange_rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/offers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swap_type: form.swap_type,
          amount_offered: parseFloat(form.amount_offered),
          currency_offered: form.currency_offered.toUpperCase(),
          amount_wanted: parseFloat(form.amount_wanted),
          currency_wanted: form.currency_wanted.toUpperCase(),
          exchange_rate: parseFloat(form.exchange_rate),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post offer');
      onPosted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px',
        padding: '40px', maxWidth: '520px', width: '100%',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '22px', color: '#94a3b8', lineHeight: 1,
        }}>×</button>

        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
          Post an Offer
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
          Your offer will be visible to other verified users. Symmetri takes a 1.5% fee at match.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Swap Type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Offer Type</label>
            <select name="swap_type" value={form.swap_type} onChange={handleChange} style={inputStyle}>
              <option value="IMMEDIATE">Immediate</option>
              <option value="LIMIT">Limit (resting)</option>
            </select>
          </div>

          {/* Corridor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'end', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>I'm offering</label>
              <input name="currency_offered" value={form.currency_offered} onChange={handleChange}
                style={inputStyle} placeholder="USD" maxLength={6} />
            </div>
            <div style={{ paddingBottom: '10px', color: '#94a3b8', fontSize: '22px', textAlign: 'center' }}>→</div>
            <div>
              <label style={labelStyle}>I want</label>
              <input name="currency_wanted" value={form.currency_wanted} onChange={handleChange}
                style={inputStyle} placeholder="MXN" maxLength={6} />
            </div>
          </div>

          {/* Amounts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Amount I'm offering</label>
              <input name="amount_offered" value={form.amount_offered} onChange={handleChange}
                type="number" min="0.01" step="any" style={inputStyle} placeholder="100.00" required />
            </div>
            <div>
              <label style={labelStyle}>Exchange rate</label>
              <input name="exchange_rate" value={form.exchange_rate} onChange={handleChange}
                type="number" min="0.000001" step="any" style={inputStyle} placeholder="17.33" required />
            </div>
          </div>

          {/* Amount wanted (computed) */}
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px',
            padding: '14px 18px', marginBottom: '24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '14px', color: '#15803d' }}>Counterparty will send</span>
            <span style={{ fontWeight: '800', fontSize: '20px', color: '#15803d' }}>
              {form.amount_wanted ? `${parseFloat(form.amount_wanted).toLocaleString()} ${form.currency_wanted.toUpperCase()}` : '—'}
            </span>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
              borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} style={{
            width: '100%', background: submitting ? '#94a3b8' : '#2563eb',
            color: 'white', border: 'none', padding: '15px', borderRadius: '12px',
            fontWeight: '700', fontSize: '16px', cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}>
            {submitting ? 'Posting...' : 'Post Offer →'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: '600',
  color: '#374151', marginBottom: '6px',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
  borderRadius: '8px', fontSize: '15px', outline: 'none',
  boxSizing: 'border-box',
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
  const [showModal, setShowModal] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // ── Load offers from DB ────────────────────────────────────────────────────

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams();
      if (currencyFrom) params.set('currencyFrom', currencyFrom);
      if (currencyTo)   params.set('currencyTo',   currencyTo);
      const res = await fetch(`/api/offers?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DbOffer[] = await res.json();
      setOffers(data);
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

    setSwapIntent({
      amount: amountOffered,
      source_currency: offer.currency_offered,
      target_currency: offer.currency_wanted,
      exchange_rate: exchangeRate,
      timeFrame: 0,
      provider: offer.id,
    });

    router.push({
      pathname: '/beneficiary',
      query: {
        amountIntent: amountOffered,
        expectedReceive: amountWanted.toFixed(2),
        rate: exchangeRate,
        from: offer.currency_offered,
        to: offer.currency_wanted,
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

      {showModal && (
        <PostOfferModal
          defaultFrom={currencyFrom}
          defaultTo={currencyTo}
          defaultRate={marketRate}
          onClose={() => setShowModal(false)}
          onPosted={() => {
            setShowModal(false);
            loadOffers(); // Refresh list after posting
          }}
        />
      )}

      <main style={{ padding: '0 24px', maxWidth: '1020px', margin: '40px auto' }}>
        {/* Card wrapper */}
        <div style={{
          backgroundColor: 'white', borderRadius: '20px',
          padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          {/* ── Top bar ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <button
              onClick={() => router.push({ pathname: '/amount-selection', query: router.query })}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              ← Back
            </button>
            <button
              onClick={() => setShowModal(true)}
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
            <button
              onClick={() => { sessionStorage.removeItem('trueque_swap_state'); router.push('/dashboard'); }}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Cancel ✕
            </button>
          </div>

          {/* ── Heading ── */}
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            Select a Counterparty
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>
            Corridor: <strong>{currencyFrom} → {currencyTo}</strong>
            {marketRate > 0 && <> &nbsp;·&nbsp; Market rate: <strong>{marketRate.toFixed(4)}</strong></>}
            &nbsp;·&nbsp; Speed: <strong>Instant</strong>
          </p>

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
                onClick={() => setShowModal(true)}
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

          {/* ── Offer cards ── */}
          {!loading && offers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {offers.map((offer) => {
                const amountInUsd = offer.currency_offered === 'USD'
                  ? offer.amount_offered
                  : offer.amount_offered / (offer.exchange_rate || 1);

                const isSandboxLocked  = isSandbox && txCount >= 1;
                const isSandboxOverLimit = isSandbox && amountInUsd > SANDBOX_LIMIT_USD;
                const isDisabled = isSandboxLocked || isSandboxOverLimit;

                let badgeText = '';
                if (isSandboxLocked)    badgeText = 'Trial Used — View Only';
                if (isSandboxOverLimit) badgeText = 'Above Trial Limit';

                return (
                  <div
                    key={offer.id}
                    id={`offer-card-${offer.id}`}
                    onClick={() => !isDisabled && handleSelectOffer(offer)}
                    style={{
                      border: isDisabled ? '1px solid #e2e8f0' : '1px solid #bfdbfe',
                      borderRadius: '14px', padding: '22px 26px',
                      display: 'flex', alignItems: 'center', gap: '20px',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      background: isDisabled ? '#f8fafc' : 'white',
                      opacity: isDisabled ? 0.5 : 1,
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (!isDisabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.1)'; } }}
                    onMouseLeave={e => { if (!isDisabled) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; } }}
                    title={badgeText}
                  >
                    {/* Sandbox badge */}
                    {isDisabled && badgeText && (
                      <div style={{
                        position: 'absolute', top: '-10px', right: '18px',
                        background: isSandboxLocked ? '#64748b' : '#ef4444',
                        color: 'white', fontSize: '10px', fontWeight: '800',
                        padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                      }}>
                        {badgeText}
                      </div>
                    )}

                    {/* Left: ID + type */}
                    <div style={{ flex: '0 0 22%' }}>
                      <div style={{
                        fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8',
                        marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        Offer
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', wordBreak: 'break-all' }}>
                        {offer.id.slice(0, 8)}…
                      </div>
                      <div style={{
                        marginTop: '6px', display: 'inline-block',
                        fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                        background: offer.swap_type === 'IMMEDIATE' ? '#dbeafe' : '#f3e8ff',
                        color:      offer.swap_type === 'IMMEDIATE' ? '#1d4ed8'  : '#7c3aed',
                      }}>
                        {offer.swap_type}
                      </div>
                    </div>

                    {/* Center-left: They offer */}
                    <div style={{ flex: '0 0 22%' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        They offer
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '22px', color: '#0f172a' }}>
                        {Number(offer.amount_offered).toLocaleString()} <span style={{ fontSize: '14px', color: '#64748b' }}>{offer.currency_offered}</span>
                      </div>
                    </div>

                    {/* Center: Rate badge */}
                    <div style={{ flex: '0 0 14%', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        Rate
                      </div>
                      <div style={{
                        fontWeight: '700', fontSize: '14px', color: '#374151',
                        background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', display: 'inline-block',
                      }}>
                        {Number(offer.exchange_rate).toFixed(4)}
                      </div>
                    </div>

                    {/* Center-right: You receive */}
                    <div style={{ flex: '0 0 22%' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        You receive
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '22px', color: '#15803d' }}>
                        {Number(offer.amount_wanted).toLocaleString()} <span style={{ fontSize: '14px', color: '#64748b' }}>{offer.currency_wanted}</span>
                      </div>
                    </div>

                    {/* Right: Fee + arrow */}
                    <div style={{ flex: '1', textAlign: 'right' }}>
                      {offer.fee_total > 0 && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                          Fee: {Number(offer.fee_total).toFixed(4)} {offer.currency_offered}
                        </div>
                      )}
                      <div style={{
                        color: isDisabled ? '#cbd5e1' : '#2563eb',
                        fontSize: '26px', fontWeight: 'bold', lineHeight: 1,
                      }}>
                        →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}