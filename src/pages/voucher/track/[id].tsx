import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../../components/Header';

type VoucherStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';

interface VoucherData {
    id: string;
    owner_id: string;
    voucher_code: string;
    status: VoucherStatus;
    retailer_id: string;
    retailer_name: string;
    amount_local: number;
    local_currency: string;
    amount_usd: number;
    beneficiary_name: string;
    beneficiary_phone: string;
    delivery_method: string;
    delivery_status: string;
    delivered_at: string | null;
    redeemed_at: string | null;
    redemption_store_id: string | null;
    historical_redemption_anchor: { lat: number; lng: number; city?: string } | null;
    created_at: string;
    expires_at: string;
}

const STEPS = [
    { key: 'created',   label: 'Voucher Created',          icon: '🎟️' },
    { key: 'delivered', label: 'Sent via WhatsApp',         icon: '📱' },
    { key: 'redeemed',  label: 'Redeemed at Store',         icon: '✅' },
];

export default function VoucherTrack() {
    const router = useRouter();
    const { id } = router.query as { id: string };
    const [voucher, setVoucher] = useState<VoucherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        const fetch_ = async () => {
            try {
                const res = await fetch(`/api/vouchers/${id}`);
                if (!res.ok) throw new Error('Voucher not found');
                setVoucher(await res.json());
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetch_();
        const interval = setInterval(fetch_, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [id]);

    const currentStep = voucher
        ? voucher.status === 'REDEEMED' ? 2
        : voucher.delivery_status === 'SENT' ? 1
        : 0
        : -1;

    const fmt = (d: string | null) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
            <Head><title>Symmetri | Track Voucher</title></Head>
            <Header />
            <main style={{ maxWidth: '540px', margin: '0 auto', padding: '40px 20px' }}>

                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#7c3aed', letterSpacing: '0.1em', marginBottom: '6px' }}>Phase 1 · Closed-Loop</div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'white', margin: '0 0 6px' }}>Voucher Tracking</h1>
                    {voucher && <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>For {voucher.beneficiary_name} · {voucher.retailer_name}</p>}
                </div>

                {loading && <div style={{ color: '#64748b', textAlign: 'center', padding: '60px 0' }}>Loading…</div>}
                {error && <div style={{ color: '#f87171', padding: '20px', background: '#1e1e2e', borderRadius: '12px' }}>{error}</div>}

                {voucher && (<>
                    {/* Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px' }}>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Status</div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: voucher.status === 'REDEEMED' ? '#22c55e' : voucher.status === 'EXPIRED' ? '#f87171' : '#a78bfa' }}>
                                {voucher.status}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>
                                {Number(voucher.amount_local).toLocaleString('en-US', { minimumFractionDigits: 2 })} {voucher.local_currency}
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>at {voucher.retailer_name}</div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div style={{ background: '#1e293b', borderRadius: '16px', padding: '28px', marginBottom: '24px' }}>
                        <div style={{ fontWeight: '700', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>Timeline</div>
                        {STEPS.map((s, i) => {
                            const done = i <= currentStep;
                            const active = i === currentStep + 1;
                            const detail = i === 0 ? fmt(voucher.created_at)
                                : i === 1 ? (voucher.delivery_status === 'SENT' ? `Delivered to ${voucher.beneficiary_phone}` : voucher.delivery_status === 'FAILED' ? '⚠ Delivery failed' : 'Waiting…')
                                : voucher.redeemed_at ? `${fmt(voucher.redeemed_at)}${voucher.historical_redemption_anchor?.city ? ` · ${voucher.historical_redemption_anchor.city}` : ''}` : 'Waiting for redemption…';
                            return (
                                <div key={s.key} style={{ display: 'flex', gap: '16px', minHeight: i < STEPS.length - 1 ? '64px' : 'auto' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: done ? '#7c3aed' : active ? '#1e40af' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                                            {done ? s.icon : '○'}
                                        </div>
                                        {i < STEPS.length - 1 && <div style={{ flex: 1, width: '2px', background: done && i < currentStep ? '#7c3aed' : '#334155', margin: '4px 0' }} />}
                                    </div>
                                    <div style={{ paddingBottom: '20px', opacity: done || active ? 1 : 0.4 }}>
                                        <div style={{ fontWeight: '700', color: done ? 'white' : '#64748b', fontSize: '15px' }}>{s.label}</div>
                                        <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{detail}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Redemption Location */}
                    {voucher.historical_redemption_anchor && (
                        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                            <div style={{ fontWeight: '700', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>📍 Redeemed At</div>
                            <div style={{ fontWeight: '700', color: 'white', fontSize: '18px' }}>{voucher.historical_redemption_anchor.city || voucher.redemption_store_id || 'Mexico'}</div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{voucher.retailer_name} · {fmt(voucher.redeemed_at)}</div>
                            <button onClick={() => router.push('/retailer-map')} style={{ marginTop: '14px', padding: '10px 18px', background: '#7c3aed', color: 'white', fontWeight: '600', fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                🗺 View on Map
                            </button>
                        </div>
                    )}

                    {/* Code (masked for security) */}
                    <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Voucher Code</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '15px', color: '#a78bfa', fontWeight: '700' }}>
                                {voucher.voucher_code.slice(0, 8)}••••{voucher.voucher_code.slice(-4)}
                            </div>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(voucher.voucher_code); }} style={{ padding: '8px 14px', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                            Copy
                        </button>
                    </div>

                    {/* Actions */}
                    <button onClick={() => router.push('/dashboard')} style={{ width: '100%', padding: '14px', background: 'none', color: '#475569', fontWeight: '500', fontSize: '14px', border: 'none', cursor: 'pointer' }}>
                        ← Back to Dashboard
                    </button>
                </>)}
            </main>
        </div>
    );
}
