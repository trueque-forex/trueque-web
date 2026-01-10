import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic to send recovery email would go here
        setSubmitted(true);
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
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px' }}>
                    Recover your account
                </h1>

                {!submitted ? (
                    <>
                        <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
                            Enter your email and we'll send you a link to reset your password.
                        </p>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="email"
                                required
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e1e8ed',
                                    marginBottom: '20px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#3498db',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Send Recovery Link
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ color: '#27ae60' }}>
                        <p>If an account exists for <strong>{email}</strong>, you will receive an email shortly.</p>
                        <button
                            onClick={() => router.push('/signin')}
                            style={{
                                marginTop: '20px',
                                background: 'none',
                                border: 'none',
                                color: '#3498db',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Back to Sign In
                        </button>
                    </div>
                )}

                <div style={{ marginTop: '30px', borderTop: '1px solid #e1e8ed', paddingTop: '20px' }}>
                    <a href="/support" style={{ fontSize: '14px', color: '#95a5a6', textDecoration: 'none' }}>
                        Need help? Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
}
