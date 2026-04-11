import { useRouter } from 'next/router';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import brandConfig from '../config/brand_config.json';

export default function Header() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const userName = user?.name?.split(' ')[0] || 'User';

    const handleLogout = () => {
        sessionStorage.removeItem('smart_intent'); // Cleanup intent on logout
        logout(); // Context logout handles redirect to '/'
    };

    // Standard Button Style
    const btnStyle: React.CSSProperties = {
        background: 'transparent',
        border: `1px solid ${brandConfig.theme.textColor}33`, // 20% opacity using hex alpha
        color: brandConfig.theme.textColor,
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        whiteSpace: 'nowrap'
    };

    return (
        <header style={{
            background: 'white',
            borderBottom: '1px solid #e1e8ed',
            padding: '20px 40px',
            color: brandConfig.theme.textColor,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
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
                    {/* Symmetri Wordmark */}
                    <h1
                        style={{
                            fontSize: '28px',
                            fontWeight: brandConfig.theme.fontWeight,
                            margin: 0,
                            cursor: 'pointer',
                            // Experiment: Swap these fonts to test (Inter, Montserrat, Space Grotesk)
                            fontFamily: brandConfig.theme.fontFamily, // Currently: Space Grotesk
                            letterSpacing: brandConfig.theme.letterSpacing, // Airy feel
                            color: brandConfig.theme.primaryColor, // Use Config Color
                        }}
                        onClick={() => router.push('/dashboard')}
                    >
                        {brandConfig.appName}
                    </h1>
                    <div className="flex flex-col">
                        <span className="font-bold" style={{ fontSize: '16px', color: brandConfig.theme.textColor }}>
                            Welcome, {user?.firstName || userName}
                        </span>
                        {(user?.symmetriId || user?.tid) && (
                            <span className="text-xs text-blue-500 font-mono tracking-wider" style={{ opacity: 0.7 }}>
                                ID: {user.symmetriId || user.tid}
                            </span>
                        )}
                    </div>
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
                            background: brandConfig.theme.errorColor,
                            border: 'none',
                            color: 'white',
                            fontWeight: '600'
                        }}
                    >
                        Log Out
                    </button>
                </nav>
            </div>
        </header>
    );
}
