<<<<<<< HEAD
// src/pages/signup.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../lib/apiFetch';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { json } = await apiFetch<{ needsKyc?: boolean; kycStatus?: string }>(
        '/api/auth/signup',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
        { timeoutMs: 8000 }
      );

      const needsKyc = json?.needsKyc ?? false;
      const kycStatus = json?.kycStatus ?? null;

      if (needsKyc || kycStatus !== 'approved') {
        await router.push('/kyc/status');
        return;
      }

      await router.push('/welcome');
    } catch (err: any) {
      setError(err?.message ?? 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Sign up</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        </label>

        {error && <div role="alert">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
=======
// File: src/pages/signup.tsx
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../lib/apiFetch';

type Beneficiary = {
  name: string;
  type: 'bank' | 'card' | 'wallet';
  account: string;
};

type SignupSuccessJson = { redirectCorridor?: string; [k: string]: any };
type SignupErrorJson = { error?: string; code?: string; message?: string; [k: string]: any };
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
    address: '',
    includeBeneficiary: false,
    beneficiaryName: '',
    beneficiaryType: 'bank' as Beneficiary['type'],
    beneficiaryAccount: ''
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
    if (form.includeBeneficiary) {
      if (!form.beneficiaryName) errors.beneficiaryName = 'Beneficiary name is required';
      if (!form.beneficiaryAccount) errors.beneficiaryAccount = 'Beneficiary account is required';
    }
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
    setServerError(null);
    setRawServerDebug(null);
    if (!validate()) return;
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
      is_test: false
    };

    if (form.includeBeneficiary) {
      payload.beneficiary = {
        name: form.beneficiaryName.trim(),
        type: form.beneficiaryType,
        account: form.beneficiaryAccount.trim()
      };
    }

    try {
      const { json, ok } = await apiFetch<SignupResponseJson>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });

      const parsed = (json ?? {}) as SignupResponseJson;

      if (ok) {
        const corridor = (parsed as SignupSuccessJson).redirectCorridor;
        const target = corridor ? `/app?corridor=${encodeURIComponent(corridor)}` : '/app';
        router.replace(target);
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

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
      <h1>Create your Trueque account</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label htmlFor="firstName">First name</label>
            <input id="firstName" required value={form.firstName} onChange={handleChange('firstName')} />
            {fieldErrors.firstName && <div style={{ color: 'red' }}>{fieldErrors.firstName}</div>}
          </div>

          <div>
            <label htmlFor="lastName">Last name</label>
            <input id="lastName" required value={form.lastName} onChange={handleChange('lastName')} />
            {fieldErrors.lastName && <div style={{ color: 'red' }}>{fieldErrors.lastName}</div>}
          </div>

          <div>
            <label htmlFor="dob">Date of birth</label>
            <input
              id="dob"
              type="date"
              required
              value={form.dob}
              onChange={handleChange('dob')}
              max={maxDob}
              min={minDob}
              aria-describedby="dobHelp"
            />
            <div id="dobHelp" style={{ fontSize: 12, color: '#555' }}>
              You must be between 18 and 100 years old.
            </div>
            {fieldErrors.dob && <div style={{ color: 'red' }}>{fieldErrors.dob}</div>}
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={handleChange('email')} />
            {fieldErrors.email && <div style={{ color: 'red' }}>{fieldErrors.email}</div>}
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={handleChange('password')}
              aria-describedby="passwordHelp"
            />
            <div id="passwordHelp" style={{ fontSize: 12, color: '#555' }}>
              Password requirements are enforced server-side.
            </div>
            {fieldErrors.password && <div style={{ color: 'red' }}>{fieldErrors.password}</div>}
          </div>

          <div>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
            />
            {fieldErrors.passwordMismatch && <div style={{ color: 'red' }}>{fieldErrors.passwordMismatch}</div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(s => !s)} />
              <span>Show password</span>
            </label>
          </div>

          <div>
            <label htmlFor="countryOfResidence">Country of residence</label>
            <input id="countryOfResidence" required value={form.countryOfResidence} onChange={handleChange('countryOfResidence')} />
            {fieldErrors.countryOfResidence && <div style={{ color: 'red' }}>{fieldErrors.countryOfResidence}</div>}
          </div>

          <div>
            <label htmlFor="address">Address</label>
            <input id="address" required value={form.address} onChange={handleChange('address')} />
            {fieldErrors.address && <div style={{ color: 'red' }}>{fieldErrors.address}</div>}
          </div>

          <div>
            <label htmlFor="countryDestiny">Country Destiny (preferred corridor partner)</label>
            <input id="countryDestiny" required value={form.countryDestiny} onChange={handleChange('countryDestiny')} />
            {fieldErrors.countryDestiny && <div style={{ color: 'red' }}>{fieldErrors.countryDestiny}</div>}
          </div>

          <div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={form.includeBeneficiary} onChange={handleChange('includeBeneficiary')} />
              <span>I want to enter beneficiary information now</span>
            </label>
          </div>

          {form.includeBeneficiary && (
            <>
              <div>
                <label htmlFor="beneficiaryName">Beneficiary name</label>
                <input id="beneficiaryName" value={form.beneficiaryName} onChange={handleChange('beneficiaryName')} />
                {fieldErrors.beneficiaryName && <div style={{ color: 'red' }}>{fieldErrors.beneficiaryName}</div>}
              </div>

              <div>
                <label htmlFor="beneficiaryType">Beneficiary account type</label>
                <select id="beneficiaryType" value={form.beneficiaryType} onChange={handleChange('beneficiaryType')}>
                  <option value="bank">Bank Account</option>
                  <option value="card">Debit Card</option>
                  <option value="wallet">Digital Wallet</option>
                </select>
              </div>

              <div>
                <label htmlFor="beneficiaryAccount">Beneficiary account identifier</label>
                <input id="beneficiaryAccount" value={form.beneficiaryAccount} onChange={handleChange('beneficiaryAccount')} />
                {fieldErrors.beneficiaryAccount && <div style={{ color: 'red' }}>{fieldErrors.beneficiaryAccount}</div>}
              </div>
            </>
          )}

          {serverError && (
            <div style={{ color: 'red', marginTop: 8 }}>
              <div>{serverError}</div>

              {fieldErrors.email && fieldErrors.email.includes('registered') && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => router.push('/signin')}
                    style={{ padding: '8px 12px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: 6 }}
                  >
                    Sign in
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/auth/forgot')}
                    style={{ padding: '8px 12px', background: 'transparent', color: '#0066cc', border: '1px solid #0066cc', borderRadius: 6 }}
                  >
                    Forgot password
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const alias = form.email.includes('@') ? form.email.replace('@', `+dev${Date.now()}@`) : `${form.email}+dev@dev.local`;
                      setForm(prev => ({ ...prev, email: alias }));
                      setServerError('Using a dev alias to continue testing (email updated).');
                      setFieldErrors(prev => ({ ...prev, email: '' }));
                    }}
                    style={{ padding: '8px 12px', background: '#eee', color: '#222', border: '1px solid #ccc', borderRadius: 6 }}
                  >
                    Use dev alias
                  </button>
                </div>
              )}
            </div>
          )}

          {rawServerDebug && (
            <pre style={{ whiteSpace: 'pre-wrap', background: '#111', color: '#eee', padding: 10, borderRadius: 6, marginTop: 8 }}>
              {rawServerDebug}
            </pre>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <button type="button" onClick={() => router.push('/welcome')} style={{ padding: '8px 12px' }}>
              Cancel
            </button>

            <button type="button" onClick={() => router.back()} style={{ padding: '8px 12px' }}>
              Back
            </button>
          </div>
        </div>
      </form>

      {serverError && (
        <div role="alert" style={{ color: 'crimson', marginTop: 12 }}>
          {serverError}
        </div>
      )}

      {rawServerDebug && (
        <pre style={{ marginTop: 12, background: '#f7f7f7', padding: 12 }}>{rawServerDebug}</pre>
      )}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    </main>
  );
}