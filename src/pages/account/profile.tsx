// src/pages/account/profile.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

type ProfileResponse = {
  id?: string;
  email?: string;
  name?: string;
  created_at?: string;
  needsKYC?: boolean;
  [k: string]: any
};

export default function ProfilePage(): React.JSX.Element {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        // Try to get from local session first for immediate display
        const sessionData = localStorage.getItem('trueque_session');
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            if (mounted) {
              setProfile({
                id: session.user?.id || session.id || '...',
                email: session.user?.email || session.email || '...',
                name: session.user?.name || session.name || session.firstName || 'User',
                created_at: session.created_at, // session doesn't usually carry created_at, but we'll leave it if it's there or undefined
                needsKYC: false // Assume verified if in session for now, or fetch real status
              });
            }
          } catch (e) {
            console.error("Session parse error", e);
          }
        }

        const res = await fetch('/api/profile', {
          credentials: 'same-origin',
          headers: { 'Cache-Control': 'no-cache' }
        });

        if (!res.ok) {
          // If API fails, we might still have session data, so don't hard fail if we have profile
          if (!profile) {
            const text = await res.text();
            throw new Error(`Request failed: ${res.status} ${res.statusText}`);
          }
        } else {
          const json = (await res.json()) as ProfileResponse;
          if (mounted) setProfile(json);
        }

      } catch (err: any) {
        if (mounted && !profile) setError(err?.message ?? 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('trueque_session');
    router.push('/signin');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
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
            <span style={{ fontSize: '16px', opacity: 0.9 }}>Account Profile</span>
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
                background: 'rgba(255,255,255,0.2)',
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
          {/* Centered Name Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#4A90E2',
              borderRadius: '50%',
              margin: '0 auto 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
              fontWeight: '600'
            }}>
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h2 style={{ fontSize: '28px', color: '#2c3e50', margin: 0 }}>
              {profile?.name || 'Loading...'}
            </h2>
          </div>

          {error && (
            <div style={{
              padding: '15px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {loading && !profile ? (
            <div style={{ color: '#7f8c8d', textAlign: 'center' }}>Loading profile...</div>
          ) : profile ? (
            <div style={{ display: 'grid', gap: '20px' }}>

              {/* Member Since & Name Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e1e8ed',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Member Since
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
                    {formatDate(profile.created_at)}
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e1e8ed',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Full Name
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
                    {profile.name || '—'}
                  </div>
                </div>
              </div>

              {/* Email Box */}
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                border: '1px solid #e1e8ed'
              }}>
                <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Email Address
                </div>
                <div style={{ fontSize: '18px', color: '#2c3e50' }}>
                  {profile.email || '—'}
                </div>
              </div>

              {/* Navigation Links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
                <button
                  onClick={() => router.push('/account/payment-methods')}
                  style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    border: '2px solid #4A90E2',
                    borderRadius: '12px',
                    color: '#4A90E2',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  Form of Payments
                  <span>→</span>
                </button>

                <button
                  onClick={() => router.push('/account/transactions')}
                  style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    border: '2px solid #4A90E2',
                    borderRadius: '12px',
                    color: '#4A90E2',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  Past Transactions
                  <span>→</span>
                </button>
              </div>

              {/* KYC Information */}
              <div style={{
                marginTop: '20px',
                padding: '25px',
                backgroundColor: profile.needsKYC ? '#fff3cd' : '#d1fae5',
                border: `1px solid ${profile.needsKYC ? '#ffeeba' : '#a7f3d0'}`,
                borderRadius: '12px'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: profile.needsKYC ? '#856404' : '#065f46', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{profile.needsKYC ? '⚠️' : '✅'}</span>
                  KYC Information
                </h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${profile.needsKYC ? '#ffeeba' : '#a7f3d0'}`, paddingBottom: '10px' }}>
                    <span style={{ color: profile.needsKYC ? '#856404' : '#047857' }}>Status</span>
                    <span style={{ fontWeight: '600', color: profile.needsKYC ? '#856404' : '#047857' }}>
                      {profile.needsKYC ? 'Verification Required' : 'Verified'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '5px' }}>
                    <span style={{ color: profile.needsKYC ? '#856404' : '#047857' }}>Trueque ID</span>
                    <span style={{ fontFamily: 'monospace', color: profile.needsKYC ? '#856404' : '#047857' }}>
                      {profile.id || '—'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/account/kyc-info')}
                  style={{
                    marginTop: '20px',
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}
                >
                  View KYC Details
                </button>

                {profile.needsKYC && (
                  <button
                    onClick={() => router.push('/kyc')}
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#e67e22',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '16px'
                    }}
                  >
                    Complete Identity Verification
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>No profile data available.</p>
          )}
        </div>
      </main>
    </div>
  );
}