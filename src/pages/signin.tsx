// src/pages/signin.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function SignInPage(): React.JSX.Element {
  const router = useRouter();
  const { prefill } = router.query;
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const idRef = useRef<HTMLInputElement | null>(null);
  const passRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof prefill === 'string' && prefill.length) {
      setIdentifier(prefill);
      setTimeout(() => passRef.current?.focus(), 0);
    } else {
      idRef.current?.focus();
    }
  }, [prefill]);

  // Debug-friendly submit helper: sends { email, password } and returns parsed body
  async function submitSignInPayload(identifierValue: string, passwordValue: string) {
    console.log('DEBUG sending signin payload', { email: identifierValue, password: passwordValue });
    const resp = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifierValue, password: passwordValue })
    });
    const body = await resp.json().catch(() => null);
    return { status: resp.status, ok: resp.ok, body };
  }

  async function submitSignIn(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setServerMessage(null);
    setLoading(true);

    try {
      const { status, ok, body } = await submitSignInPayload(identifier, password);
      console.log('DEBUG signin response', { status, ok, body });

      if (!ok) {
        if (body && (body.error === 'missing_fields' || body.code === 'MISSING_FIELDS')) {
          setServerMessage('Missing email or password. Please fill both fields.');
        } else if (body && body.error === 'invalid_credentials') {
          setServerMessage('Invalid credentials. Try again or use Forgot password.');
        } else {
          setServerMessage(body?.message || `Sign in failed (${status})`);
        }
        setLoading(false);
        return;
      }

      if (body && body.mfa_required) {
        router.push(`/mfa?mfa_token=${encodeURIComponent(body.mfa_token)}&tid=${encodeURIComponent(body.tid || '')}`);
        return;
      }

      if (body && body.session) {
        // Store session data in localStorage for greeting
        localStorage.setItem('trueque_session', JSON.stringify(body.session));

        // Redirect to swap page instead of /app
        router.replace('/swap');
        return;
      }
      // Redirect to swap page
      router.replace('/swap');
    } catch (err: any) {
      console.error('signin unexpected error', err);
      setServerMessage(err?.message || 'Network error during sign in');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    border: '2px solid #e1e8ed',
    borderRadius: '10px',
    backgroundColor: 'white',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '10px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#34495e'
  };

  const errorStyle: React.CSSProperties = {
    color: '#e74c3c',
    fontSize: '14px',
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#fff5f5',
    border: '2px solid #e74c3c',
    borderRadius: '8px',
    fontWeight: '500'
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
        padding: '30px 40px',
        color: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', margin: 0 }}>
            Welcome back to Trueque
          </h1>
          <button
            onClick={() => router.push('/welcome')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
          >
            Back to Welcome
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 600, margin: '40px auto', padding: '0 40px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '30px',
            color: '#2c3e50',
            textAlign: 'center'
          }}>
            Sign in to your account
          </h2>

          <form onSubmit={submitSignIn} noValidate>
            <div style={{ display: 'grid', gap: '25px' }}>
              {/* Username or Email */}
              <div>
                <label htmlFor="identifier" style={labelStyle}>Username or Email</label>
                <input
                  id="identifier"
                  ref={idRef}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com or username"
                  required
                  autoComplete="username email"
                  style={inputStyle}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <label htmlFor="password" style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPassword((s) => !s);
                      setTimeout(() => passRef.current?.focus(), 0);
                    }}
                    aria-pressed={showPassword}
                    aria-controls="password"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#4A90E2',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <input
                  id="password"
                  ref={passRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={inputStyle}
                  placeholder="Enter your password"
                />
              </div>

              {/* Error Message */}
              {serverMessage && (
                <div role="alert" style={errorStyle}>
                  {serverMessage}
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'white',
                  background: loading
                    ? '#bdc3c7'
                    : 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.3)',
                  marginTop: '10px'
                }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              {/* Secondary Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '10px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#4A90E2',
                    background: 'white',
                    border: '2px solid #4A90E2',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Forgot Password?
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/signup')}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#7f8c8d',
                    background: 'white',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Create Account
                </button>
              </div>
            </div>
          </form>

          {/* Additional Help Text */}
          <p style={{
            marginTop: '30px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#7f8c8d',
            lineHeight: '1.6'
          }}>
            By signing in, you agree to Trueque's Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>
    </div>
  );
}