import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import brandConfig from '../config/brand_config.json';

export default function Dashboard() {
    const { user, loading, refreshSession } = useAuth();
    const router = useRouter();

    // FORCE REFRESH: Ensure stale 'PENDING' status is updated to 'APPROVED' immediately
    useEffect(() => {
        refreshSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Default Fallbacks if context empty (shouldn't happen if guarded, but safe for dev)
    const userName = user?.name || 'User';
    const kycStatus = user?.kycStatus || 'PENDING';
    const userType = user?.userType || 'PEER'; // Default to PEER if undefined
    const rejectionReason = 'Identity document expired'; // Dynamic if we add to context later

    const [recentSwaps, setRecentSwaps] = useState<any[]>([]);
    const [savedBeneficiaries, setSavedBeneficiaries] = useState<any[]>([]);
    const [drafts, setDrafts] = useState<any[]>([]);
    const [recentVouchers, setRecentVouchers] = useState<any[]>([]);

    useEffect(() => {
        // Redirect if not logged in (Client-side Guard)
        if (!loading && !user) {
            console.warn('Dashboard: User missing. Loop prevention active (No Redirect).');
            return;
        }

        async function fetchHistory() {
            try {
                // Fetch Transactions
                const res = await fetch('/api/transactions');
                if (res.ok) {
                    const data = await res.json();
                    setRecentSwaps(data.transactions || []);

                    // (Beneficiary Extraction Logic preserved...)
                    const historyBens = (data.transactions || [])
                        .filter((s: any) => s.status === 'Delivered' || s.status === 'COMPLETED')
                        .map((s: any) => ({
                            personal: {
                                firstName: s.recipient.split(' ')[0],
                                lastName: s.recipient.split(' ').slice(1).join(' ') || ''
                            },
                            banking: {
                                bankName: 'Saved from History',
                                accountNumber: '****' // No real account number in summary yet
                            }
                        }));

                    // Load Saved
                    const savedBensRaw = localStorage.getItem('trueque_saved_beneficiaries');
                    let currentBens: any[] = [];
                    if (savedBensRaw) {
                        try { currentBens = JSON.parse(savedBensRaw); } catch { }
                    }

                    // Merge Unique
                    const merged = [...currentBens];
                    historyBens.forEach((hb: any) => {
                        const exists = merged.find(b =>
                            b.personal.firstName === hb.personal.firstName &&
                            b.personal.lastName === hb.personal.lastName
                        );
                        if (!exists) merged.push(hb);
                    });

                    setSavedBeneficiaries(merged);
                    localStorage.setItem('trueque_saved_beneficiaries', JSON.stringify(merged));
                }

                // Fetch Drafts
                const draftRes = await fetch('/api/drafts');
                if (draftRes.ok) {
                    const draftData = await draftRes.json();
                    setDrafts(draftData);
                }

                // Fetch Vouchers (Phase 1)
                const vRes = await fetch('/api/vouchers/list');
                if (vRes.ok) {
                    const vData = await vRes.json();
                    setRecentVouchers(vData.vouchers || []);
                }

            } catch (err) {
                console.error('Failed to load dashboard data', err);
            }
        }

        fetchHistory();

    }, [user, loading, router]);


    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Dashboard...</div>;

    // --- MERCHANT VIEW START ---
    if (userType === 'MERCHANT') {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
                <Header />
                <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h1 style={{ color: '#2c3e50', margin: 0 }}>Business Portal: {userName}</h1>
                        <p style={{ color: '#7f8c8d' }}>Manage settlements and view voucher activity.</p>
                    </div>
                </main>
            </div>
        );
    }
    // --- MERCHANT VIEW END ---

    const handleStartSwap = async () => {
        // --- 1. THE SECURITY GATE (Priority 1: The "Empty Profile Block") ---
        // Rule: If kycStatus is missing or 'NONE', the user hasn't started/submitted profile.
        // We verify this immediately before any draft/limit logic.

        // Ensure user is loaded
        if (!user) return;

        const currentKycStatus = (user.kycStatus || user.kyc_status || 'NONE').toUpperCase();
        const restrictedStatuses = ['NONE', 'EMPTY', 'INCOMPLETE', 'NOT_STARTED'];

        // Strict Block for Empty/None/Incomplete logic (Prompt Requirement)
        if (restrictedStatuses.includes(currentKycStatus)) {
            console.log(`[Security Gate] Restricted Status (${currentKycStatus}) detected. Redirecting to /kyc.`);
            router.push('/kyc');
            return;
        }

        // Cleanup Stale State
        sessionStorage.removeItem('trueque_swap_state');
        sessionStorage.removeItem('smart_intent');

        // --- 2. DRAFT LOGIC (Priority 2: Intent Tracking) ---
        // "Once the user passes the Empty Profile Block..."

        try {
            // A. Check Active Draft
            const res = await fetch('/api/drafts');
            const data = await res.json();

            // Handle array response from proximal API
            const drafts = Array.isArray(data) ? data : (data.drafts || []);
            const activeDraft = drafts.find((d: any) => d.status === 'DRAFT');

            if (activeDraft) {
                // RESUME
                console.log('[Draft Logic] Resuming active draft:', activeDraft.id);
                // Redirect to wizard with draft ID
                router.push({
                    pathname: '/amount-selection',
                    query: { draftId: activeDraft.id }
                });
            } else {
                // NEW DRAFT
                console.log('[Draft Logic] Creating new draft');
                const createRes = await fetch('/api/drafts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });

                if (createRes.ok) {
                    const createData = await createRes.json();
                    router.push({
                        pathname: '/amount-selection',
                        query: { draftId: createData.id || createData.draft_id }
                    });
                } else {
                    console.error('Failed to create draft');
                    alert("System Error: Could not initialization transaction. Please contact support.");
                }
            }
        } catch (e) {
            console.error('[Draft Logic] Check failed', e);
            alert("Network Error. Please try again.");
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Header />
            <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>

                    {/* LEFT COLUMN: ACTION & BENEFICIARIES */}
                    <div>
                        {/* TWO-PRODUCT SELECTOR */}
                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={{ color: '#2c3e50', marginTop: 0, marginBottom: '16px' }}>What would you like to do?</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                                {/* PHASE 1 — SEND VALUE */}
                                <div
                                    style={{ background: 'white', borderRadius: '16px', padding: '24px', cursor: 'pointer', border: '2px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'border-color 0.2s, transform 0.15s', position: 'relative', overflow: 'hidden' }}
                                    onClick={() => router.push('/send')}
                                    onMouseEnter={e => {
                                        const el = e.currentTarget as HTMLDivElement;
                                        el.style.borderColor = '#1A73E8';
                                        el.style.transform = 'translateY(-2px)';
                                        const tip = el.querySelector('.quick-send-tip') as HTMLElement;
                                        if (tip) tip.style.opacity = '1';
                                    }}
                                    onMouseLeave={e => {
                                        const el = e.currentTarget as HTMLDivElement;
                                        el.style.borderColor = '#e2e8f0';
                                        el.style.transform = 'none';
                                        const tip = el.querySelector('.quick-send-tip') as HTMLElement;
                                        if (tip) tip.style.opacity = '0';
                                    }}
                                >
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎟️</div>
                                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b', marginBottom: '6px' }}>Send Value</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
                                        Your family receives purchasing power redeemable at their preferred grocery store. Mid-market rate, zero Symmetri fees.
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#1A73E8', background: '#eff6ff', padding: '4px 10px', borderRadius: '20px', display: 'inline-block' }}>No MTL Required</div>

                                    {/* Quick-send hover tooltip for returning users */}
                                    <div
                                        className="quick-send-tip"
                                        onClick={e => { e.stopPropagation(); router.push('/voucher'); }}
                                        style={{
                                            position: 'absolute', bottom: '12px', right: '12px',
                                            background: '#1A73E8', color: 'white',
                                            padding: '5px 12px', borderRadius: '20px',
                                            fontSize: '11px', fontWeight: '700',
                                            opacity: 0, transition: 'opacity 0.15s',
                                            cursor: 'pointer', pointerEvents: 'auto',
                                            boxShadow: '0 2px 8px rgba(26,115,232,0.4)',
                                        }}
                                        title="Skip to voucher — for returning users"
                                    >
                                        Quick Send ⚡
                                    </div>
                                </div>

                                {/* PHASE 2 — P2P SWAP */}
                                <div
                                    onClick={handleStartSwap}
                                    style={{ background: 'white', borderRadius: '16px', padding: '24px', cursor: (kycStatus === 'PENDING' && (user?.txCount || 0) > 0) ? 'not-allowed' : 'pointer', border: '2px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'border-color 0.2s, transform 0.15s', opacity: (kycStatus === 'PENDING' && (user?.txCount || 0) > 0) ? 0.6 : 1 }}
                                    onMouseEnter={e => { if ((kycStatus !== 'PENDING') || (user?.txCount || 0) === 0) { (e.currentTarget as HTMLDivElement).style.borderColor = '#0070f3'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; } }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                                >
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>💱</div>
                                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b', marginBottom: '6px' }}>Swap Currencies</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
                                        Match with someone sending the other way. Both sides settle domestically — no cross-border wire.
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#0050b3', background: '#e6f7ff', padding: '4px 10px', borderRadius: '20px', display: 'inline-block' }}>Phase 2 · MTL Required</div>
                                </div>

                            </div>
                        </div>

                        {/* SAVED DRAFTS */}
                        {drafts.length > 0 && (
                            <section style={{ marginBottom: '30px' }}>
                                <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Your Drafts</h3>
                                <div style={{ display: 'grid', gap: '15px' }}>
                                    {drafts.map((draft) => (
                                        <div key={draft.id} style={{
                                            backgroundColor: '#fff8e1',
                                            padding: '15px',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            border: '1px solid #fce8b2',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }} onClick={() => {
                                            // Resume Draft Logic
                                            // We push to the step saved in draft
                                            // For now, assume it's "amount_selection" or route to /amount-selection with flags
                                            router.push({
                                                pathname: '/amount-selection',
                                                query: {
                                                    amount: draft.data.amount,
                                                    recipient: draft.data.recipient,
                                                    draftId: draft.id
                                                }
                                            });
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#d35400' }}>Incomplete Swap</div>
                                                <div style={{ fontSize: '13px', color: '#e67e22' }}>
                                                    {draft.data.amount} {draft.data.corridor || 'EUR'} to {draft.data.recipient || 'Unknown'}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '20px', color: '#f39c12' }}>→</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* SAVED BENEFICIARIES */}
                        <section>

                            <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Saved Beneficiaries</h3>
                            {savedBeneficiaries.length > 0 ? (
                                <div style={{ display: 'grid', gap: '15px' }}>
                                    {savedBeneficiaries.slice(0, 3).map((ben, idx) => (
                                        <div key={idx} style={{
                                            backgroundColor: 'white',
                                            padding: '15px',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            border: '1px solid #e1e8ed'
                                        }} onClick={() => {
                                            sessionStorage.removeItem('trueque_swap_state');
                                            router.push(`/amount-selection?beneficiaryId=${idx}`);
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    backgroundColor: '#e1e8ed', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 'bold', color: '#7f8c8d'
                                                }}>
                                                    {ben.personal.firstName[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#2c3e50' }}>{ben.personal.firstName} {ben.personal.lastName}</div>
                                                    <div style={{ fontSize: '13px', color: '#95a5a6' }}>{ben.banking.bankName} • {ben.banking.accountNumber?.slice(-4) || '****'}</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '20px', color: '#bdc3c7' }}>→</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#95a5a6', backgroundColor: 'white', borderRadius: '10px' }}>
                                    No saved beneficiaries yet.
                                </div>
                            )}
                        </section>
                    </div>

                    {/* RIGHT COLUMN: RECENT ACTIVITY */}
                    <div>
                        <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Recent Swaps</h3>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                            {recentSwaps.map((swap) => (
                                <div key={swap.id} style={{
                                    padding: '20px',
                                    borderBottom: '1px solid #f0f2f5'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '10px'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                                                Swap to {swap.recipient}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#95a5a6' }}>
                                                {swap.date}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px' }}>
                                                -{swap.amount}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                backgroundColor: swap.status === 'Delivered' ? '#e8f8f5' : '#fff8e1',
                                                color: swap.status === 'Delivered' ? '#27ae60' : '#f39c12',
                                                display: 'inline-block'
                                            }}>
                                                {swap.status}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details: Value Delivered & Market Rate */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        paddingTop: '10px',
                                        borderTop: '1px dashed #ecf0f1',
                                        fontSize: '13px',
                                        flexWrap: 'wrap',
                                        gap: '10px'
                                    }}>
                                        <div>
                                            <span style={{ color: '#95a5a6' }}>Value Delivered: </span>
                                            <span style={{ color: '#2c3e50', fontWeight: '500' }}>{swap.valueDelivered}</span>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <span style={{ color: '#95a5a6' }}>Market Exchange Rate: </span>
                                                <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer', marginLeft: '5px' }} title="View Market Rate Policy">
                                                    <a href="/compliance/terms" target="_blank" rel="noopener noreferrer">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <line x1="12" y1="16" x2="12" y2="12"></line>
                                                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                                        </svg>
                                                    </a>
                                                </div>
                                            </div>
                                            <span style={{ color: '#2c3e50', fontWeight: '500' }}>{swap.marketRate}</span>
                                        </div>
                                    </div>

                                    {/* Fee Breakdown (Audit) */}
                                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px', fontSize: '12px' }}>
                                        <div style={{ fontWeight: '600', color: '#7f8c8d', marginBottom: '4px' }}>Fees Breakdown</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', color: '#57606f' }}>
                                            <div>Inbound: {swap.fees.inbound}</div>
                                            <div>Liquidity: {swap.fees.liquidity}</div>
                                            <div>Service: {swap.fees.service}</div>
                                            <div>Gateway: {swap.fees.gateway}</div>
                                            <div>Premium: {swap.fees.premium}</div>
                                            {swap.fees.tax !== 'N/A' && <div style={{ color: '#c0392b' }}>Tax: {swap.fees.tax}</div>}
                                        </div>
                                    </div>


                                </div>
                            ))}
                            <div style={{ padding: '15px', textAlign: 'center', backgroundColor: '#fdfefe', cursor: 'pointer', color: '#4A90E2', fontWeight: '500' }} onClick={() => router.push('/history')}>
                                View All Activity
                            </div>
                        </div>

                        {/* RECENT VOUCHERS */}
                        <h3 style={{ color: '#34495e', marginBottom: '15px', marginTop: '30px' }}>Recent Vouchers</h3>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 15px rgba(0,0,0,0.05)' }}>
                            {recentVouchers.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#95a5a6', fontSize: '14px' }}>
                                    No vouchers sent yet.
                                </div>
                            ) : recentVouchers.slice(0, 3).map((v: any) => (
                                <div key={v.id} style={{ padding: '20px', borderBottom: '1px solid #f0f2f5', cursor: 'pointer' }}
                                    onClick={() => router.push(`/voucher/track/${v.id}`)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                                                {v.retailer_name} Voucher → {v.beneficiary_name || 'Beneficiary'}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#95a5a6' }}>
                                                {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px' }}>
                                                -{parseFloat(v.amount_usd).toFixed(2)} USD
                                            </div>
                                            <div style={{
                                                fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px', display: 'inline-block',
                                                backgroundColor: v.status === 'REDEEMED' ? '#e8f8f5' : v.status === 'EXPIRED' ? '#fdecea' : '#f5f3ff',
                                                color: v.status === 'REDEEMED' ? '#27ae60' : v.status === 'EXPIRED' ? '#c0392b' : '#7c3aed',
                                            }}>
                                                {v.status}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#bdc3c7' }}>
                                        {parseFloat(v.amount_local).toFixed(2)} {v.local_currency} · {v.retailer_name}
                                        {v.status === 'REDEEMED' && v.historical_redemption_anchor?.city
                                            ? ` · Redeemed in ${v.historical_redemption_anchor.city}`
                                            : ''}
                                    </div>
                                </div>
                            ))}
                            <div style={{ padding: '14px', textAlign: 'center', backgroundColor: '#fdfefe', cursor: 'pointer', color: '#7c3aed', fontWeight: '500', fontSize: '14px', borderTop: '1px solid #f0f2f5' }}
                                onClick={() => router.push('/vouchers')}>
                                View All Vouchers
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
