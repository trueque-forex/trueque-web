import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SignupSuccessPage() {
    const router = useRouter();
    const [truequeId, setTruequeId] = useState<string>('');
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        // Get session data from localStorage
        const sessionData = localStorage.getItem('trueque_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                setTruequeId(session.tid || session.truequeId || '');
                setUserName(session.firstName || 'User');
            } catch (e) {
                console.error('Error parsing session data', e);
            }
        }
    }, []);

    const handleContinue = () => {
        router.push('/swap');
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                maxWidth: '500px',
                width: '100%',
                overflow: 'hidden',
                textAlign: 'center'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                    padding: '40px 20px',
                    color: 'white'
                }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Welcome to Trueque!</h1>
                    <p style={{ margin: '10px 0 0', opacity: 0.9, fontSize: '16px' }}>
                        Your account has been successfully created.
                    </p>
                </div>

                <div style={{ padding: '40px 30px' }}>
                    <p style={{ color: '#7f8c8d', fontSize: '16px', marginBottom: '30px', lineHeight: '1.5' }}>
                        Hello <strong>{userName}</strong>! Here is your unique Trueque ID.
                        Share this ID with others so they can send money to you.
                    </p>

                    <div style={{
                        backgroundColor: '#f8fbff',
                        border: '2px dashed #4A90E2',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '30px'
                    }}>
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#7f8c8d', letterSpacing: '1px', marginBottom: '5px' }}>
                            Your Trueque ID
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#2c3e50', fontFamily: 'monospace' }}>
                            {truequeId || 'Loading...'}
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#fff8e1', padding: '15px', borderRadius: '8px', marginBottom: '30px', borderLeft: '4px solid #f1c40f', fontSize: '14px', color: '#7f6000', textAlign: 'left' }}>
                        <strong>Value & Security:</strong> This unique ID allows you to receive personalized offers and serves as a high-trust key to recover your account if you check "Lost Device".
                    </div>

                    <button
                        onClick={handleContinue}
                        style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'white',
                            background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Start Swapping
                    </button>
                </div>
            </div>
        </div>
    );
}
