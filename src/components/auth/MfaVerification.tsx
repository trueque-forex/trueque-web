import { useState } from 'react';
import { useRouter } from 'next/router';

export default function MfaVerification({ mfaToken, tid }: { mfaToken: string, tid: string }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfa_token: mfaToken, code, tid }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid code');
        setLoading(false);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Check your device</h2>
      <p className="text-gray-500 mb-8">Enter the 6-digit security code to unlock your account.</p>

      <form onSubmit={handleVerify} className="space-y-6">
        <input 
          type="text" 
          maxLength={6} 
          value={code} 
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="w-full text-center text-4xl font-mono tracking-widest py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all"
          placeholder="000000"
          autoFocus
        />
        
        {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
        
        <button 
          type="submit" 
          disabled={loading || code.length < 6}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Access Dashboard'}
        </button>
      </form>
    </div>
  );
}