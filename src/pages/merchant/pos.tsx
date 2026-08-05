import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { withAuth } from '../../lib/withAuth';
import { TruequeSession } from '../../types/auth';

interface MerchantPOSProps {
  session: TruequeSession;
}

const MerchantPOS: React.FC<MerchantPOSProps> = ({ session }) => {
  const router = useRouter();
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  if (session.user.userType !== 'MERCHANT') {
    if (typeof window !== 'undefined') {
      router.push('/dashboard');
    }
    return <div className="p-8">Access Denied. Merchants only.</div>;
  }

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucher_code: voucherCode })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to redeem voucher');
      } else {
        setSuccess('Voucher successfully redeemed!');
        setVoucherCode('');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Head>
        <title>Merchant POS | Symmetri</title>
      </Head>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Symmetri Point of Sale</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

        <form onSubmit={handleRedeem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scan or Enter Voucher Code
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. VOUCHER-12345"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !voucherCode}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Redeem Voucher'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const getServerSideProps = withAuth(async (context: any) => {
  const session = context.session;
  
  if (session?.user?.userType !== 'MERCHANT') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: { session }
  };
});

export default MerchantPOS;

