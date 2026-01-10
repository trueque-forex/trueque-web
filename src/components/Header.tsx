import { useRouter } from 'next/router';
import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const userName = user?.name?.split(' ')[0] || 'User';

    const handleLogout = () => {
        logout(); // Context logout handles redirect to '/'
    };

    // Standard Button Style
    const btnStyle: React.CSSProperties = {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.3)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        whiteSpace: 'nowrap'
    };

    return (
        <header style={{
            background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
            padding: '20px 40px',
            color: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <div style={{
                maxWidth: 1200,
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0, cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
                        Trueque
                    </h1>
                    <span style={{ fontSize: '16px', opacity: 0.9 }}>Welcome, {userName}</span>
                </div>

                <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* [Dashboard] */}
                    <button onClick={() => router.push('/dashboard')} style={btnStyle}>
                        Dashboard
                    </button>

                    {/* [Live Rates] */}
                    <button onClick={() => router.push('/market-prices')} style={btnStyle}>
                        Live Rates
                    </button>

                    {/* [My Swaps] */}
                    <button onClick={() => router.push('/history')} style={btnStyle}>
                        My Swaps
                    </button>

                    {/* [Beneficiaries] */}
                    <button onClick={() => router.push('/beneficiary')} style={btnStyle}>
                        Beneficiaries
                    </button>

                    {/* [Account] */}
                    <button
                        onClick={() => {
                            if ((user?.kycStatus || '').toUpperCase() === 'APPROVED') {
                                router.push('/profile');
                            } else {
                                router.push('/kyc-status');
                            }
                        }}
                        style={btnStyle}
                    >
                        Account
                    </button>

                    {/* [Log Out] */}
                    <button
                        onClick={handleLogout}
                        style={{
                            ...btnStyle,
                            background: '#e74c3c',
                            border: 'none',
                            fontWeight: '600'
                        }}
                    >
                        Log Out
                    </button>
                </nav>
            </div>
        </header >
    );
}
