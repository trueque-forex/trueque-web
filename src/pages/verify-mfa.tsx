import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function VerifyMfaPage() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        console.log('[VerifyMfaPage] MOUNTED');
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            // Success - Redirect to Dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <Head>
                <title>Verify MFA | Trueque</title>
            </Head>

            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{ fontSize: '24px', marginBottom: '10px', textAlign: 'center' }}>🔐 Security Check</h1>
                <p style={{ color: '#666', textAlign: 'center', marginBottom: '30px' }}>
                    Please enter the verification code sent to your email (or terminal).
                </p>

                <form onSubmit={handleVerify}>
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '24px',
                                textAlign: 'center',
                                letterSpacing: '5px',
                                border: '2px solid #e1e8ed',
                                borderRadius: '8px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: '#e74c3c',
                            backgroundColor: '#fdecec',
                            padding: '10px',
                            borderRadius: '6px',
                            marginBottom: '20px',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || code.length < 6}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                </form>
            </div>
        </div>
    );
}
