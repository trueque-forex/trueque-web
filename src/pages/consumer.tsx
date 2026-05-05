// src/pages/index.tsx — Symmetri Landing Page (Option C)
// • Signed-in → /dashboard  •  Anonymous → landing
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Self-contained interceptor to prevent AuthContext from redirecting unauthenticated users
// on this specific page without having to modify the global AuthContext.tsx file.
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    if (window.location.pathname === '/consumer' && typeof args[0] === 'string' && args[0].includes('/api/auth/session')) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return originalFetch(...args);
  };
}

// ─── Live Rate Ticker ─────────────────────────────────────────────────────────
type RatePair = { from: string; to: string; label: string };
const RATE_PAIRS: RatePair[] = [
  { from: 'USD', to: 'MXN', label: 'USD → MXN' },
  { from: 'USD', to: 'GTQ', label: 'USD → GTQ' },
  { from: 'USD', to: 'DOP', label: 'USD → DOP' },
];

function useRates() {
  const [rates, setRates] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const results: Record<string, string> = {};
      await Promise.all(
        RATE_PAIRS.map(async ({ from, to, label }) => {
          try {
            const res = await fetch(`/api/rate?from=${from}&to=${to}`);
            if (!res.ok) return;
            const data = await res.json();
            results[label] = Number(data.rate).toFixed(4);
          } catch { /* rate API fallback handles this */ }
        })
      );
      if (!cancelled) setRates(results);
    }
    fetchAll();
    const interval = setInterval(fetchAll, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);
  return rates;
}

// ─── Fee Row helper ───────────────────────────────────────────────────────────
function FeeRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
      <span style={{ fontSize: '14px', color: '#64748b' }}>{label}</span>
      <span style={{
        fontSize: '14px', fontWeight: '700',
        color: highlight ? '#27ae60' : '#1e293b',
        background: highlight ? '#f0fdf4' : 'transparent',
        padding: highlight ? '2px 10px' : '0',
        borderRadius: '20px',
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const rates = useRates();
  const [checking, setChecking] = useState(true);
  const [feeOpen, setFeeOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (data?.user?.id) router.replace('/dashboard');
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  if (checking) return null;

  return (
    <>
      <Head>
        <title>Symmetri — Don't Send Money. Send Value.</title>
        <meta name="description" content="Send purchasing power directly to your family. Redeemable at their preferred grocery store. Mid-market rate. No Symmetri fees. Instant." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" />
      </Head>

      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh', backgroundColor: '#f0f2f5', color: '#2c3e50' }}>

        {/* ── Nav ── */}
        <nav style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 40px', height: '64px', position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          {/* Logo */}
          <div style={{ fontWeight: '900', fontSize: '20px', color: '#1A73E8', letterSpacing: '-0.5px' }}>
            Symmetri
          </div>

          {/* Live Rate Ticker */}
          <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
            {RATE_PAIRS.map(({ label }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: rates[label] ? '#27ae60' : '#cbd5e1' }}>
                  {rates[label] ?? '—'}
                </span>
              </div>
            ))}
            <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Auth */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/signin" style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#2c3e50', fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>
              Sign In
            </Link>
            <Link href="/signup" style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#1A73E8', color: 'white', fontWeight: '700', fontSize: '14px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(26,115,232,0.3)' }}>
              Get Started
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px 48px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#1A73E8', marginBottom: '28px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#27ae60', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Live mid-market rates · Not remittance · Not a wire transfer
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 5.5vw, 62px)', fontWeight: '900', lineHeight: 1.08, letterSpacing: '-1.5px', marginBottom: '20px', color: '#0f172a' }}>
            Don't send money.<br />
            <span style={{ color: '#1A73E8' }}>Send value.</span>
          </h1>

          <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '520px', margin: '0 auto 36px', lineHeight: 1.7 }}>
            Your family receives purchasing power — redeemable immediately at their preferred grocery store
            in <strong style={{ color: '#2c3e50' }}>Mexico, Guatemala or Dominican Republic</strong>.
            Mid-market rate. No Symmetri fees. Instant.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <Link href="/signup" id="hero-cta-value" style={{
              padding: '14px 32px', backgroundColor: '#1A73E8', color: 'white',
              borderRadius: '10px', fontWeight: '800', fontSize: '16px', textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(26,115,232,0.35)',
            }}>
              Send Value Now →
            </Link>
            <Link href="/signup" id="hero-cta-swap" style={{
              padding: '14px 32px', backgroundColor: 'white', color: '#2c3e50',
              borderRadius: '10px', fontWeight: '700', fontSize: '16px', textDecoration: 'none',
              border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              Swap Currencies P2P
            </Link>
          </div>

          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Already have an account?{' '}
            <Link href="/signin" style={{ color: '#1A73E8', fontWeight: '700', textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </section>

        {/* ── What we offer ── */}
        <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 64px' }}>

          {/* Three pillars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            {[
              {
                icon: '📊',
                title: 'Mid-Market Rate',
                desc: 'We use the real exchange rate — the same banks use between themselves. Zero FX spread added by Symmetri.',
                color: '#1A73E8',
              },
              {
                icon: '🚫',
                title: 'No Symmetri Fees',
                desc: 'We charge zero service fees for sending value via vouchers. Standard fees from your payment method may apply.',
                color: '#27ae60',
              },
              {
                icon: '⚡',
                title: 'Instant Delivery',
                desc: 'Voucher code delivered the moment it settles. No waiting days for a wire to arrive.',
                color: '#f59e0b',
              },
            ].map(p => (
              <div key={p.title} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '32px', marginBottom: '14px' }}>{p.icon}</div>
                <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a', marginBottom: '8px' }}>{p.title}</div>
                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.65 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          {/* Fee Breakdown Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setFeeOpen(o => !o)}
            >
              <div>
                <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a', marginBottom: '4px' }}>
                  💸 See exactly what you pay
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Example: sending $100 USD → local currency voucher
                </div>
              </div>
              <div style={{ fontSize: '20px', color: '#94a3b8', transform: feeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                ⌄
              </div>
            </div>

            {feeOpen && (
              <div style={{ marginTop: '20px' }}>
                <FeeRow label="Value you want to deliver" value="$100.00 USD equivalent" />
                <FeeRow label="Exchange rate (mid-market)" value="Real rate — no spread" highlight />
                <FeeRow label="Symmetri service fee" value="$0.00" highlight />
                <FeeRow label="Standard fee — bank transfer (ACH)" value="+$0.25 approx." />
                <FeeRow label="Standard fee — debit/credit card" value="+1.5–2.5% (issuer fee)" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 0', marginTop: '4px' }}>
                  <span style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>Total charged to your account</span>
                  <span style={{ fontWeight: '900', fontSize: '18px', color: '#27ae60' }}>$100.25 (bank) / ~$102 (card)</span>
                </div>
                <div style={{ marginTop: '14px', padding: '12px 16px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '13px', color: '#15803d', lineHeight: 1.6 }}>
                  Your family receives the full $100.00 in purchasing power. Symmetri adds <strong>zero markup</strong> — the only cost is your standard payment method fee.
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Two Product Cards ── */}
        <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 64px' }}>
          <h2 style={{ fontWeight: '900', fontSize: '26px', color: '#0f172a', marginBottom: '6px', textAlign: 'center' }}>
            Two ways to send value
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px', textAlign: 'center', marginBottom: '32px' }}>
            One account. Two products. Both at mid-market rate.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

            {/* Phase 1 card */}
            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <ProductCard
                id="card-send-value"
                icon="🎟️"
                badge="No MTL Required"
                badgeColor="#1A73E8"
                title="Send Value"
                bullets={[
                  '📊 Real mid-market rate',
                  '🚫 Zero Symmetri fees',
                  '⚡ Instant delivery',
                  '🛒 Redeemable at preferred grocery stores',
                  '📱 Code via SMS or WhatsApp',
                ]}
                cta="Send Value Now →"
                ctaColor="#1A73E8"
                hoverBorder="#1A73E8"
              />
            </Link>

            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <ProductCard
                id="card-swap-p2p"
                icon="💱"
                badge="Coming Soon"
                badgeColor="#94a3b8"
                title="Swap Currencies P2P"
                bullets={[
                  '🔗 Matched with someone going the other way',
                  '🏠 Both sides settle domestically',
                  '📊 Mid-market rate — no FX spread',
                  '🏛️ FinCEN registered — US compliant',
                  '🔒 Full KYC required',
                ]}
                cta="Join Waitlist →"
                ctaColor="#94a3b8"
                hoverBorder="#94a3b8"
              />
            </Link>
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ backgroundColor: 'white', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
            <h2 style={{ fontWeight: '900', fontSize: '26px', color: '#0f172a', marginBottom: '6px', textAlign: 'center' }}>
              Sending Value — How It Works
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', textAlign: 'center', marginBottom: '40px' }}>
              Voucher delivery in four steps. No bank account needed on either end.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
              {[
                { icon: '✉️', step: '01', title: 'Create account', desc: 'Sign up in under 60 seconds. No MTL, no waiting.' },
                { icon: '🎯', step: '02', title: 'Choose amount', desc: 'Enter how much to send. We show you the real exchange rate.' },
                { icon: '📲', step: '03', title: 'Recipient notified', desc: 'They receive a code via SMS or WhatsApp — instantly.' },
                { icon: '🛒', step: '04', title: 'Value redeemed', desc: 'They show the code at their preferred store and shop.' },
              ].map(item => (
                <div key={item.step} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#1A73E8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Step {item.step}</div>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>{item.title}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust bar ── */}
        <section style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px' }}>
            {[
              { icon: '💳', text: 'Standard fees from your payment method only' },
              { icon: '📈', text: 'Real exchange rate applied at time of delivery' },
              { icon: '🔐', text: 'Non-custodial — we never hold funds' },
              { icon: '⚡', text: 'Voucher delivered the moment it settles' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                <span>{item.icon}</span> {item.text}
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ backgroundColor: 'white', borderTop: '1px solid #e2e8f0', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontWeight: '900', fontSize: '16px', color: '#1A73E8' }}>Symmetri</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[{ label: 'How it works', href: '/how-it-works' }, { label: 'Fees', href: '/fees' }, { label: 'Sign In', href: '/signin' }].map(l => (
              <Link key={l.href} href={l.href} style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>{l.label}</Link>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>© 2026 Symmetri · Fair Value Protocol</div>
        </footer>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </>
  );
}

// ─── Product Card Component ───────────────────────────────────────────────────
function ProductCard({ id, icon, badge, badgeColor, title, bullets, cta, ctaColor, hoverBorder }: {
  id: string; icon: string; badge: string; badgeColor: string;
  title: string; bullets: string[]; cta: string; ctaColor: string; hoverBorder: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      id={id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'white', borderRadius: '16px', padding: '28px',
        border: `2px solid ${hovered ? hoverBorder : '#e2e8f0'}`,
        boxShadow: hovered ? `0 8px 28px ${hoverBorder}22` : '0 2px 12px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <span style={{ fontSize: '36px' }}>{icon}</span>
        <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', backgroundColor: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}33` }}>
          {badge}
        </span>
      </div>
      <div style={{ fontWeight: '800', fontSize: '18px', color: '#0f172a', marginBottom: '14px' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
        {bullets.map(b => (
          <div key={b} style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{b}</div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: `${ctaColor}12`, borderRadius: '10px', border: `1px solid ${ctaColor}30` }}>
        <span style={{ fontWeight: '700', color: ctaColor, fontSize: '14px' }}>{cta}</span>
        <span style={{ color: ctaColor, fontSize: '18px' }}>→</span>
      </div>
    </div>
  );
}