'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: 'US',
    password: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setErrorMsg('You must accept the Terms and Privacy Policy to create an account.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to create account');
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12">
      
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-brand rounded-[10px] flex items-center justify-center shadow-md">
          <span className="text-white font-extrabold text-sm leading-none">S</span>
        </div>
        <span className="text-primary font-bold text-xl tracking-tight">Symmetri</span>
      </Link>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-sm">
        <h1 className="text-2xl font-bold text-primary mb-2 text-center">Create Account</h1>
        <p className="text-secondary text-sm text-center mb-8">
          Join Symmetri and start swapping value securely.
        </p>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-primary text-sm font-semibold mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-background border border-gray-200 rounded-xl px-4 py-3 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-primary text-sm font-semibold mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-background border border-gray-200 rounded-xl px-4 py-3 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Pérez"
              />
            </div>
          </div>

          <div>
            <label className="block text-primary text-sm font-semibold mb-2">Email address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-background border border-gray-200 rounded-xl px-4 py-3 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all placeholder:text-gray-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-primary text-sm font-semibold mb-2">Residence Country</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full bg-background border border-gray-200 rounded-xl px-4 py-3 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all appearance-none"
            >
              <option value="US">🇺🇸 United States</option>
              <option value="ES">🇪🇸 Spain</option>
            </select>
          </div>

          <div>
            <label className="block text-primary text-sm font-semibold mb-2">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-background border border-gray-200 rounded-xl px-4 py-3 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all placeholder:text-gray-400"
              placeholder="Min. 8 characters"
            />
          </div>

          <div className="flex items-start gap-3 mt-4 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand bg-white"
            />
            <label htmlFor="terms" className="text-xs text-secondary leading-relaxed">
              I agree to the Symmetri{' '}
              <Link href="/legal/terms" className="text-brand hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/legal/privacy" className="text-brand hover:underline">Privacy Policy</Link>.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-sm mt-4"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-secondary text-sm text-center mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-brand hover:text-blue-600 font-semibold">
            Sign In
          </Link>
        </p>
      </div>

    </div>
  );
}
