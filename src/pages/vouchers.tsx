import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header';

type VoucherStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'PENDING_PAYMENT';

type Voucher = {
    id: string;
    voucher_code: string;
    status: VoucherStatus;
    retailer_name: string;
    amount_usd: string;
    amount_local: string;
    local_currency: string;
    beneficiary_name: string;
    beneficiary_phone: string;
    delivery_status: string;
    redeemed_at: string | null;
    historical_redemption_anchor: { lat: number; lng: number; city?: string } | null;
    created_at: string;
    expires_at: string;
};

const STATUS_STYLE: Record<VoucherStatus, { color: string; bg: string; label: string }> = {
    ACTIVE:          { color: '#7c3aed', bg: '#f5f3ff', label: 'Active' },
    REDEEMED:        { color: '#16a34a', bg: '#f0fdf4', label: 'Redeemed' },
    EXPIRED:         { color: '#dc2626', bg: '#fef2f2', label: 'Expired' },
    PENDING_PAYMENT: { color: '#d97706', bg: '#fffbeb', label: 'Pending' },
};

export default function VouchersPage() {
    const router = useRouter();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | VoucherStatus>('ALL');

    useEffect(() => {
        fetch('/api/vouchers/list?limit=50')
            .then(r => r.json())
            .then(d => setVouchers(d.vouchers || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const displayed = filter === 'ALL' ? vouchers : vouchers.filter(v => v.status === filter);
    const counts = {
        ALL:     vouchers.length,
        ACTIVE:  vouchers.filter(v => v.status === 'ACTIVE').length,
        REDEEMED: vouchers.filter(v => v.status === 'REDEEMED').length,
        EXPIRED: vouchers.filter(v => v.status === 'EXPIRED').length,
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Inter', sans-serif" }}>
            <Head>
                <title>Symmetri | My Vouchers</title>
                <meta name="description" content="View all your Symmetri vouchers — active, redeemed, or expired." />
            </Head>
            <Header />

            <main style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 20px' }}>

                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#7c3aed', letterSpacing: '0.1em', marginBottom: '6px' }}>Phase 1 · Voucher History</div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 }}>My Vouchers</h1>
                    </div>
                    <button
                        id="vouchers-send-new-btn"
                        onClick={() => router.push('/voucher')}
                        style={{ padding: '12px 22px', background: '#7c3aed', color: 'white', fontWeight: '700', fontSize: '14px', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
                    >
                        🎟️ Send New Voucher
                    </button>
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {(['ALL', 'ACTIVE', 'REDEEMED', 'EXPIRED'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                background: filter === f ? '#7c3aed' : 'white',
                                color: filter === f ? 'white' : '#64748b',
                                boxShadow: filter === f ? '0 2px 8px rgba(124,58,237,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
                                transition: 'all 0.15s',
                            }}
                        >
                            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                            <span style={{ marginLeft: '6px', padding: '1px 7px', background: filter === f ? 'rgba(255,255,255,0.25)' : '#f1f5f9', borderRadius: '10px', fontSize: '11px' }}>
                                {counts[f] ?? vouchers.filter(v => v.status === f).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Voucher list */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading vouchers…</div>
                ) : displayed.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎟️</div>
                        <div style={{ color: '#64748b', fontSize: '16px', marginBottom: '20px' }}>
                            {filter === 'ALL' ? "You haven't sent any vouchers yet." : `No ${filter.toLowerCase()} vouchers.`}
                        </div>
                        <button onClick={() => router.push('/voucher')}
                            style={{ padding: '12px 24px', background: '#7c3aed', color: 'white', fontWeight: '700', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                            Send Your First Voucher
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {displayed.map(v => {
                            const st = STATUS_STYLE[v.status] || STATUS_STYLE.ACTIVE;
                            const created = new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            return (
                                <div
                                    key={v.id}
                                    id={`voucher-row-${v.id}`}
                                    onClick={() => router.push(`/voucher/track/${v.id}`)}
                                    style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.15s, transform 0.15s', display: 'flex', alignItems: 'center', gap: '16px' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#7c3aed'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                                >
                                    {/* Retailer icon placeholder */}
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                                        {v.status === 'REDEEMED' ? '✅' : v.status === 'EXPIRED' ? '❌' : '🎟️'}
                                    </div>

                                    {/* Main info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b', marginBottom: '2px' }}>
                                            {v.retailer_name} → {v.beneficiary_name || 'Beneficiary'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                            {created}
                                            {v.status === 'REDEEMED' && v.historical_redemption_anchor?.city && ` · Redeemed in ${v.historical_redemption_anchor.city}`}
                                        </div>
                                    </div>

                                    {/* Amount + status */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>
                                            ${parseFloat(v.amount_usd).toFixed(2)} USD
                                        </div>
                                        <div style={{ fontSize: '11px', fontWeight: '700', color: st.color, background: st.bg, padding: '3px 10px', borderRadius: '20px', display: 'inline-block' }}>
                                            {st.label}
                                        </div>
                                    </div>

                                    <span style={{ color: '#cbd5e1', fontSize: '18px', flexShrink: 0 }}>›</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
