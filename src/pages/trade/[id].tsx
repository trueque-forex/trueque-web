import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { PaymentInstructions } from '@/components/TradeRoom/PaymentInstructions';
import { TradeDetails } from '@/types/trade';

/**
 * SYMMETRI SECURE TRADE ROOM (v2.1)
 * Location: src/pages/trade/[id].tsx
 * * CORE LOGIC:
 * - Dynamic instructions based on Corridor (Natural vs. Synthetic).
 * - Real-time polling for "Double-Symmetry" verification.
 * - Non-custodial fee transparency.
 */

export default function TradeRoom() {
  const router = useRouter();
  const { id, viewer } = router.query;
  const [trade, setTrade] = useState<TradeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [signalling, setSignalling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchTradeState = async () => {
      try {
        const viewerParam = viewer ? `&viewer=${viewer}` : '';
        const res = await fetch(`/api/trades/details?id=${id}${viewerParam}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setTrade(data);
        setLoading(false);
        if (data.status === 'COMPLETED') clearInterval(polling);
      } catch (err: any) {
        console.error('Trade room load error:', err);
        setError(err.message || 'Failed to load trade');
        setLoading(false);
      }
    };

    const polling = setInterval(fetchTradeState, 5000);
    fetchTradeState();

    return () => clearInterval(polling);
  }, [id]);

  if (loading || !trade) return <LoadingState />;
  if (error) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#ef4444' }}>
      <div style={{ fontSize: '2rem' }}>⚠️</div>
      <p style={{ fontWeight: '600' }}>Failed to load trade room</p>
      <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{error}</p>
    </div>
  );

  // Dynamic Metadata based on the Corridor Type
  const isSynthetic = trade.type === 'SYNTHETIC';

  const handleSignalFunding = async () => {
    setSignalling(true);
    try {
      const res = await fetch('/api/trades/signal-funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade_id: id, viewer_id: viewer })
      });
      const data = await res.json();
      if (data.success || data.status) {
        setTrade(prev => prev ? { ...prev, status: data.status, inbound_confirmed: true } : prev);
      }
    } catch (err) {
      console.error('Signal Error:', err);
    } finally {
      setSignalling(false);
    }
  };

  return (
    <div className="symmetri-container">
      <Head>
        <title>Symmetri | {isSynthetic ? 'Synthetic' : 'Direct'} Swap {id}</title>
      </Head>

      <header className="room-header">
        <div className="title-group">
          <h1>Secure Swap Room</h1>
          <p className="id-tag">Orchestration ID: <span>{trade.id}</span></p>
        </div>
        <div className="status-steps">
          <Badge label="Match Verified" state="success" check={true} />
          <Badge
            label="My Leg Funded"
            state={trade.status === 'FUNDING_SIGNALED' || trade.inbound_confirmed ? "success" : "warning"}
            check={trade.status === 'FUNDING_SIGNALED' || trade.inbound_confirmed}
          />
          <Badge
            label="Final Delivery"
            state={trade.status === 'COMPLETED' ? "success" : "neutral"}
            check={trade.status === 'COMPLETED'}
          />
        </div>
      </header>

      <main className="main-grid">
        {/* SECTION 1: THE INBOUND (SWAPPER ACTION) */}
        <section className="card inbound-card">
          <div className="step-tag">Phase 1</div>
          <h2>{isSynthetic ? 'Synthetic Payout Leg' : 'Funding My Swap Leg'}</h2>
          <p className="description">
            {isSynthetic
              ? `Fund the domestic leg to the Symmetri Gateway. This allows the counterparty to receive their local rail payment instantly.`
              : `Fund the local Symmetri Gateway leg to initiate the symmetric payout to your beneficiary.`
            }
          </p>

          <div className="amount-box">
            <div className="fee-row">
              <span>Swap Principal:</span>
              <span>{trade.amount} {trade.sent_currency}</span>
            </div>
            <div className="fee-row divider">
              <span>{isSynthetic ? 'Symmetry & Rail Fees' : 'Gateway & Rail Fees'}:</span>
              <span>{trade.total_fees || '0.00'} {trade.sent_currency}</span>
            </div>
            <div className="total-row">
              <span>Total to Fund:</span>
              <span className="primary-text">{trade.total_to_pay || trade.amount} {trade.sent_currency}</span>
            </div>
          </div>

          <PaymentInstructions data={trade.payment_instructions} />

          {trade.status !== 'FUNDING_SIGNALED' && !trade.inbound_confirmed && (
            <button className="signal-btn" onClick={handleSignalFunding} disabled={signalling}>
              {signalling ? 'Signalling...' : 'I have funded my leg'}
            </button>
          )}
        </section>

        {/* SECTION 2: THE OUTBOUND (BENEFICIARY STATUS) */}
        <section className="card outbound-card">
          <div className="step-tag">Phase 2</div>
          <h2>Counterparty Delivery</h2>
          <p className="description">
            Value is released in {trade.received_currency || '...'} once symmetry is detected and validated on the rails.
          </p>

          <div className="payout-status-box">
            <div className="beneficiary-label">Target Beneficiary</div>
            <div className="beneficiary-name">{trade.beneficiary_name || '...'}</div>

            <div className="payout-amount">
              {trade.received_amount || '0.00'} {trade.received_currency || ''}
            </div>
            <div className="payout-method">
              Via: <strong>{trade.payout_method || 'Rail'}</strong>
            </div>

            <div className="status-indicator">
              {trade.status === 'COMPLETED' ? (
                <div className="success-state">
                  <span className="check-icon">✓</span>
                  <h3>Symmetry Established</h3>
                  <p>Funds delivered successfully.</p>
                </div>
              ) : (
                <div className="waiting-state">
                  <div className="pulse-dot"></div>
                  <p>Detecting Symmetry...</p>
                  <p className="sub-text">Waiting for rail verification.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="room-footer">
        <p>🛡️ <strong>Symmetri Protocol:</strong> Non-custodial orchestration. We do not touch funds; we only verify and signal domestic local rails.</p>
      </footer>

      <style jsx>{`
        .symmetri-container { font-family: 'Inter', sans-serif; max-width: 1100px; margin: 0 auto; padding: 40px 20px; color: #1e293b; }
        .room-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 40px; }
        .id-tag { color: #64748b; font-size: 0.85rem; margin-top: 4px; }
        .id-tag span { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #0f172a; }
        .status-steps { display: flex; gap: 8px; }
        .main-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 40px; }
        .card { padding: 32px; border-radius: 20px; position: relative; }
        .inbound-card { border: 2px solid #3b82f6; background: #fff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .outbound-card { background: #f8fafc; border: 1px solid #e2e8f0; }
        .step-tag { position: absolute; top: -14px; left: 24px; background: #3b82f6; color: #fff; padding: 6px 14px; border-radius: 30px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        .amount-box { background: #eff6ff; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #dbeafe; }
        .fee-row { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 10px; color: #475569; }
        .divider { padding-bottom: 12px; border-bottom: 1px solid #bfdbfe; }
        .total-row { display: flex; justify-content: space-between; font-weight: 800; font-size: 1.4rem; margin-top: 14px; }
        .primary-text { color: #2563eb; }
        .payout-status-box { text-align: center; }
        .beneficiary-name { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 10px 0 30px 0; }
        .payout-amount { font-size: 2.8rem; font-weight: 900; color: #15803d; letter-spacing: -1px; }
        .payout-method { font-size: 0.85rem; color: #64748b; margin-top: 10px; background: #f1f5f9; display: inline-block; padding: 4px 12px; border-radius: 10px; }
        .status-indicator { margin-top: 50px; }
        .check-icon { font-size: 3.5rem; display: block; margin-bottom: 12px; animation: bounce 0.5s ease-out; }
        .waiting-state { color: #92400e; font-weight: 700; }
        .sub-text { font-size: 0.8rem; color: #94a3b8; font-weight: 400; margin-top: 6px; }
        .pulse-dot { width: 14px; height: 14px; background: #f59e0b; border-radius: 50%; margin: 0 auto 15px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .room-footer { margin-top: 80px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 0.85rem; }
        .signal-btn { width: 100%; margin-top: 24px; background: #2563eb; color: #fff; padding: 16px; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4); }
        .signal-btn:hover { background: #1d4ed8; transform: translateY(-1px); }
        .signal-btn:active { transform: translateY(0); }
      `}</style>
    </div>
  );
}

function Badge({ label, state, check }: { label: string, state: string, check: boolean }) {
  const styles: any = {
    success: { bg: '#dcfce7', text: '#166534' },
    warning: { bg: '#fffbeb', text: '#92400e' },
    neutral: { bg: '#f1f5f9', text: '#64748b' }
  };
  return (
    <div style={{
      padding: '8px 16px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase',
      background: styles[state].bg, color: styles[state].text, display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${styles[state].text}20`
    }}>
      {check && '✓'} {label}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '20px' }}>
      <div className="spinner"></div>
      <p style={{ fontWeight: '600', letterSpacing: '0.05em' }}>VERIFYING SYMMETRIC MATCH...</p>
      <style jsx>{`
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}