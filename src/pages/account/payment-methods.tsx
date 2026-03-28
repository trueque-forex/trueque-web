import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function PaymentMethodsPage() {
    const router = useRouter();
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        const sessionData = localStorage.getItem('trueque_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                setUserName(session.name || (session.firstName ? `${session.firstName} ${session.lastName || ''}`.trim() : 'User'));
            } catch (e) {
                setUserName('User');
            }
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
                        <span style={{ fontSize: '16px', opacity: 0.9 }}>Payment Methods</span>
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
                        Form of Payments
                    </h2>

                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontSize: '16px', color: '#7f8c8d', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Your Cards
                        </h3>

                        {/* Digital Credit Card */}
                        <div style={{
                            width: '100%',
                            maxWidth: '380px',
                            height: '220px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
                            padding: '25px',
                            boxSizing: 'border-box',
                            color: 'white',
                            position: 'relative',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}>
                            {/* Card Top: Chip and Contactless */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '45px',
                                    height: '35px',
                                    background: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)',
                                    borderRadius: '6px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Chip details simulation */}
                                    <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: 'rgba(0,0,0,0.2)' }}></div>
                                    <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '0', width: '1px', background: 'rgba(0,0,0,0.2)' }}></div>
                                    <div style={{ position: 'absolute', left: '25%', top: '20%', bottom: '20%', width: '50%', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '4px' }}></div>
                                </div>

                                {/* Contactless Icon */}
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                                    <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                                    <line x1="12" y1="20" x2="12.01" y2="20"></line>
                                </svg>
                            </div>

                            {/* Card Number */}
                            <div style={{
                                fontSize: '22px',
                                letterSpacing: '3px',
                                fontFamily: 'monospace',
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                            }}>
                                **** **** **** 1234
                            </div>

                            {/* Card Bottom: Name and Expiry */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', marginBottom: '2px' }}>Card Holder</div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        {userName}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', marginBottom: '2px' }}>Expires</div>
                                    <div style={{ fontSize: '14px', fontWeight: '600' }}>12/28</div>
                                </div>
                                {/* Visa Logo Simulation */}
                                <div style={{ fontSize: '24px', fontWeight: '800', fontStyle: 'italic', lineHeight: 1 }}>
                                    VISA
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add New Methods */}
                    <div>
                        <h3 style={{ fontSize: '16px', color: '#7f8c8d', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Add Payment Method
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <button style={{
                                padding: '20px',
                                border: '2px dashed #e1e8ed',
                                borderRadius: '12px',
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.2s',
                                color: '#7f8c8d'
                            }}>
                                <span style={{ fontSize: '24px' }}>💳</span>
                                <span style={{ fontWeight: '600' }}>Add New Card</span>
                            </button>

                            <button style={{
                                padding: '20px',
                                border: '2px dashed #e1e8ed',
                                borderRadius: '12px',
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.2s',
                                color: '#7f8c8d'
                            }}>
                                <span style={{ fontSize: '24px' }}>🏦</span>
                                <span style={{ fontWeight: '600' }}>Link Bank Account</span>
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
