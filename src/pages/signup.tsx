// File: src/pages/signup.tsx
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../lib/apiFetch';

type Beneficiary = {
  name: string;
  type: 'bank' | 'card' | 'wallet';
  account: string;
};

type SignupSuccessJson = { redirectCorridor?: string;[k: string]: any };
type SignupErrorJson = { error?: string; code?: string; message?: string;[k: string]: any };
type SignupResponseJson = SignupSuccessJson | SignupErrorJson | null;

export default function SignupPage(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [rawServerDebug, setRawServerDebug] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryOfResidence: '',
    countryDestiny: '',
    address: ''
  });

  const today = useMemo(() => new Date(), []);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const maxDob = useMemo(() => {
    const dt = new Date(today);
    dt.setFullYear(dt.getFullYear() - 18);
    return iso(dt);
  }, [today]);
  const minDob = useMemo(() => {
    const dt = new Date(today);
    dt.setFullYear(dt.getFullYear() - 100);
    return iso(dt);
  }, [today]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        (e.target as HTMLInputElement).type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setForm(prev => ({ ...prev, [k]: value }));
      setFieldErrors(prev => ({ ...prev, [k]: '' }));
      if (k === 'password' || k === 'confirmPassword') setFieldErrors(prev => ({ ...prev, passwordMismatch: '' }));
      setServerError(null);
      setRawServerDebug(null);
    };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.dob) errors.dob = 'Date of birth is required';
    else {
      if (form.dob > maxDob) errors.dob = 'You must be at least 18 years old';
      if (form.dob < minDob) errors.dob = 'Please enter a valid birth date';
    }
    if (!form.email) errors.email = 'Email is required';
    if (!form.password) errors.password = 'Password is required';
    if (form.password !== form.confirmPassword) errors.passwordMismatch = 'Passwords do not match';
    if (!form.countryOfResidence) errors.countryOfResidence = 'Country of residence is required';
    if (!form.countryDestiny) errors.countryDestiny = 'Destination country is required';
    if (!form.address) errors.address = 'Address is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function fetchRawTextOnError(url: string, init: RequestInit) {
    try {
      const res = await fetch(url, init);
      const text = await res.text();
      return { status: res.status, text };
    } catch (err: any) {
      return { status: 0, text: String(err?.message || err) };
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('DEBUG: handleSubmit called');
    setServerError(null);
    setRawServerDebug(null);
    if (!validate()) {
      console.log('DEBUG: Validation failed', fieldErrors);
      return;
    }
    console.log('DEBUG: Validation passed, submitting...');
    setLoading(true);

    const payload: any = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      dob: form.dob,
      email: form.email.trim(),
      password: form.password,
      country_of_residence: form.countryOfResidence,
      country_destiny: form.countryDestiny,
      address: form.address ? form.address.trim() : null,
      username: form.email.split('@')[0], // Auto-generate username from email
      is_test: false
    };



    try {
      const { json, res } = await apiFetch<SignupResponseJson>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });

      const parsed = (json ?? {}) as SignupResponseJson;

      if (res.ok) {
        // Store user session for swap page
        const sessionData = {
          email: payload.email,
          firstName: payload.first_name,
          lastName: payload.last_name,
          country_of_residence: payload.country_of_residence,
          country_destiny: payload.country_destiny,
          truequeId: parsed.trueque_id
        };
        localStorage.setItem('trueque_session', JSON.stringify(sessionData));

        // Redirect to success page to show Trueque ID
        router.replace('/signup-success');
        return;
      }

      const parsedErr = parsed as SignupErrorJson;
      if (parsed && (parsedErr.error === 'email_exists' || parsedErr.code === 'EMAIL_EXISTS')) {
        setServerError('An account with this email already exists. You can sign in or reset your password.');
        setFieldErrors(prev => ({ ...prev, email: 'Email already registered' }));
        setLoading(false);
        return;
      }

      const message = parsedErr?.message || parsedErr?.error || null;
      if (message) {
        setServerError(String(message));
        setLoading(false);
        return;
      }

      throw new Error('Unexpected signup response from server');
    } catch (err: any) {
      const apiErr = err?.apiError ?? null;
      if (apiErr) {
        console.error('signup apiError', apiErr);
        const backendMsg =
          apiErr.body?.message ??
          apiErr.body?.error ??
          (typeof apiErr.body === 'string' ? apiErr.body : JSON.stringify(apiErr.body));
        setServerError(backendMsg || `Server error ${apiErr.status}`);
        setRawServerDebug(JSON.stringify(apiErr, null, 2));
      } else {
        console.error('signup unexpected error', err);
        setServerError(err?.message || 'Signup request failed');
        setRawServerDebug(String(err?.stack || err));
      }
      setLoading(false);
    }
  };

  // Common styles (matching signin.tsx)
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
    fontSize: '13px',
    marginTop: '6px',
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
            Create your Trueque account
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
      <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 40px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'grid', gap: '25px' }}>

              {/* Name Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label htmlFor="firstName" style={labelStyle}>First name</label>
                  <input
                    id="firstName"
                    required
                    value={form.firstName}
                    onChange={handleChange('firstName')}
                    style={inputStyle}
                  />
                  {fieldErrors.firstName && <div style={errorStyle}>{fieldErrors.firstName}</div>}
                </div>

                <div>
                  <label htmlFor="lastName" style={labelStyle}>Last name</label>
                  <input
                    id="lastName"
                    required
                    value={form.lastName}
                    onChange={handleChange('lastName')}
                    style={inputStyle}
                  />
                  {fieldErrors.lastName && <div style={errorStyle}>{fieldErrors.lastName}</div>}
                </div>
              </div>

              {/* DOB */}
              <div>
                <label htmlFor="dob" style={labelStyle}>Date of birth</label>
                <input
                  id="dob"
                  type="date"
                  required
                  value={form.dob}
                  onChange={handleChange('dob')}
                  max={maxDob}
                  min={minDob}
                  style={inputStyle}
                />
                <div style={{ fontSize: 13, color: '#7f8c8d', marginTop: 6 }}>
                  You must be between 18 and 100 years old.
                </div>
                {fieldErrors.dob && <div style={errorStyle}>{fieldErrors.dob}</div>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" style={labelStyle}>Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange('email')}
                  style={inputStyle}
                />
                {fieldErrors.email && <div style={errorStyle}>{fieldErrors.email}</div>}
              </div>

              {/* Password Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label htmlFor="password" style={labelStyle}>Password</label>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={handleChange('password')}
                    style={inputStyle}
                  />
                  {fieldErrors.password && <div style={errorStyle}>{fieldErrors.password}</div>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" style={labelStyle}>Confirm password</label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    style={inputStyle}
                  />
                  {fieldErrors.passwordMismatch && <div style={errorStyle}>{fieldErrors.passwordMismatch}</div>}
                </div>
              </div>

              {/* Show Password Toggle */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(s => !s)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#34495e' }}>Show password</span>
                </label>
              </div>

              {/* Location Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label htmlFor="countryOfResidence" style={labelStyle}>Country of residence</label>
                  <input
                    id="countryOfResidence"
                    required
                    value={form.countryOfResidence}
                    onChange={handleChange('countryOfResidence')}
                    style={inputStyle}
                    placeholder="e.g. US"
                  />
                  {fieldErrors.countryOfResidence && <div style={errorStyle}>{fieldErrors.countryOfResidence}</div>}
                </div>

                <div>
                  <label htmlFor="countryDestiny" style={labelStyle}>Destination Country</label>
                  <input
                    id="countryDestiny"
                    required
                    value={form.countryDestiny}
                    onChange={handleChange('countryDestiny')}
                    style={inputStyle}
                    placeholder="e.g. MX"
                  />
                  {fieldErrors.countryDestiny && <div style={errorStyle}>{fieldErrors.countryDestiny}</div>}
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" style={labelStyle}>Address</label>
                <input
                  id="address"
                  required
                  value={form.address}
                  onChange={handleChange('address')}
                  style={inputStyle}
                />
                {fieldErrors.address && <div style={errorStyle}>{fieldErrors.address}</div>}
              </div>



              {/* Server Errors */}
              {serverError && (
                <div style={{
                  padding: '15px',
                  backgroundColor: '#fff5f5',
                  border: '2px solid #e74c3c',
                  borderRadius: '10px',
                  color: '#c0392b'
                }}>
                  <div>{serverError}</div>

                  {fieldErrors.email && fieldErrors.email.includes('registered') && (
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => router.push('/signin')}
                        style={{
                          padding: '10px 20px',
                          background: '#4A90E2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Sign in
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const alias = form.email.includes('@') ? form.email.replace('@', `+dev${Date.now()}@`) : `${form.email}+dev@dev.local`;
                          setForm(prev => ({ ...prev, email: alias }));
                          setServerError('Using a dev alias to continue testing (email updated).');
                          setFieldErrors(prev => ({ ...prev, email: '' }));
                        }}
                        style={{
                          padding: '10px 20px',
                          background: '#f1f2f6',
                          color: '#2c3e50',
                          border: '1px solid #ced6e0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Use dev alias
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Debug Info */}
              {rawServerDebug && (
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  background: '#2c3e50',
                  color: '#ecf0f1',
                  padding: '15px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  overflowX: 'auto'
                }}>
                  {rawServerDebug}
                </pre>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'white',
                    background: loading ? '#bdc3c7' : 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{
                    flex: 1,
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#7f8c8d',
                    background: 'white',
                    border: '2px solid #e1e8ed',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Back
                </button>
              </div>

            </div>
          </form>
        </div>
      </main>
    </div>
  );
}