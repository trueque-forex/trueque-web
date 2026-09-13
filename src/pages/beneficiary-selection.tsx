import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../lib/apiFetch';
import { useSwap } from '../context/SwapContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

type Beneficiary = {
    id: string;
    name: string; // This should be full_legal_name after refactor
    country: string;
    method: string;
    identifiers: any;
};

export default function BeneficiarySelectionPage() {
    const router = useRouter();
    const { swapIntent } = useSwap(); // Access Global State
    const { user, loading: isAuthLoading } = useAuth(); // Access Global Auth State
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [loading, setLoading] = useState(true);

    const userName = user?.firstName || user?.full_name?.split(' ')[0] || 'Guest';

    useEffect(() => {
        // 1. ROUTE GUARD (GEMINI CONSTANT 2025)
        // If no offer selected (SwapIntent), bounce to Budget/Amount Selection
        if (!swapIntent || !swapIntent.amount) {
            router.replace('/offers?from=EUR&to=DOP');
            return;
        }

        if (!isAuthLoading && !user) {
            router.replace('/signin');
            return;
        }

        // Fetch Beneficiaries ONLY if session is valid
        if (!isAuthLoading && user) {
            const fetchBens = async () => {
                try {
                    const { json, res } = await apiFetch<Beneficiary[]>('/api/beneficiaries', { method: 'GET' });
                    console.log("FETCH BENS RESPONSE:", res.status, JSON.stringify(json));
                    if (res.ok && Array.isArray(json)) {
                        // Do not filter by rail here. Show all saved beneficiaries so the user knows they exist.
                        // The beneficiary page will handle adding a new rail if needed.
                        setBeneficiaries(json);
                    }
                } catch (e) {
                    console.error("Failed to load beneficiaries", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchBens();
        }
    }, [router.isReady, router.query, swapIntent, isAuthLoading, user]);

    const handleSelect = (b: Beneficiary) => {
        // Persist for the Review Page
        localStorage.setItem('selected_beneficiary', JSON.stringify(b));

        const rail = router.query.rail as string;
        if (rail || router.query.offerId || swapIntent?.provider) {
            // Return to review with the selected rail and all query params preserved
            router.push({
                pathname: '/review',
                query: { ...router.query }
            });
        } else {
            // Navigate to Counterparty Selection
            router.push('/counterparty-offers');
        }
    };

    const handleNewRecipient = () => {
        // CLEAR any previous draft so we don't accidentally load Maria!
        localStorage.removeItem('selected_beneficiary');
        router.push('/beneficiary?new=true');
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            <Header />

            <main style={{ maxWidth: 800, margin: '40px auto', padding: '0 40px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', marginBottom: '10px' }}>
                    Hello, {userName}
                </h1>
                <p style={{ color: '#7f8c8d', marginBottom: '40px' }}>Who do you want to send money to today?</p>

                {/* New Transfer Button */}
                <div
                    onClick={handleNewRecipient}
                    style={{
                        backgroundColor: 'white',
                        border: '2px dashed #1A73E8',
                        borderRadius: '16px',
                        padding: '30px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        marginBottom: '30px',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                    <div style={{ fontSize: '30px', color: '#1A73E8', marginBottom: '10px' }}>+</div>
                    <div style={{ fontWeight: '600', color: '#1A73E8' }}>New Recipient</div>
                </div>

                {/* Existing Beneficiaries */}
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50', marginBottom: '20px' }}>Recent Recipients</h2>

                {loading ? (
                    <div>Loading...</div>
                ) : beneficiaries.length === 0 ? (
                    <div style={{ color: '#95a5a6' }}>No saved recipients yet.</div>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {beneficiaries.map(b => (
                            <div
                                key={b.id}
                                onClick={() => handleSelect(b)}
                                style={{
                                    backgroundColor: 'white',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    border: '1px solid #e1e8ed',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        backgroundColor: '#ecf0f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', color: '#7f8c8d'
                                    }}>
                                        {(b.name || 'U').charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#2c3e50' }}>{b.name || 'Unknown Beneficiary'}</div>
                                        <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                                            {b.method === 'bank_rtp' ? 'Bank Transfer' : b.method === 'card_push' ? 'Debit Card' : 'Wallet'} • {b.country}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ color: '#1A73E8', fontSize: '20px' }}>→</div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
