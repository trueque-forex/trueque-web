import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header';

export default function VoucherSuccess() {
    const router = useRouter();
    const { code, id, retailer, amountLocal, currency, amountUsd, total, paymentMethod, expiresAt, beneficiaryName, beneficiaryPhone } = router.query as Record<string, string>;

    const expiryDate = expiresAt
        ? new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '30 days from today';

    const qrUrl = code ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}&bgcolor=ffffff&color=4f46e5` : '';

    const handleShare = () => {
        const text = `Your Symmetri voucher for ${retailer}:\nCode: ${code}\nValue: ${amountLocal} ${currency}\nValid until: ${expiryDate}`;
        if (navigator.share) {
            navigator.share({ title: `${retailer} Voucher`, text });
        } else {
            navigator.clipboard.writeText(code);
            alert('Voucher code copied to clipboard!');
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: "'Inter', sans-serif" }}>
            <Head><title>Symmetri | Voucher Ready 🎟️</title></Head>
            <Header />
            <main style={{ maxWidth: '520px', margin: '40px auto', padding: '0 20px' }}>

                {/* Success Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '12px' }}>🎟️</div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px' }}>Voucher Ready!</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>
                        {beneficiaryName
                            ? <>For <strong>{beneficiaryName}</strong> — redeemable at <strong>{retailer}</strong></>
                            : <>Redeemable at any <strong>{retailer}</strong> store</>}
                    </p>
                </div>

                {/* Delivery */}
                {beneficiaryPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '20px' }}>📲</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', color: '#1d4ed8', fontSize: '13px' }}>Forward this code to your beneficiary</div>
                            <div style={{ fontSize: '12px', color: '#2563eb' }}>Use the Share button below — send via WhatsApp, SMS, or any app</div>
                        </div>
                    </div>
                )}

                {/* Voucher Code Card + QR */}
                <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: '20px', padding: '32px', marginBottom: '24px', textAlign: 'center', boxShadow: '0 10px 40px rgba(124,58,237,0.3)' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>Voucher Code</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', fontFamily: 'monospace', letterSpacing: '0.05em', wordBreak: 'break-all', marginBottom: '16px' }}>{code}</div>
                    {qrUrl && (
                        <div style={{ background: 'white', borderRadius: '12px', padding: '12px', display: 'inline-block', marginBottom: '16px' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrUrl} alt="Voucher QR Code" width={160} height={160} style={{ display: 'block' }} />
                        </div>
                    )}
                    <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>
                        {parseFloat(amountLocal || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
                    </div>
                    <div style={{ fontSize: '13px', color: '#c4b5fd' }}>at {retailer} stores in Mexico</div>
                </div>

                {/* Details */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    {[
                        ['You paid', `$${parseFloat(total || amountUsd || '0').toFixed(2)} USD`],
                        ['Payment method', paymentMethod === 'ach' ? '🏦 Bank Transfer (ACH/RTP)' : paymentMethod === 'zelle' ? '💚 Zelle' : '💳 Card'],
                        paymentMethod === 'card' ? ['Card issuer fee', `$${(parseFloat(total||'0') - parseFloat(amountUsd||'0')).toFixed(2)} — Visa/Mastercard/Amex (not Symmetri)`] : null,
                        ['Symmetri fee', '✦ $0.00 — None'],
                        ['Valid until', expiryDate],
                    ].filter(Boolean).map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                            <span style={{ color: '#64748b' }}>{label}</span>
                            <strong style={{ color: label === 'Symmetri fee' ? '#16a34a' : label === 'Card issuer fee' ? '#dc2626' : '#1e293b', textAlign: 'right', maxWidth: '60%' }}>{value}</strong>
                        </div>
                    ))}
                </div>

                {/* How to Redeem */}
                <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
                    <div style={{ fontWeight: '700', color: '#854d0e', marginBottom: '10px' }}>📋 How to Redeem</div>
                    <ol style={{ margin: 0, paddingLeft: '20px', color: '#78350f', fontSize: '14px', lineHeight: 1.7 }}>
                        <li>Share the code or QR with your beneficiary in Mexico</li>
                        <li>They go to any <strong>{retailer}</strong> store</li>
                        <li>Show the QR or type the code at the register</li>
                        <li>Code is single-use and valid for 30 days</li>
                    </ol>
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gap: '12px' }}>
{id && (
                        <button onClick={() => router.push(`/voucher/track/${id}`)}
                            style={{ padding: '16px', background: '#1e293b', color: 'white', fontWeight: '700', fontSize: '15px', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            🎟️ View My Voucher
                        </button>
                    )}
                    <button onClick={handleShare}
                        style={{ padding: '16px', background: '#7c3aed', color: 'white', fontWeight: '700', fontSize: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
                        📤 Share Voucher Code
                    </button>
                    <button onClick={() => router.push('/voucher')}
                        style={{ padding: '14px', background: '#f1f5f9', color: '#475569', fontWeight: '600', fontSize: '15px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                        Send Another Voucher
                    </button>
                    <button onClick={() => router.push('/dashboard')}
                        style={{ padding: '14px', background: 'none', color: '#94a3b8', fontWeight: '500', fontSize: '14px', border: 'none', cursor: 'pointer' }}>
                        Back to Dashboard
                    </button>
                </div>
            </main>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
        </div>
    );
}
