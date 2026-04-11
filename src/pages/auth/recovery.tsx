import React, { useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../../lib/apiFetch';

export default function RecoveryPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState('');
    const [last4, setLast4] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLookup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setStep(2); // In a real app we might verify email exists first, but here we proceed to challenge
        setError(null);
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (last4.length !== 4) {
            setError('Please enter exactly 4 digits');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const { json, res } = await apiFetch('/api/auth/verify-id-challenge', {
                method: 'POST',
                body: JSON.stringify({ email, last4 })
            });

            if (res.ok && json.success) {
                setStep(3); // Success state
            } else {
                setError(json.error || 'Verification failed. Digits do not match.');
            }
        } catch (err: any) {
            console.error(err);
            setError('System error during verification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>🛡️</div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px' }}>
                    Account Recovery
                </h1>

                {step === 1 && (
                    <form onSubmit={handleLookup}>
                        <p style={{ color: '#7f8c8d', marginBottom: '30px', lineHeight: '1.5' }}>
                            Enter your registered email address to begin the recovery process.
                        </p>
                        <input
                            type="email"
                            required
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e1e8ed', marginBottom: '20px', boxSizing: 'border-box'
                            }}
                        />
                        <button type="submit" style={btnStyle}>Continue</button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerify}>
                        <p style={{ color: '#7f8c8d', marginBottom: '30px', lineHeight: '1.5' }}>
                            Security Challenge for <strong>{email}</strong>
                        </p>
                        <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                            Please enter the <strong>last 4 digits</strong> of the identity document you submitted during KYC.
                        </div>

                        <input
                            type="text"
                            maxLength={4}
                            placeholder="e.g. 6789"
                            value={last4}
                            onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '8px', border: '2px solid #3498db', marginBottom: '20px', boxSizing: 'border-box',
                                textAlign: 'center', fontSize: '24px', letterSpacing: '4px'
                            }}
                        />
                        {error && <div style={{ color: '#e74c3c', marginBottom: '20px' }}>{error}</div>}

                        <button type="submit" disabled={loading} style={btnStyle}>
                            {loading ? 'Verifying...' : 'Verify Identity'}
                        </button>
                        <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', marginTop: '15px', color: '#95a5a6', cursor: 'pointer' }}>Back</button>
                    </form>
                )}

                {step === 3 && (
                    <div>
                        <p style={{ color: '#27ae60', fontWeight: 'bold', marginBottom: '20px', fontSize: '18px' }}>
                            ✓ Identity Verified
                        </p>
                        <p style={{ color: '#7f8c8d', marginBottom: '30px', lineHeight: '1.5' }}>
                            Your session has been elevated. You can now reset your MFA settings or update your phone number.
                        </p>
                        <button
                            onClick={() => router.push('/profile?action=reset_mfa')}
                            style={btnStyle}
                        >
                            Update Phone / Reset MFA
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2c3e50',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer'
};
