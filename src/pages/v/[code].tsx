import { useRouter } from 'next/router';
import Head from 'next/head';
// @ts-ignore
import Barcode from 'react-barcode';
import { useEffect, useState } from 'react';

type VoucherData = {
  code: string;
  merchant_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  expires_at: string;
};

export default function ScannableVoucher() {
  const router = useRouter();
  const { code } = router.query;
  const [mounted, setMounted] = useState(false);
  const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    
    // In Next.js, we assume the backend is hosted at NEXT_PUBLIC_API_URL or defaults to localhost:8000
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    fetch(`${apiUrl}/api/vouchers/${code}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Voucher not found');
        }
        return res.json();
      })
      .then((data) => {
        setVoucherData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [code]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>⏳</div>
          <div style={{ fontWeight: '600' }}>Loading voucher...</div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </div>
    );
  }

  if (error || !voucherData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', color: '#ef4444', backgroundColor: '#fee2e2', padding: '32px', borderRadius: '16px', maxWidth: '400px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>Error loading voucher</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>{error || 'Unknown error'}</div>
        </div>
      </div>
    );
  }

  const { merchant_name, amount, currency, status, expires_at } = voucherData;
  const expiryStr = new Date(expires_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Head>
        <title>Symmetri | Scannable Voucher</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '400px',
        borderRadius: '24px',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: status === 'Voided' ? '#ef4444' : (status === 'Redeemed' ? '#64748b' : '#1A73E8'),
          padding: '32px 24px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
             {status === 'Voided' ? '🚫' : (status === 'Redeemed' ? '✅' : '🛍️')}
          </div>
          <h1 style={{ margin: '0', fontSize: '24px', fontWeight: '800' }}>{merchant_name}</h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>Digital Voucher</p>
        </div>

        {/* Content */}
        <div style={{ padding: '32px 24px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Value</p>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#1e293b' }}>
                {formatter.format(amount)} {currency}
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            border: '2px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '24px 16px',
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '32px',
            opacity: (status === 'Voided' || status === 'Redeemed') ? 0.4 : 1
          }}>
            {code ? (
              <Barcode 
                value={code as string}
                width={2}
                height={80}
                fontSize={16}
                margin={0}
                background="#f8fafc"
                lineColor="#0f172a"
              />
            ) : (
              <div style={{ height: '80px', display: 'flex', alignItems: 'center', color: '#94a3b8' }}>Loading barcode...</div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Valid Until</p>
              <p style={{ margin: '0', color: '#1e293b', fontWeight: '600', fontSize: '15px' }}>{expiryStr}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Status</p>
              <p style={{ 
                margin: '0', 
                color: status === 'Ready to Use' ? '#10b981' : (status === 'Redeemed' ? '#64748b' : '#ef4444'), 
                fontWeight: '700', 
                fontSize: '15px' 
              }}>
                {status}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
