import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export default function SendPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [hovered, setHovered] = useState<'voucher' | 'swap' | null>(null);

    const kycStatus = (user?.kycStatus || user?.kyc_status || 'EMPTY').toUpperCase();
    const hasApprovedKyc = kycStatus === 'APPROVED';

    const handleSwapClick = async () => {
        if (!user) { router.push('/signin'); return; }
        const restrictedStatuses = ['NONE', 'EMPTY', 'INCOMPLETE', 'NOT_STARTED'];
        if (restrictedStatuses.includes(kycStatus)) {
            router.push('/kyc');
            return;
        }
        sessionStorage.removeItem('trueque_swap_state');
        sessionStorage.removeItem('smart_intent');
        try {
            const res = await fetch('/api/drafts');
            const data = await res.json();
            const drafts = Array.isArray(data) ? data : (data.drafts || []);
            const activeDraft = drafts.find((d: any) => d.status === 'DRAFT');
            if (activeDraft) {
                router.push({ pathname: '/amount-selection', query: { draftId: activeDraft.id } });
            } else {
                const createRes = await fetch('/api/drafts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                if (createRes.ok) {
                    const createData = await createRes.json();
                    router.push({ pathname: '/amount-selection', query: { draftId: createData.id || createData.draft_id } });
                }
            }
        } catch {
            router.push('/amount-selection');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', fontFamily: "'Inter', sans-serif" }}>
            <Head>
                <title>Symmetri | Send Value</title>
                <meta name="description" content="Send purchasing power to family. Redeemable at their preferred grocery store. Mid-market rate, zero Symmetri fees." />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" />
            </Head>
            <Header />

            <main style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 24px' }}>

                {/* Hero */}
                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(167,139,250,0.4)', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#a78bfa', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>
                        Symmetri · Fair Value Protocol
                    </div>
                    <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: '900', color: 'white', margin: '0 0 16px', lineHeight: 1.1 }}>
                        What value would<br />you like to send?
                    </h1>
                    <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)', margin: 0, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                        Mid-market rate on every transfer. Zero Symmetri fees. Always.
                    </p>
                </div>

                {/* Product Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '48px' }}>

                    {/* ── PHASE 1 – VOUCHER ── */}
                    <button
                        id="send-voucher-btn"
                        onClick={() => router.push('/voucher')}
                        onMouseEnter={() => setHovered('voucher')}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                            background: hovered === 'voucher'
                                ? 'linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(79,70,229,0.25) 100%)'
                                : 'rgba(255,255,255,0.05)',
                            border: hovered === 'voucher' ? '2px solid rgba(167,139,250,0.7)' : '2px solid rgba(255,255,255,0.1)',
                            borderRadius: '24px',
                            padding: '36px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.25s ease',
                            transform: hovered === 'voucher' ? 'translateY(-4px)' : 'none',
                            boxShadow: hovered === 'voucher' ? '0 20px 60px rgba(124,58,237,0.25)' : '0 4px 20px rgba(0,0,0,0.2)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div style={{ fontSize: '48px', lineHeight: 1 }}>🎟️</div>
                            <div style={{ display: 'flex', gap: '6px', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', background: 'rgba(124,58,237,0.25)', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Phase 1 · Live
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#4ade80', background: 'rgba(74,222,128,0.12)', padding: '3px 10px', borderRadius: '20px' }}>
                                    ✓ No MTL Required
                                </span>
                            </div>
                        </div>

                        <div style={{ fontWeight: '800', fontSize: '22px', color: 'white', marginBottom: '10px' }}>
                            Send Value
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '24px' }}>
                            Your family receives a code redeemable at their preferred grocery store or convenience store. Minimum $20 USD.
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                            {['🏪 Redeemable at 20,000+ store locations', '⚡ Code delivered via WhatsApp', '✦ Zero Symmetri fees', '📉 Real mid-market rate'].map(item => (
                                <div key={item} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '8px' }}>{item}</div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(124,58,237,0.3)', borderRadius: '14px', border: '1px solid rgba(167,139,250,0.3)' }}>
                            <span style={{ fontWeight: '700', color: 'white', fontSize: '15px' }}>Send Voucher Now</span>
                            <span style={{ fontSize: '20px', color: '#a78bfa' }}>→</span>
                        </div>
                    </button>

                    {/* ── PHASE 2 – P2P SWAP ── */}
                    <button
                        id="send-swap-btn"
                        onClick={handleSwapClick}
                        onMouseEnter={() => setHovered('swap')}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                            background: hovered === 'swap'
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(255,255,255,0.03)',
                            border: hovered === 'swap' ? '2px solid rgba(99,179,237,0.5)' : '2px solid rgba(255,255,255,0.07)',
                            borderRadius: '24px',
                            padding: '36px',
                            cursor: hasApprovedKyc ? 'pointer' : 'default',
                            textAlign: 'left',
                            transition: 'all 0.25s ease',
                            transform: hovered === 'swap' && hasApprovedKyc ? 'translateY(-4px)' : 'none',
                            boxShadow: hovered === 'swap' ? '0 20px 60px rgba(0,112,243,0.15)' : 'none',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div style={{ fontSize: '48px', lineHeight: 1 }}>💱</div>
                            <div style={{ display: 'flex', gap: '6px', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#93c5fd', background: 'rgba(59,130,246,0.2)', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Phase 2 · Coming Soon
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#fbbf24', background: 'rgba(251,191,36,0.12)', padding: '3px 10px', borderRadius: '20px' }}>
                                    ⚠ MTL Required
                                </span>
                            </div>
                        </div>

                        <div style={{ fontWeight: '800', fontSize: '22px', color: 'rgba(255,255,255,0.85)', marginBottom: '10px' }}>
                            Swap Currencies P2P
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: '24px' }}>
                            Match with someone sending the opposite direction. Both sides settle instantly on domestic rails — no cross-border wire, no custody.
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                            {[
                                '🔗 Peer-to-peer matching engine',
                                '⚡ Immediate settlement — RTP or Card only',
                                '💳 Card: issuer fee + gateway liquidity fee',
                                '🏦 No ACH — instant rails required',
                                '✶ 1.5% Symmetri swap fee — both parties',
                                '📊 Full KYC required (APPROVED)',
                                '🔐 Trade Room identity (SID)',
                            ].map(item => (
                                <div key={item} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>{item}</div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,255,255,0.06)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontWeight: '700', color: 'rgba(255,255,255,0.5)', fontSize: '15px' }}>
                                {hasApprovedKyc ? 'Start Swap →' : 'KYC Approval Required'}
                            </span>
                            {!hasApprovedKyc && (
                                <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '600', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); router.push('/kyc'); }}>
                                    Complete KYC →
                                </span>
                            )}
                        </div>
                    </button>
                </div>

                {/* Bottom trust bar */}
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '32px' }}>
                    {[
                        { icon: '⚖️', label: 'Mid-market rate always' },
                        { icon: '🔒', label: 'No fund custody' },
                        { icon: '✦', label: 'Phase 1: Zero Symmetri fees' },
                        { icon: '⚡', label: 'Phase 2: 1.5% swap fee — both sides' },
                    ].map(({ icon, label }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: '500' }}>
                            <span style={{ fontSize: '16px' }}>{icon}</span>
                            {label}
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
}
