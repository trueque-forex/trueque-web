// src/pages/welcome.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

// Mock Rates Data (In real app, fetch from API)
const MOCK_RATES = [
    { pair: 'USD → ARS', rate: 1150.50, trend: 'up' },
    { pair: 'USD → MXN', rate: 17.45, trend: 'down' },
    { pair: 'EUR → BRL', rate: 5.42, trend: 'stable' },
    { pair: 'EUR → COP', rate: 4350.20, trend: 'up' },
    { pair: 'NGN → GHS', rate: 0.015, trend: 'stable' }, // Africa Corridor
];
export default function WelcomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // NOTE: Auto-Redirect removed to allow staying on this page after logout

    const [geoCountry, setGeoCountry] = useState<string>('US'); // Default US

    useEffect(() => {
        // 2. Mock Geolocation (Simulate IP check)
        // In production, use req.headers['x-forwarded-for'] or a service
        const detectGeo = async () => {
            let detected = 'US'; // Default
            try {
                // Fetch from our backend wrapper which handles headers/service
                const res = await fetch('/api/geo');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.country) detected = data.country;
                }
            } catch (e) {
                // Silent fail to default 'US'
                console.warn('Geo detect failed, using default', e);
            }

            setGeoCountry(detected);
            sessionStorage.setItem('user_geo', detected);
        };

        detectGeo();
    }, []); // Run once on mount

    if (loading) return null; // Or a spinner

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            {/* Hero Section */}
            <header style={{
                background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                color: 'white',
                padding: '60px 40px',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '20px', letterSpacing: '-1px' }}>
                        Welcome to Trueque
                    </h1>
                    <p style={{ fontSize: '20px', opacity: 0.9, lineHeight: '1.6', maxWidth: '700px', margin: '0 auto 40px auto' }}>
                        The global P2P remittance network. We lower costs by eliminating cross-border transactions through our domestic mirror network.
                    </p>

                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                        <button
                            onClick={() => router.push('/signin')}
                            style={{
                                padding: '16px 40px',
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#2c3e50',
                                backgroundColor: '#fad390', // Warm accent
                                border: 'none',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                                transition: 'transform 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Get Started
                        </button>
                        <button
                            onClick={() => router.push('/how-it-works')}
                            style={{
                                padding: '16px 40px',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: 'white',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                        >
                            How it Works
                        </button>
                    </div>
                </div>
            </header>

            {/* Live Rates Ticker */}
            <div style={{
                backgroundColor: '#2d3436',
                color: 'white',
                padding: '15px 0',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
            }}>
                <div style={{ display: 'inline-block', animation: 'marquee 20s linear infinite' }}>
                    {MOCK_RATES.concat(MOCK_RATES).map((r, i) => (
                        <span key={i} style={{ margin: '0 40px', fontSize: '14px', fontWeight: '500' }}>
                            <span style={{ color: '#bdc3c7' }}>{r.pair}</span>:
                            <span style={{ marginLeft: '8px', color: '#2ecc71', fontWeight: 'bold' }}>{r.rate.toFixed(2)}</span>
                            <span style={{ marginLeft: '4px', fontSize: '10px' }}>{r.trend === 'up' ? '▲' : '▼'}</span>
                        </span>
                    ))}
                </div>
                <style jsx>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
            </div>

            {/* Features Grid */}
            <main style={{ maxWidth: 1200, margin: '60px auto 60px', padding: '0 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
                <FeatureCard
                    icon="⚡"
                    title="Instant Settlement"
                    desc="Funds arrive in minutes via local rails (RTP, Pix, SPEI)."
                />
                <FeatureCard
                    icon="🛡️"
                    title="Bank-Grade Security"
                    desc="Fully compliant KYC/AML checks and secure data encryption."
                />
                <FeatureCard
                    icon="💸"
                    title="Real Market Rates"
                    desc="Exchange made at Market Rate with transparent and low fees."
                />
                <FeatureCard
                    icon="✈️"
                    title="Traveler Ready"
                    desc="Swap currencies for local spending, in the travel destination, without a domestic bank account. Directly to your wallet or card."
                />
            </main>

            {/* Footer */}
            <footer style={{ textAlign: 'center', padding: '40px', color: '#95a5a6', fontSize: '14px' }}>
                © 2024 Trueque Inc. All rights reserved.
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
    return (
        <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '16px',
            border: '1px solid #e1e8ed',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>{icon}</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px', color: '#2c3e50' }}>{title}</h3>
            <p style={{ color: '#7f8c8d', lineHeight: '1.5' }}>{desc}</p>
        </div>
    );
}
