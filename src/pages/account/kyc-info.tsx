import React from 'react';
import { useRouter } from 'next/router';

export default function KYCInfoPage() {
    const router = useRouter();
    const [userName, setUserName] = React.useState('User');

    React.useEffect(() => {
        const sessionData = localStorage.getItem('trueque_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                setUserName(session.name || (session.firstName ? `${session.firstName} ${session.lastName || ''}`.trim() : 'User'));
            } catch (e) { }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('trueque_session');
        router.push('/signin');
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            {/* Header */}
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
                        <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
                            Trueque
                        </h1>
                        <span style={{ fontSize: '16px', opacity: 0.9 }}>KYC Information</span>
                    </div>

                    <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => router.push('/swap')}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span>🏠</span> Home
                        </button>
                        <button
                            onClick={() => router.push('/market-prices')}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Market Prices
                        </button>
                        <button
                            onClick={() => router.push('/account/profile')}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Account Info
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: '#e74c3c',
                                border: 'none',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        >
                            Log Out
                        </button>
                    </nav>
                </div>
            </header>

            <main style={{ maxWidth: 800, margin: '40px auto', padding: '0 40px' }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '40px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    {/* Back Button */}
                    <button
                        onClick={() => router.push('/account/profile')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#7f8c8d',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            marginBottom: '20px',
                            padding: 0
                        }}
                    >
                        ← Back to Profile
                    </button>

                    <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '30px' }}>
                        Identity Verification Details
                    </h2>

                    <div style={{
                        padding: '25px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        border: '1px solid #e1e8ed'
                    }}>
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e1e8ed', paddingBottom: '15px' }}>
                                <span style={{ color: '#7f8c8d' }}>Full Name</span>
                                <span style={{ fontWeight: '600', color: '#2c3e50' }}>{userName}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e1e8ed', paddingBottom: '15px' }}>
                                <span style={{ color: '#7f8c8d' }}>Document Type</span>
                                <span style={{ fontWeight: '600', color: '#2c3e50' }}>National ID Card</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e1e8ed', paddingBottom: '15px' }}>
                                <span style={{ color: '#7f8c8d' }}>Document Number</span>
                                <span style={{ fontWeight: '600', color: '#2c3e50' }}>**** 5678</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e1e8ed', paddingBottom: '15px' }}>
                                <span style={{ color: '#7f8c8d' }}>Verification Status</span>
                                <span style={{ fontWeight: '600', color: '#27ae60', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span>✅</span> Verified
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#7f8c8d' }}>Verified On</span>
                                <span style={{ fontWeight: '600', color: '#2c3e50' }}>Dec 01, 2025</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '12px', color: '#2e7d32', fontSize: '14px', lineHeight: '1.5' }}>
                        <strong>Note:</strong> Your identity has been successfully verified. You have full access to all Trueque features. If you need to update your documents, please contact support.
                    </div>

                </div>
            </main>
        </div>
    );
}
