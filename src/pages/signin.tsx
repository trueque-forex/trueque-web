import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfa, setMfa] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Sign in failed');

      if (data.mfa_required) {
        setMfa(data);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mfa) {
    return <MfaView mfa={mfa} onSuccess={() => router.push('/dashboard')} onCancel={() => setMfa(null)} />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col relative overflow-hidden">
      <Head>
        <title>Sign In - Symmetri</title>
      </Head>

      {/* Decorative Glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="absolute top-0 left-0 p-8 z-50">
        <Link href="/" className="text-gray-500 hover:text-black transition-colors flex items-center gap-2 font-medium">
          ← Back to Home
        </Link>
      </nav>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          <div className="text-center mb-10">
            <Link href="/" className="text-4xl font-bold tracking-tighter text-gray-900 block mb-2">
              Symmetri
            </Link>
            <p className="text-gray-500">Welcome back, please sign in.</p>
          </div>

          <div className="bg-white border border-gray-200 shadow-xl shadow-gray-200/50 rounded-2xl p-8 md:p-10">
            <form onSubmit={handleSignin} className="space-y-5">

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-bold text-gray-700">Password</label>
                  <Link href="/forgot-password" className="text-xs text-brand hover:underline font-medium">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all pr-12"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-4 bg-brand text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                New to Symmetri?{' '}
                <Link href="/signup" className="text-brand font-bold hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            By signing in, you agree to our Terms of Service.
          </p>

        </div>
      </main>
    </div>
  );
}

function MfaView({ mfa, onSuccess, onCancel }: any) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verify = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfa_token: mfa.mfa_token, code }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Decorative Glow */}
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm bg-white border border-gray-200 shadow-xl shadow-gray-200/50 rounded-2xl p-8 md:p-10 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Security Check</h2>
          <p className="text-gray-500 text-sm">Enter the code sent to your device ending in ...{mfa.last4 || 'XX'}</p>
        </div>

        <form onSubmit={verify} className="space-y-6">
          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

          <input
            className="w-full p-4 text-center text-4xl font-mono tracking-widest bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={e => setCode(e.target.value)}
            autoFocus
          />

          <button
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Identity'}
          </button>
        </form>

        <button onClick={onCancel} className="mt-6 text-sm text-gray-400 hover:text-gray-800 transition-colors">
          Cancel and go back
        </button>
      </div>
    </div>
  );
}