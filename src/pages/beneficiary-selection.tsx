import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../lib/apiFetch';
import { useSwap } from '../context/SwapContext';

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
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        // 1. ROUTE GUARD (GEMINI CONSTANT 2025)
        // If no offer selected (SwapIntent), bounce to Budget/Amount Selection
        if (!swapIntent || !swapIntent.amount) {
            router.replace('/amount-selection');
            return;
        }

        let activeSession = false;
        // Load Session User Name
        const sessionData = localStorage.getItem('trueque_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                // Smart Name Logic: Try firstName, then first part of full_name
                const name = session.firstName || session.full_name?.split(' ')[0] || 'Joao';
                setUserName(name);
                activeSession = true;
            } catch (e) {
                router.replace('/signin');
                return;
            }
        } else {
            router.replace('/signin');
            return;
        }

        // Fetch Beneficiaries ONLY if session is valid
        if (activeSession) {
            const fetchBens = async () => {
                try {
                    // Mock fallback if API fails or is empty for dev
                    const { json, res } = await apiFetch<Beneficiary[]>('/api/beneficiaries', { method: 'GET' });
                    // 401 is now handled by apiFetch globally, but we can double check
                    if (res.ok && Array.isArray(json)) {
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
    }, [router, swapIntent]);

    const handleSelect = (b: Beneficiary) => {
        // ANCHOR DATA: Persist 'Maria' (or whoever) for the Review Page
        // Using 'selected_beneficiary' as requested
        localStorage.setItem('selected_beneficiary', JSON.stringify(b));

        // Navigate to Validation/Review (Review Page is next?)
        // Or to Beneficiary Details to confirm?
        // Usually: Select -> Review (if data complete) OR Select -> Edit (if missing)
        // For Flow B: "Check logic in beneficiary.tsx" implies we go there.
        // Navigate to Counterparty Selection
        router.push('/counterparty-offers');
    };

    const handleSignOut = () => {
        // Strict Kill Logic (G3 Requirement)
        sessionStorage.clear();
        localStorage.removeItem('token');
        localStorage.removeItem('trueque_session');
        router.push('/');
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            {/* Header */}
            <header style={{
                background: 'white',
                padding: '20px 40px',
                borderBottom: '1px solid #e1e8ed',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4A90E2' }}>Trueque</div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => router.push('/profile')} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>Profile</button>
                    <button onClick={handleSignOut} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e74c3c' }}>Sign Out</button>
                </div>
            </header>

            <main style={{ maxWidth: 800, margin: '40px auto', padding: '0 40px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', marginBottom: '10px' }}>
                    Hello, {userName}
                </h1>
                <p style={{ color: '#7f8c8d', marginBottom: '40px' }}>Who do you want to send money to today?</p>

                {/* New Transfer Button */}
                <div
                    onClick={() => router.push('/beneficiary')} // Go to Empty Form
                    style={{
                        backgroundColor: 'white',
                        border: '2px dashed #4A90E2',
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
                    <div style={{ fontSize: '30px', color: '#4A90E2', marginBottom: '10px' }}>+</div>
                    <div style={{ fontWeight: '600', color: '#4A90E2' }}>New Recipient</div>
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
                                        {b.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#2c3e50' }}>{b.name}</div>
                                        <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                                            {b.method === 'bank_rtp' ? 'Bank Transfer' : b.method === 'card_push' ? 'Debit Card' : 'Wallet'} • {b.country}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ color: '#4A90E2', fontSize: '20px' }}>→</div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
