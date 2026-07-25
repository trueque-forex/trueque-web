import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For Partners',
  description: 'Partner with Symmetri to receive guaranteed digital capital flows directly to your point of sale. Zero cash handling. Predictable working capital.',
};

// ── Value Props ────────────────────────────────────────────────────────────────
const VALUE_PROPS = [
  {
    title: 'Optimized Working Capital (OWC)',
    desc: 'Gain predictive visibility into cross-border capital inflows weeks in advance. Reduce safety stock requirements and optimize your supply chain with guaranteed pre-authorized spend.',
    stat: '15–30%',
    statLabel: 'average inventory cost reduction',
    color: 'blue',
  },
  {
    title: 'Zero Cash Handling',
    desc: 'Eliminate vaulting, armored transport, and physical security overhead. Every Symmetri transaction is 100% digital from the sender\'s origin directly to your register.',
    stat: '100%',
    statLabel: 'digital — no cash ever changes hands',
    color: 'emerald',
  },
  {
    title: '100% Market Capture',
    desc: 'Cross-border capital is locked into your retail ecosystem. Vouchers are single-store or network-bound — preventing spend leakage to competitors.',
    stat: '0%',
    statLabel: 'capital leakage from your network',
    color: 'amber',
  },
  {
    title: 'The Invisible Rail',
    desc: 'Symmetri never competes with you for customer loyalty. We are the capital delivery mechanism. You are the destination. Our job is to make the swap invisible and the redemption instant.',
    stat: '1 scan',
    statLabel: 'is all the cashier does',
    color: 'indigo',
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; stat: string }> = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    stat: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', stat: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   stat: 'text-amber-600' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200',  stat: 'text-indigo-600' },
};

// ── B2B FAQ ───────────────────────────────────────────────────────────────────
const B2B_FAQ = [
  {
    q: 'How does Symmetri generate revenue if users pay zero fees?',
    a: 'Symmetri earns a wholesale procurement discount (retailer_wholesale_margin) on the voucher face value — a B2B commercial arrangement agreed directly with each retail partner. This margin is invisible to the sender and has zero impact on the exchange rate shown to users.',
  },
  {
    q: 'What does my cashier actually do?',
    a: 'Nothing new. The customer presents a code (QR or alphanumeric) at your existing POS. Your cashier scans it exactly like any other gift card or voucher. No new hardware. No new training. Our system handles the backend reconciliation.',
  },
  {
    q: 'How does Symmetri handle compliance and KYC?',
    a: 'All senders complete a graduated KYC process (EMPTY → PENDING → APPROVED) before any transaction is executed. We use OFAC sanctions screening and document verification. We are a technology platform operating under licensed payment provider rails.',
  },
  {
    q: 'Is Symmetri a money transmitter?',
    a: 'No. Symmetri is a technological swap currency platform. We do not hold or custody user funds at any point. All payments flow through licensed, regulated payment providers. Symmetri acts strictly as an orchestrator.',
  },
  {
    q: 'What is the minimum order value for a voucher?',
    a: 'The minimum order value (MOV) is $20.00 USD equivalent. This is a hard system constraint to ensure economic viability for all parties.',
  },
  {
    q: 'Which payment rails do senders use?',
    a: 'Phase 1 (Vouchers) accepts: ACH, RTP/FedNow, Debit/Credit Card, and Zelle from the US. From Spain: Bizum and SEPA. Gateway fees are added on top of the principal — the beneficiary always receives the full voucher face value.',
  },
  {
    q: 'How do I onboard my store network?',
    a: 'Contact us at partners@symmetri.org. We will schedule a technical integration call to discuss your POS system, voucher redemption flow, and wholesale margin structure. Typical onboarding takes 2–4 weeks.',
  },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-background text-primary">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative py-28 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand/5 blur-[90px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400/5 blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-gray-200 mb-8">
            <span className="text-brand text-xs font-bold uppercase tracking-widest">B2B Partner Program</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-primary mb-6">
            We are the digital rail.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-600">
              You are the destination.
            </span>
          </h1>
          <p className="text-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Symmetri routes cross-border purchasing power directly to your registers as guaranteed digital vouchers.
            No cash. No volatility. Predictable capital flows at your point of sale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:partners@symmetri.org?subject=Partner%20Inquiry%3A%20Symmetri%20Phase%201%20Pilot"
              id="partners-cta-email"
              className="px-8 py-4 bg-brand hover:bg-blue-600 text-white font-bold text-base rounded-xl shadow-lg shadow-brand/20 transition-colors w-full sm:w-auto text-center"
            >
              Start a Partnership Conversation →
            </a>
            <a
              href="#b2b-faq"
              className="px-8 py-4 bg-white border border-gray-200 shadow-sm text-secondary hover:text-primary hover:border-gray-300 font-semibold text-base rounded-xl transition-all w-full sm:w-auto text-center"
            >
              Technical FAQ ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── The Utility Pitch ──────────────────────────────────────────── */}
      <section className="py-8 px-4 sm:px-6 bg-blue-50 border-y border-blue-100">
        <div className="max-w-4xl mx-auto text-center">
          <blockquote className="text-primary text-base sm:text-lg leading-relaxed italic">
            &ldquo;We are the digital rail. We don&rsquo;t drive your customers; we empower them.
            If they choose you, we ensure the capital is there waiting at your register.
            Our job is to make the swap invisible and the redemption instant.&rdquo;
          </blockquote>
          <p className="text-secondary text-sm mt-3">— Symmetri Partner Mandate</p>
        </div>
      </section>

      {/* ── Value Props ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand text-sm font-bold uppercase tracking-widest mb-3">Why Partner</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-4">
              Enterprise infrastructure for retail networks.
            </h2>
            <p className="text-secondary text-base max-w-xl mx-auto">
              Built for scale, security, and maximum capital efficiency across borders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {VALUE_PROPS.map((vp) => {
              const c = colorMap[vp.color];
              return (
                <div key={vp.title} className="group bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 rounded-2xl p-8 transition-all duration-300">
                  <div className={`inline-flex items-baseline gap-1.5 mb-5`}>
                    <span className={`text-4xl font-extrabold ${c.stat}`}>{vp.stat}</span>
                    <span className="text-secondary text-xs font-medium">{vp.statLabel}</span>
                  </div>
                  <h3 className="text-primary font-bold text-xl mb-3">{vp.title}</h3>
                  <p className="text-secondary text-sm leading-relaxed">{vp.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Retailer Networks ──────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-white border-y border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-8">Current Network</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'Mexico',             count: '20+ stores', flag: '🇲🇽' },
              { name: 'Colombia',           count: '6+ stores',  flag: '🇨🇴' },
              { name: 'Guatemala',          count: '4+ stores',  flag: '🇬🇹' },
              { name: 'Dominican Republic', count: '3+ stores',  flag: '🇩🇴' },
            ].map((market) => (
              <div key={market.name} className="bg-background border border-gray-200 shadow-sm rounded-xl p-5 text-center">
                <div className="text-3xl mb-2">{market.flag}</div>
                <div className="text-primary font-semibold text-sm">{market.name}</div>
                <div className="text-secondary text-xs mt-1">{market.count}</div>
              </div>
            ))}
          </div>
          <p className="text-secondary text-sm mt-8">
            Spain and Portugal corridors launching Q3 2026. Contact us to be a launch partner.
          </p>
        </div>
      </section>

      {/* ── How the Integration Works ──────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand text-sm font-bold uppercase tracking-widest mb-3">Technical Integration</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-4">
              Minimal lift for your team.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { step: '1', title: 'Webhook Registration', desc: 'Your POS registers a webhook endpoint. Symmetri sends a signed event payload when a voucher is issued.' },
              { step: '2', title: 'Voucher Validation',   desc: 'On redemption, your cashier scans the code. Your system calls /validate — we confirm the balance and mark redeemed atomically.' },
              { step: '3', title: 'Settlement',           desc: 'Your network receives settlement on the agreed schedule (daily, weekly). We provide full transaction-level reconciliation reports.' },
            ].map((item) => (
              <div key={item.step} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-7">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
                  <span className="text-brand font-extrabold text-sm">{item.step}</span>
                </div>
                <h3 className="text-primary font-bold text-base mb-2">{item.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact CTA ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-white border-y border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-4">
            Ready to discuss a pilot?
          </h2>
          <p className="text-secondary text-base mb-8 max-w-xl mx-auto">
            We work directly with retail networks, pharmacy chains, and convenience store operators.
            Let&rsquo;s talk about your corridors and your customer demographics.
          </p>
          <a
            href="mailto:partners@symmetri.org?subject=Partner%20Inquiry%3A%20Symmetri%20Phase%201%20Pilot"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand hover:bg-blue-600 text-white font-bold text-base rounded-xl shadow-lg shadow-brand/20 transition-colors"
          >
            Email partners@symmetri.org
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>

      {/* ══ B2B FAQ ═══════════════════════════════════════════════════════ */}
      <section id="b2b-faq" className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand text-sm font-bold uppercase tracking-widest mb-3">Partner FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-4">
              Technical & Commercial Questions
            </h2>
          </div>
          <div className="space-y-4">
            {B2B_FAQ.map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-7">
                <h3 className="text-primary font-bold text-base mb-3">{item.q}</h3>
                <p className="text-secondary text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm">
              More questions?{' '}
              <a href="mailto:partners@symmetri.org" className="text-brand hover:text-blue-600 underline underline-offset-2">
                Email our partnerships team
              </a>
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
