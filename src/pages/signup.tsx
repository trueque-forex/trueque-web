import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import apiFetch from '../lib/apiFetch';

type SignupSuccessJson = { session?: any; mfa_token?: string; tid?: string;[k: string]: any };
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

const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'ES', name: 'Spain' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'VE', name: 'Venezuela' },
];

export default function SignupPage(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [phoneCode, setPhoneCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');

  const initialState = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryOfResidence: '',
  };

  const [form, setForm] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const geo = sessionStorage.getItem('user_geo');
    if (geo && !form.countryOfResidence) {
      setForm(prev => ({ ...prev, countryOfResidence: geo }));
      if (COUNTRY_PHONE_CODES[geo]) setPhoneCode(COUNTRY_PHONE_CODES[geo]);
    }

    const draft = sessionStorage.getItem('signupDraft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setForm(prev => ({ ...prev, ...parsedDraft }));
      } catch { }
    }

    const savedPhone = localStorage.getItem('signup_phone_number');
    const savedCode = localStorage.getItem('signup_phone_code');
    if (savedPhone) setPhoneNumber(savedPhone);
    if (savedCode) setPhoneCode(savedCode);
  }, []);

  useEffect(() => {
    if (form.firstName || form.email) {
      sessionStorage.setItem('signupDraft', JSON.stringify(form));
    }
  }, [form]);

  useEffect(() => {
    if (form.countryOfResidence && COUNTRY_PHONE_CODES[form.countryOfResidence]) {
      setPhoneCode(COUNTRY_PHONE_CODES[form.countryOfResidence]);
    }
  }, [form.countryOfResidence]);

  useEffect(() => {
    if (phoneNumber) localStorage.setItem('signup_phone_number', phoneNumber);
    if (phoneCode) localStorage.setItem('signup_phone_code', phoneCode);
  }, [phoneNumber, phoneCode]);

  const handleChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, [k]: value }));
    setFieldErrors(prev => ({ ...prev, [k]: '' }));
    if (k === 'password' || k === 'confirmPassword') setFieldErrors(prev => ({ ...prev, passwordMismatch: '' }));
    setServerError(null);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!form.firstName.trim()) errors.firstName = 'First name required';
    else if (!nameRegex.test(form.firstName.trim())) errors.firstName = 'No numbers or symbols';

    if (!form.lastName.trim()) errors.lastName = 'Last name required';
    else if (!nameRegex.test(form.lastName.trim())) errors.lastName = 'No numbers or symbols';

    if (!form.email) errors.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email';

    if (!phoneNumber || phoneNumber.length < 8) errors.phone = 'Phone required';

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!form.password) errors.password = 'Password required';
    else if (!passwordRegex.test(form.password)) {
      errors.password = 'Min 8 chars, 1 symbol, 1 uppercase';
    }

    if (form.password !== form.confirmPassword) errors.passwordMismatch = 'Mismatch';
    if (!form.countryOfResidence) errors.countryOfResidence = 'Country required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setShowTermsModal(true);
  };

  const confirmSignup = async () => {
    setShowTermsModal(false);
    await executeSignup();
  };

  const executeSignup = async () => {
    setLoading(true);
    const payload = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim(),
      phone: `${phoneCode} ${phoneNumber}`,
      password: form.password,
      country_of_residence: form.countryOfResidence,
      is_test: false
    };

    try {
      const { json, res } = await apiFetch<SignupResponseJson>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      }, { skipAuthRedirect: true });

      const parsed = (json ?? {}) as SignupSuccessJson | SignupErrorJson;

      if (res.ok) {
        setForm(initialState);
        setPhoneNumber('');
        setFieldErrors({});
        sessionStorage.removeItem('signupDraft');
        localStorage.removeItem('signup_phone_number');
        localStorage.removeItem('signup_phone_code');

        if (parsed.session) {
          localStorage.setItem('trueque_session', JSON.stringify(parsed.session));
          localStorage.setItem('is_logged_in', 'true');
          window.location.href = '/dashboard';
          return;
        }

        const mfaRedirect = `/verify-mfa?mfa_token=${encodeURIComponent(parsed?.mfa_token || '')}&tid=${encodeURIComponent(parsed?.tid || '')}`;
        window.location.href = mfaRedirect;
        return;
      }

      const parsedErr = parsed as SignupErrorJson;
      const extractMsg = (e: any) => {
        if (!e) return 'Signup failed';
        if (typeof e === 'string') return e;
        if (typeof e?.message === 'string') return e.message;
        if (typeof e?.error === 'string') return e.error;
        if (typeof e?.error?.message === 'string') return e.error.message;
        // If it's a raw Error object with apiError (from apiFetch)
        if (e?.apiError?.message) return e.apiError.message;
        return JSON.stringify(e);
      };

      setServerError(extractMsg(parsedErr));
    } catch (err: any) {
      // Re-use extractMsg safely or handle err directly
      const msg = err?.apiError?.message || err?.message || 'Signup failed';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3.5 bg-white border border-gray-200 rounded-lg text-sm md:text-base focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all";
  const labelClass = "block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide";
  const errorClass = "text-red-500 text-[10px] mt-0.5 absolute -bottom-4 left-0";

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans bg-white overflow-hidden">
      <Head>
        <title>Create Account - Symmetri</title>
      </Head>

      <div className="hidden md:flex md:w-[25%] bg-gray-50/50 p-8 flex-col justify-between relative border-r border-gray-100">
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#1A73E8]/10 rounded-full blur-[80px] pointer-events-none" />
        <div>
          <Link href="/" className="text-gray-400 hover:text-black transition-colors flex items-center gap-2 font-medium mb-12 text-sm">
            ← Home
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tighter text-gray-900 mb-4">Symmetri</h1>
            <p className="text-gray-500 text-lg leading-relaxed">Identity first. Swap second.</p>
          </div>
        </div>
        <div>
          <div className="flex flex-col gap-2 text-xs text-gray-400">
            <span>Already a member?</span>
            <Link href="/signin" className="text-[#1A73E8] font-bold hover:underline">Sign In Here</Link>
          </div>
        </div>
      </div>

      <div className="flex-1 h-full overflow-y-auto md:overflow-hidden flex items-center justify-center p-6 bg-white relative">
        <div className="w-full max-w-4xl px-4 md:px-12">
          <div className="md:hidden mb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tighter text-gray-900 mb-2">Symmetri</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="relative">
                <label className={labelClass}>First Name</label>
                <input className={inputClass} value={form.firstName} onChange={handleChange('firstName')} placeholder="Juan" required />
                {fieldErrors.firstName && <p className={errorClass}>{fieldErrors.firstName}</p>}
              </div>
              <div className="relative">
                <label className={labelClass}>Last Name</label>
                <input className={inputClass} value={form.lastName} onChange={handleChange('lastName')} placeholder="Perez" required />
                {fieldErrors.lastName && <p className={errorClass}>{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="relative">
                <label className={labelClass}>Email Address</label>
                <input type="email" className={inputClass} value={form.email} onChange={handleChange('email')} placeholder="juan@example.com" required />
                {fieldErrors.email && <p className={errorClass}>{fieldErrors.email}</p>}
              </div>
              <div className="relative">
                <label className={labelClass}>Phone Number</label>
                <div className="flex gap-2">
                  <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} className="p-3.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A73E8]">
                    {Object.values(COUNTRY_PHONE_CODES).map(code => <option key={code} value={code}>{code}</option>)}
                  </select>
                  <input className={`flex-1 ${inputClass}`} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} placeholder="123 456 789" required />
                </div>
                {fieldErrors.phone && <p className={errorClass}>{fieldErrors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="relative">
                <label className={labelClass}>Country of Residence *</label>
                <select className={inputClass} value={form.countryOfResidence} onChange={handleChange('countryOfResidence')} required>
                  <option value="" disabled>Select Country</option>
                  {SUPPORTED_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                <p className="text-[10px] text-gray-400 mt-1 italic">This selection is locked after account creation.</p>
                {fieldErrors.countryOfResidence && <p className={errorClass}>{fieldErrors.countryOfResidence}</p>}
              </div>
              <div className="relative">
                <label className={labelClass}>Password</label>
                <input type={showPassword ? 'text' : 'password'} className={inputClass} value={form.password} onChange={handleChange('password')} placeholder="••••••••" required />
                {fieldErrors.password && <p className={errorClass}>{fieldErrors.password}</p>}
              </div>
            </div>

            <div className="relative">
              <label className={labelClass}>Confirm Password</label>
              <input type={showPassword ? 'text' : 'password'} className={inputClass} value={form.confirmPassword} onChange={handleChange('confirmPassword')} placeholder="••••••••" required />
              {fieldErrors.passwordMismatch && <p className={errorClass}>{fieldErrors.passwordMismatch}</p>}
            </div>

            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                {serverError}
              </div>
            )}

            <div className="pt-4">
              <button disabled={loading} className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50">
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
              <div className="flex items-center justify-center gap-2 mt-4">
                <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(s => !s)} className="w-4 h-4 text-[#1A73E8] rounded border-gray-300 focus:ring-[#1A73E8]" />
                <span className="text-sm text-gray-500">Show passwords</span>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Important Terms</h2>
            <div className="space-y-4 text-gray-600 mb-8 text-sm">
              <p>By proceeding, you agree that Symmetri is a <strong className="text-gray-900">Non-Custodial</strong> protocol.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowTermsModal(false)} className="px-5 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
              <button onClick={confirmSignup} className="px-5 py-2 bg-[#1A73E8] text-white font-bold rounded-lg hover:bg-[#357ABD] text-sm">I Agree</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}