import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import retailers from '../../config/retailers.json';

/**
 * /voucher/redeem-sim
 *
 * Developer-only POS simulation tool.
 * Calls POST /api/vouchers/redeem with a code + store_id.
 * Used for e2e testing without a physical POS terminal.
 *
 * Access: visible only when ?dev=1 is in URL OR in development mode.
 */

type RedeemResult = {
    success: boolean;
    message?: string;
    error?: string;
    voucher?: {
        status: string;
        amount_local: number;
        local_currency: string;
        beneficiary_name: string;
        redeemed_at: string;
        historical_redemption_anchor: { lat: number; lng: number; city?: string } | null;
    };
};

// Flatten all store locations from all retailers
const ALL_STORES = retailers.flatMap(r =>
    (r.locations || []).map((loc: any) => ({
        store_id: loc.store_id,
        label: `${r.logo} ${r.name} — ${loc.city}`,
        city: loc.city,
        retailer: r.name,
    }))
);

export default function RedeemSimPage() {
    const router = useRouter();
    const [voucherCode, setVoucherCode] = useState('');
    const [storeId, setStoreId] = useState(ALL_STORES[0]?.store_id || '');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<RedeemResult | null>(null);

    // Guard: only show in dev or when ?dev=1 in URL
    const isDev = process.env.NODE_ENV === 'development' || router.query.dev === '1';

    if (!isDev) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', fontFamily: 'monospace' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                    <div style={{ fontSize: '18px', marginBottom: '8px' }}>403 — Not Found</div>
                    <div style={{ color: '#475569', fontSize: '14px' }}>This tool is not available in production.</div>
                </div>
            </div>
        );
    }

    const handleRedeem = async () => {
        if (!voucherCode.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/vouchers/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voucher_code: voucherCode.trim().toUpperCase(),
                    store_id: storeId || undefined,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setResult({ success: true, message: data.message, voucher: data.voucher });
            } else {
                setResult({ success: false, error: data.error || 'Redemption failed' });
            }
        } catch (err: any) {
            setResult({ success: false, error: err.message || 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
            <Head><title>Symmetri | POS Simulator [DEV]</title></Head>
            <Header />
            <main style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 20px' }}>

                {/* Dev Warning Banner */}
                <div style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '32px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px' }}>⚠️</span>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#fbbf24' }}>Developer Tool — POS Simulator</div>
                        <div style={{ fontSize: '12px', color: '#78716c' }}>Simulates a retail POS terminal redemption. Not visible in production.</div>
                    </div>
                </div>

                <div style={{ marginBottom: '28px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#7c3aed', letterSpacing: '0.1em', marginBottom: '6px' }}>Phase 1 · POS Simulation</div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'white', margin: '0 0 6px' }}>Redeem at POS</h1>
                    <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>Enter a voucher code and select any store to simulate a register scan.</p>
                </div>

                <div style={{ background: '#1e293b', borderRadius: '20px', padding: '28px' }}>

                    {/* Voucher Code */}
                    <label style={{ display: 'block', fontWeight: '600', color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                        Voucher Code
                    </label>
                    <input
                        id="redeem-sim-code"
                        type="text"
                        value={voucherCode}
                        onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="SYM-OXXO-XXXXXXXXX-XXXXX"
                        style={{ width: '100%', padding: '14px 16px', fontSize: '15px', fontFamily: 'monospace', fontWeight: '700', background: '#0f172a', border: '2px solid #334155', borderRadius: '12px', color: '#a78bfa', outline: 'none', marginBottom: '20px', boxSizing: 'border-box', letterSpacing: '0.04em' }}
                    />

                    {/* Store Select */}
                    <label style={{ display: 'block', fontWeight: '600', color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                        Store Location (POS Terminal)
                    </label>
                    <select
                        id="redeem-sim-store"
                        value={storeId}
                        onChange={e => setStoreId(e.target.value)}
                        style={{ width: '100%', padding: '14px 16px', fontSize: '14px', background: '#0f172a', border: '2px solid #334155', borderRadius: '12px', color: 'white', outline: 'none', marginBottom: '24px', cursor: 'pointer' }}
                    >
                        {ALL_STORES.map(store => (
                            <option key={store.store_id} value={store.store_id}>{store.label}</option>
                        ))}
                    </select>

                    <button
                        id="redeem-sim-submit"
                        onClick={handleRedeem}
                        disabled={loading || !voucherCode.trim()}
                        style={{ width: '100%', padding: '16px', background: loading ? '#4c1d95' : '#7c3aed', color: 'white', fontWeight: '800', fontSize: '16px', border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.3)', transition: 'background 0.2s' }}
                    >
                        {loading ? '⏳ Processing Redemption…' : '🏪 Simulate POS Redemption'}
                    </button>
                </div>

                {/* Result */}
                {result && (
                    <div style={{ marginTop: '24px', background: result.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `2px solid ${result.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '16px', padding: '24px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>{result.success ? '✅' : '❌'}</div>
                        <div style={{ fontWeight: '800', fontSize: '18px', color: result.success ? '#22c55e' : '#f87171', marginBottom: '8px' }}>
                            {result.success ? 'Redeemed Successfully!' : 'Redemption Failed'}
                        </div>

                        {result.success && result.voucher && (
                            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    ['Beneficiary', result.voucher.beneficiary_name],
                                    ['Amount', `${Number(result.voucher.amount_local).toFixed(2)} ${result.voucher.local_currency}`],
                                    ['Status', result.voucher.status],
                                    ['Location', result.voucher.historical_redemption_anchor?.city || ALL_STORES.find(s => s.store_id === storeId)?.city || '—'],
                                    ['Timestamp', new Date(result.voucher.redeemed_at).toLocaleString()],
                                ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <span style={{ color: '#64748b' }}>{label}</span>
                                        <strong style={{ color: 'white' }}>{value}</strong>
                                    </div>
                                ))}
                                <button
                                    onClick={() => { const id = voucherCode; router.push(`/voucher/track/${id}`); }}
                                    style={{ marginTop: '12px', padding: '10px', background: '#7c3aed', color: 'white', fontWeight: '600', fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    📍 Track This Voucher
                                </button>
                            </div>
                        )}

                        {!result.success && (
                            <div style={{ color: '#f87171', fontSize: '14px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                                {result.error}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '13px' }}>
                        ← Back to Dashboard
                    </button>
                </div>
            </main>
        </div>
    );
}
