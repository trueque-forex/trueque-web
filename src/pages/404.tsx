// src/pages/404.tsx
import React from 'react';
import { useRouter } from 'next/router';

export default function Custom404() {
    const router = useRouter();

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                maxWidth: '600px',
                padding: '40px',
                textAlign: 'center'
            }}>
                {/* 404 Icon */}
                <div style={{
                    fontSize: '120px',
                    marginBottom: '20px'
                }}>
                    🔍
                </div>

                {/* Error Message */}
                <h1 style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color: '#2c3e50',
                    marginBottom: '20px'
                }}>
                    404
                </h1>

                <h2 style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#34495e',
                    marginBottom: '15px'
                }}>
                    Page Not Found
                </h2>

                <p style={{
                    fontSize: '16px',
                    color: '#7f8c8d',
                    marginBottom: '40px',
                    lineHeight: '1.6'
                }}>
                    Sorry, we couldn't find the page you're looking for.
                    The page may have been moved or doesn't exist.
                </p>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={() => router.back()}
                        style={{
                            padding: '14px 28px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#4A90E2',
                            backgroundColor: 'white',
                            border: '2px solid #4A90E2',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e8f4fd';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                        }}
                    >
                        ← Go Back
                    </button>

                    <button
                        onClick={() => router.push('/swap')}
                        style={{
                            padding: '14px 28px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'white',
                            background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        Go to Swap →
                    </button>
                </div>

                {/* Additional Help */}
                <div style={{
                    marginTop: '40px',
                    padding: '20px',
                    backgroundColor: '#e8f4fd',
                    borderRadius: '10px',
                    border: '1px solid #4A90E2'
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#34495e'
                    }}>
                        Need help? Contact support or visit our{' '}
                        <a
                            href="/"
                            style={{
                                color: '#4A90E2',
                                textDecoration: 'none',
                                fontWeight: '600'
                            }}
                        >
                            home page
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
