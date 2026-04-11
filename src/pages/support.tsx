import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import apiFetch from '../lib/apiFetch';

export default function SupportPage() {
  const router = useRouter();
  const [resetMode, setResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [last4, setLast4] = useState('');
  const [dob, setDob] = useState('');
  const [tid, setTid] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [verified, setVerified] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !dob || (!last4 && !tid)) {
      setMessage({ type: 'error', text: 'Please provide Email, Date of Birth, and either Last 4 digits of Phone or Symmetri ID.' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const { json, res } = await apiFetch('/api/auth/verify-id-challenge', {
        method: 'POST',
        body: JSON.stringify({ email, last4, dob, tid })
      });

      if (res.ok && json.success) {
        setVerified(true);
        setMessage({ type: 'success', text: 'Identity Verified. You may now reset your MFA.' });
      } else {
        setMessage({ type: 'error', text: json.message || json.error || 'Verification failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'System error. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaResetConfirm = () => {
    router.push('/auth/reset-phone');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif', padding: '40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#3498db', fontWeight: 'bold' }}>← Back to Home</Link>
          <h1 style={{ marginTop: '20px', color: '#2c3e50' }}>Support Center</h1>
        </header>

        <div style={{ display: 'grid', gap: '30px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Common Topics</h2>
            <ul style={{ lineHeight: '2', color: '#34495e' }}>
              <li><Link href="/how-it-works">How Symmetri Works</Link></li>
              <li><a href="#">Transaction Limits</a></li>
              <li><a href="#">Verification (KYC) Guide</a></li>
            </ul>
          </div>

          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: '5px solid #e74c3c' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#c0392b' }}>Lost Device / MFA Reset</h2>
            <p style={{ marginBottom: '20px', color: '#7f8c8d' }}>
              If you lost your device or cannot access your 2FA method, verify your identity using your registered details or Symmetri ID.
            </p>

            {!resetMode ? (
              <button
                onClick={() => setResetMode(true)}
                style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Start Recovery
              </button>
            ) : (
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Identity Challenge</h3>

                {!verified ? (
                  <form onSubmit={handleVerify}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Registered Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Last 4 Phone Digits</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={last4}
                          onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))}
                          placeholder="0000"
                          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center', fontSize: '18px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Date of Birth</label>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Symmetri ID (T+YYYYMMDD+CC0000-X)</label>
                      <input
                        type="text"
                        value={tid}
                        onChange={(e) => setTid(e.target.value.toUpperCase())}
                        placeholder="T20250101US0001-K"
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'monospace' }}
                      />
                      <small style={{ color: '#666' }}>Your TID provides the fastest way to recover your account.</small>
                    </div>

                    {message && (
                      <div style={{ marginBottom: '15px', color: message.type === 'error' ? '#c0392b' : '#27ae60', fontSize: '14px', fontWeight: 'bold' }}>
                        {message.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? 'Verifying...' : 'Verify Identity'}
                    </button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#27ae60', fontWeight: 'bold', marginBottom: '15px', fontSize: '18px' }}>✓ Identity Verified</p>
                    <button
                      onClick={handleMfaResetConfirm}
                      style={{ padding: '12px 24px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Reset MFA and Link New Phone
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}