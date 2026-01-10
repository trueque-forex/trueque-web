import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

export default function Dashboard() {
    const { user, loading, refreshSession } = useAuth();
    const router = useRouter();

    // FORCE REFRESH: Ensure stale 'PENDING' status is updated to 'APPROVED' immediately
    useEffect(() => {
        refreshSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Default Fallbacks if context empty (shouldn't happen if guarded, but safe for dev)
    const userName = user?.name || 'Joao Teste';
    const kycStatus = user?.kycStatus || 'PENDING';
    const userType = user?.userType || 'PEER'; // Default to PEER if undefined
    const rejectionReason = 'Identity document expired'; // Dynamic if we add to context later

    const [recentSwaps, setRecentSwaps] = useState<any[]>([]);
    const [savedBeneficiaries, setSavedBeneficiaries] = useState<any[]>([]);

    useEffect(() => {
        // Redirect if not logged in (Client-side Guard)
        if (!loading && !user) {
            console.warn('Dashboard: User missing. Loop prevention active (No Redirect).');
        }

        // 3. Mock Recent Activity (Initialize first so we can extract beneficiaries)
        // SYNC: Pulling history associated with TiD TDEV000111
        const mockHistory = [
            {
                id: 1,
                date: '2026-01-01',
                amount: '143.07 EUR',
                valueDelivered: '160,000.00 ARS',
                marketRate: '1,200.00 ARS/EUR',
                to: 'ARS',
                status: 'Delivered',
                recipient: 'Joao Teste',
                fees: { inbound: '2.30 EUR', liquidity: '0.67 EUR', service: '0.67 EUR', gateway: '2.50 EUR', premium: '2.00 EUR', tax: '1.60 EUR' }
            },
            {
                id: 2,
                date: '2025-12-30',
                amount: '150.00 EUR',
                valueDelivered: '$3,150.00 MXN',
                marketRate: '21.00 MXN/EUR',
                to: 'MXN',
                status: 'Delivered',
                recipient: 'Maria Silva',
                fees: { inbound: '2.55 EUR', liquidity: '0.75 EUR', service: '0.75 EUR', gateway: '2.50 EUR', premium: '2.25 EUR', tax: 'N/A' }
            },
        ];
        setRecentSwaps(mockHistory);

        // 2. Load Saved Beneficiaries + EXTRACT NEW ONES FROM HISTORY
        const savedBensRaw = localStorage.getItem('trueque_saved_beneficiaries');
        let currentBens: any[] = [];
        if (savedBensRaw) {
            try {
                currentBens = JSON.parse(savedBensRaw);
            } catch { }
        }

        // Logic: Add 'Delivered' recipients from history if not already saved
        const historyBens = mockHistory
            .filter(s => s.status === 'Delivered')
            .map(s => ({
                personal: {
                    firstName: s.recipient.split(' ')[0],
                    lastName: s.recipient.split(' ').slice(1).join(' ')
                },
                banking: {
                    bankName: 'Verified Local Rail', // Mock
                    accountNumber: '****' + (Math.floor(Math.random() * 9000) + 1000)
                }
            }));

        // Merge Unique (by Full Name)
        const merged = [...currentBens];
        historyBens.forEach(hb => {
            const exists = merged.find(b =>
                b.personal.firstName === hb.personal.firstName &&
                b.personal.lastName === hb.personal.lastName
            );
            if (!exists) {
                merged.push(hb);
            }
        });

        // Update State & Persistence
        setSavedBeneficiaries(merged);
        localStorage.setItem('trueque_saved_beneficiaries', JSON.stringify(merged));

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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                        {/* WALLET CARD */}
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '14px', textTransform: 'uppercase' }}>Internal Wallet Balance</h3>
                            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#27ae60' }}>
                                $ 15,430.50 <span style={{ fontSize: '16px', color: '#95a5a6' }}>MXN</span>
                            </div>
                            <div style={{ marginTop: '20px', fontSize: '13px', color: '#95a5a6' }}>
                                Next automatic settlement: Today, 17:00 CST
                            </div>
                            <button style={{
                                width: '100%', padding: '12px', marginTop: '20px',
                                backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
                            }}>
                                Request Early Settlement
                            </button>
                        </div>

                        {/* RECENT SETTLEMENTS */}
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Voucher Activity</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #f0f2f5', textAlign: 'left', color: '#95a5a6', fontSize: '13px' }}>
                                        <th style={{ padding: '10px' }}>Time</th>
                                        <th style={{ padding: '10px' }}>Voucher ID</th>
                                        <th style={{ padding: '10px' }}>Type</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #f0f2f5' }}>
                                        <td style={{ padding: '15px 10px' }}>10:42 AM</td>
                                        <td style={{ padding: '15px 10px', fontFamily: 'monospace' }}>V-9982-X</td>
                                        <td style={{ padding: '15px 10px' }}>Redemption</td>
                                        <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: 'bold' }}>+ $500.00</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #f0f2f5' }}>
                                        <td style={{ padding: '15px 10px' }}>09:15 AM</td>
                                        <td style={{ padding: '15px 10px', fontFamily: 'monospace' }}>V-2211-A</td>
                                        <td style={{ padding: '15px 10px' }}>Redemption</td>
                                        <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: 'bold' }}>+ $1,200.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        );
    }
    // --- MERCHANT VIEW END ---

    const handleStartSwap = () => {
        // Ensure fresh start
        sessionStorage.removeItem('trueque_swap_state');
        router.push('/amount-selection');
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Header />
            <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>

                {/* WELCOME HEADER */}
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h1 style={{ color: '#2c3e50', margin: 0 }}>Hello, {userName} 👋</h1>
                        {kycStatus === 'APPROVED' && (
                            <span style={{
                                backgroundColor: '#e8f8f5',
                                color: '#27ae60',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                border: '1px solid #27ae60'
                            }}>
                                Verified
                            </span>
                        )}
                    </div>
                    <p style={{ color: '#7f8c8d', fontSize: '16px', marginTop: '5px' }}>Welcome back to your dashboard.</p>
                </div>



                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>

                    {/* LEFT COLUMN: ACTION & BENEFICIARIES */}
                    <div>
                        {/* CTA CARD */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '30px',
                            marginBottom: '30px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            textAlign: 'center'
                        }}>
                            <h2 style={{ color: '#2c3e50', marginTop: 0 }}>Swap your Money Locally</h2>
                            <p style={{ color: '#7f8c8d', marginBottom: '25px' }}>
                                Fast, secure, and at the real market rate.
                            </p>
                            <button
                                onClick={handleStartSwap}
                                disabled={kycStatus === 'PENDING' && (user?.txCount || 0) > 0}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    backgroundColor: (kycStatus === 'PENDING' && (user?.txCount || 0) > 0) ? '#bdc3c7' : '#4A90E2',
                                    color: 'white',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: (kycStatus === 'PENDING' && (user?.txCount || 0) > 0) ? 'not-allowed' : 'pointer',
                                    boxShadow: (kycStatus === 'PENDING' && (user?.txCount || 0) > 0) ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.3)',
                                    transition: 'transform 0.2s',
                                    opacity: (kycStatus === 'PENDING' && (user?.txCount || 0) > 0) ? 0.7 : 1
                                }}
                            >
                                {(kycStatus === 'PENDING' && (user?.txCount || 0) > 0) ? 'Verification in Progress' : 'Start New Swap'}
                            </button>
                        </div>

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
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 15px rgba(0,0,0,0.05)' }}>
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
                                            <span style={{ color: '#95a5a6' }}>Market Exchange Rate: </span>
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
                    </div>

                </div>
            </main>
        </div>
    );
}
