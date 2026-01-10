// File: src/pages/signup.tsx
import React, { useMemo, useState, useEffect } from 'react';
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

const COUNTRY_PHONE_CODES: Record<string, string> = {
  'ES': '+34',
  'PT': '+351',
  'US': '+1',
  'MX': '+52',
  'GT': '+502',
  'CO': '+57',
  'AR': '+54',
  'VE': '+58',
};

export default function SignupPage(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [rawServerDebug, setRawServerDebug] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Phone State (Mandatory)
  const [phoneCode, setPhoneCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryOfResidence: '',
    countryDestiny: '',
    // address: '', // Deprecated in favor of split fields
    street_address: '',
    apartment: '',
    city: '',
    state_province: '',
    postal_code: ''
  });

  // Pre-fill from IP Locator & Storage
  useEffect(() => {
    // 0. Redirect if Already Logged In
    const session = localStorage.getItem('trueque_session');
    if (session) {
      router.push('/dashboard');
      return;
    }

    // 1. IP Locator
    const geo = sessionStorage.getItem('user_geo');
    if (geo) {
      setForm(prev => ({ ...prev, countryOfResidence: geo }));
      const codes: Record<string, string> = { 'US': '+1', 'AR': '+54', 'MX': '+52', 'BR': '+55', 'CO': '+57' };
      if (codes[geo]) setPhoneCode(codes[geo]);
    }

    // 2. Hydrate Draft
    const draft = sessionStorage.getItem('signupDraft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setForm(prev => ({ ...prev, ...parsedDraft }));
        // Also hydrate phone number if saved separately or parsed?
        // form uses single fields, phone is split.
        // If draft has raw phone, we might miss splits.
        // Assuming persistence saves exact form structure.
      } catch { }
    }
  }, []);

  // Save Draft on Change
  useEffect(() => {
    if (form.firstName || form.email) {
      sessionStorage.setItem('signupDraft', JSON.stringify(form));
    }
  }, [form]);

  // Sync Phone Code with Country of Residence
  useEffect(() => {
    if (form.countryOfResidence && COUNTRY_PHONE_CODES[form.countryOfResidence]) {
      setPhoneCode(COUNTRY_PHONE_CODES[form.countryOfResidence]);
    }
  }, [form.countryOfResidence]);

  // Absolute Persistence for Phone (LocalStorage)
  useEffect(() => {
    if (phoneNumber) {
      localStorage.setItem('signup_phone_number', phoneNumber);
    }
    if (phoneCode) {
      localStorage.setItem('signup_phone_code', phoneCode);
    }
  }, [phoneNumber, phoneCode]);

  useEffect(() => {
    const savedPhone = localStorage.getItem('signup_phone_number');
    const savedCode = localStorage.getItem('signup_phone_code');
    if (savedPhone) setPhoneNumber(savedPhone);
    if (savedCode) setPhoneCode(savedCode);
  }, []);

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
    if (!phoneNumber || phoneNumber.length < 8) errors.phone = 'Valid mobile number is required';
    if (!form.password) errors.password = 'Password is required';
    if (form.password !== form.confirmPassword) errors.passwordMismatch = 'Passwords do not match';
    if (!form.countryOfResidence) errors.countryOfResidence = 'Country of residence is required';
    // if (!form.countryDestiny) errors.countryDestiny = 'Destination country is required'; // OPTIONAL NOW
    // if (!form.address) errors.address = 'Address is required';
    if (!form.street_address) errors.street_address = 'Street address is required';
    if (!form.city) errors.city = 'City is required';
    if (!form.state_province) errors.state_province = 'State/Province is required';
    if (!form.postal_code) errors.postal_code = 'Postal Code is required';

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
      phone: `${phoneCode} ${phoneNumber}`,
      password: form.password,
      country_of_residence: form.countryOfResidence,
      country_destiny: form.countryDestiny,
      address: `${form.street_address} ${form.apartment || ''}, ${form.city}, ${form.state_province} ${form.postal_code}`,
      street_address: form.street_address,
      apartment: form.apartment,
      city: form.city,
      state_province: form.state_province,
      postal_code: form.postal_code,
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
        // Instant Session & Auto-Login
        localStorage.setItem('trueque_session', JSON.stringify(parsed));

        // Store DRAFT for KYC pre-filling
        const registrationDraft = {
          dob: payload.dob,
          street_address: payload.street_address,
          apartment: payload.apartment,
          city: payload.city,
          state_province: payload.state_province,
          postal_code: payload.postal_code,
          country: payload.country_of_residence,
          nationality: payload.country_of_residence,
          fullLegalName: `${payload.first_name} ${payload.last_name}`
        };
        sessionStorage.setItem('registrationDraft', JSON.stringify(registrationDraft));

        console.log('DEBUG: Signup Success. Waiting for cookie to settle...');
        // Wait for Session Cookie to settle (Race Condition Fix)
        await new Promise(r => setTimeout(r, 1500));

        // Redirect directly to KYC
        router.replace('/kyc?newUser=true');
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
            onClick={() => router.push('/')}
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

              {/* Mobile Phone (Mandatory) */}
              <div>
                <label style={labelStyle}>Mobile Phone (MFA)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    style={{ ...inputStyle, width: '120px' }}
                  >
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+351">🇵🇹 +351</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+502">🇬🇹 +502</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+54">🇦🇷 +54</option>
                    <option value="+58">🇻🇪 +58</option>
                  </select>
                  <input
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Mobile Number"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
                {fieldErrors.phone && <div style={errorStyle}>{fieldErrors.phone}</div>}
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

              {/* Address Split Fields */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Residential Address</label>

                {/* Street & Apt */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <input
                      type="text"
                      name="street_address"
                      placeholder="Street Address"
                      value={form.street_address}
                      onChange={handleChange('street_address')}
                      style={{
                        width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px',
                        border: fieldErrors.street_address ? '1px solid #e74c3c' : '1px solid #bdc3c7'
                      }}
                    />
                    {fieldErrors.street_address && <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>{fieldErrors.street_address}</div>}
                  </div>
                  <div>
                    <input
                      type="text"
                      name="apartment"
                      placeholder="Apt/Suite (Opt)"
                      value={form.apartment}
                      onChange={handleChange('apartment')}
                      style={{
                        width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px',
                        border: '1px solid #bdc3c7'
                      }}
                    />
                  </div>
                </div>

                {/* City & State */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={form.city}
                      onChange={handleChange('city')}
                      style={{
                        width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px',
                        border: fieldErrors.city ? '1px solid #e74c3c' : '1px solid #bdc3c7'
                      }}
                    />
                    {fieldErrors.city && <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>{fieldErrors.city}</div>}
                  </div>
                  <div>
                    <input
                      type="text"
                      name="state_province"
                      placeholder="State/Province"
                      value={form.state_province}
                      onChange={handleChange('state_province')}
                      style={{
                        width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px',
                        border: fieldErrors.state_province ? '1px solid #e74c3c' : '1px solid #bdc3c7'
                      }}
                    />
                    {fieldErrors.state_province && <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>{fieldErrors.state_province}</div>}
                  </div>
                </div>

                {/* Zip */}
                <div>
                  <input
                    type="text"
                    name="postal_code"
                    placeholder="Postal/Zip Code"
                    value={form.postal_code}
                    onChange={handleChange('postal_code')}
                    style={{
                      width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px',
                      border: fieldErrors.postal_code ? '1px solid #e74c3c' : '1px solid #bdc3c7'
                    }}
                  />
                  {fieldErrors.postal_code && <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>{fieldErrors.postal_code}</div>}
                </div>
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