import React from 'react';
import { useRouter } from 'next/router';

export default function HowItWorksPage() {
    const router = useRouter();

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px' }}>
                <button
                    onClick={() => router.push('/')}
                    style={{ border: 'none', background: 'none', color: '#3498db', cursor: 'pointer', marginBottom: '20px', fontSize: '16px' }}
                >
                    ← Back to Home
                </button>

                <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#2c3e50', marginBottom: '30px' }}>How Trueque Works</h1>

                <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '15px' }}>The P2P Mirror Network</h2>
                        <p style={{ fontSize: '18px', color: '#34495e', lineHeight: '1.8' }}>
                            Trueque eliminates cross-border fees by matching users locally.
                        </p>
                        <p style={{ fontSize: '16px', color: '#7f8c8d', lineHeight: '1.8', marginTop: '10px' }}>
                            In Trueque, a <strong>User A</strong> in one country (e.g. USA) wants to send 100 USD to Mexico.
                            Simultaneously, a <strong>User B</strong> in Mexico wants to send the equivalent amount to the USA.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px', border: '1px solid #e1e8ed' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#2980b9' }}>Leg A (USA)</h3>
                            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                User A transfers $100 USD locally to User B's designated beneficiary in the US.
                            </p>
                        </div>
                        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px', border: '1px solid #e1e8ed' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#27ae60' }}>Leg B (Mexico)</h3>
                            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                User B transfers ~1750 MXN locally to User A's designated beneficiary in Mexico.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '15px' }}>Why is this better?</h2>
                        <ul style={{ lineHeight: '2', color: '#34495e' }}>
                            <li><strong>No Swift Fees:</strong> Money never crosses borders via banks.</li>
                            <li><strong>Instant Settlement:</strong> Funds move on local real-time rails (RTP, SPEI, Pix).</li>
                            <li><strong>Market Rate:</strong> Users exchange at the true rate, sharing the savings.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
