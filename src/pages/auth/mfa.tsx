import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../../lib/apiFetch';

export default function MFAPage() {
    const router = useRouter();
    const { mfa_token, tid, email } = router.query;
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [method, setMethod] = useState<'whatsapp' | 'sms'>('whatsapp');
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    // Auto-focus first input
    useEffect(() => {
        if (inputs.current[0]) inputs.current[0].focus();
    }, []);

    const handleInput = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Numbers only

        const newCode = [...code];
        newCode[index] = value.slice(-1); // Take last char
        setCode(newCode);

        // Auto-advance
        if (value && index < 5 && inputs.current[index + 1]) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setError('Please enter the 6-digit code');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { json, res } = await apiFetch('/api/auth/verify', {
                method: 'POST',
                body: JSON.stringify({
                    mfa_token,
                    tid,
                    code: fullCode,
                    email
                })
            });

            if (res.ok && json.session) {
                // Success - Store session and redirect
                localStorage.setItem('trueque_session', JSON.stringify(json.session));
                // SYNCHRONOUS HANDSHAKE
                localStorage.setItem('is_logged_in', 'true');
                // Force fresh session load to break loops
                window.location.href = '/dashboard';
            } else {
                setError(json.error || 'Invalid code. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed');
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
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>🔒</div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px' }}>
                    Two-Step Verification
                </h1>
                <p style={{ color: '#7f8c8d', marginBottom: '30px', lineHeight: '1.5' }}>
                    For your security, we've sent a 6-digit code to your registered number via <strong>{method === 'whatsapp' ? 'WhatsApp' : 'SMS'}</strong>.
                </p>

                {/* Toggle Method */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
                    <button
                        onClick={() => setMethod('whatsapp')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: method === 'whatsapp' ? '2px solid #2ecc71' : '1px solid #e1e8ed',
                            backgroundColor: method === 'whatsapp' ? '#e8f8f5' : 'white',
                            color: method === 'whatsapp' ? '#27ae60' : '#95a5a6',
                            cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                        }}
                    >
                        WhatsApp
                    </button>
                    <button
                        onClick={() => setMethod('sms')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: method === 'sms' ? '2px solid #3498db' : '1px solid #e1e8ed',
                            backgroundColor: method === 'sms' ? '#ebf5fb' : 'white',
                            color: method === 'sms' ? '#2980b9' : '#95a5a6',
                            cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                        }}
                    >
                        SMS
                    </button>
                </div>

                <form onSubmit={handleVerify}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                        {code.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => { inputs.current[i] = el; }}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleInput(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                style={{
                                    width: '45px',
                                    height: '55px',
                                    fontSize: '24px',
                                    textAlign: 'center',
                                    borderRadius: '8px',
                                    border: '2px solid #e1e8ed',
                                    outline: 'none',
                                }}
                            />
                        ))}
                    </div>

                    {error && <div style={{ color: '#e74c3c', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

                    <button
                        type="submit"
                        disabled={loading} // FRONTEND SHIELD: Prevents double-click race conditions
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: loading ? '#95a5a6' : '#2c3e50', // Visually indicate disabled state
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {loading ? 'Verifying...' : 'Verify Identity'}
                    </button>
                </form>

                <div style={{ marginTop: '30px', fontSize: '14px', color: '#95a5a6' }}>
                    <p>Didn't receive code? <button onClick={async () => {
                        try {
                            await apiFetch('/api/auth/resend-mfa', {
                                method: 'POST',
                                body: JSON.stringify({ mfa_token, email })
                            });
                            alert('New code sent to console/device!');
                        } catch (e) { alert('Failed to resend code'); }
                    }} style={{ border: 'none', background: 'none', color: '#3498db', cursor: 'pointer', textDecoration: 'underline' }}>Resend</button></p>
                    <div style={{ marginTop: '15px', borderTop: '1px solid #e1e8ed', paddingTop: '15px' }}>
                        <a href="/support" style={{ color: '#95a5a6', textDecoration: 'none' }}>Get Help & Recovery</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
