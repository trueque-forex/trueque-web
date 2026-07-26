'use client';
import { useMarket } from '@/context/MarketContext';
import Link from 'next/link';

// ── Corridor data ─────────────────────────────────────────────────────────────
const CORRIDORS = {
  US: [
    {
      from: '🇺🇸', fromLabel: 'United States',
      to: '🇲🇽',   toLabel: 'Mexico',
      stores: ['OXXO', 'Soriana', 'HEB', 'Walmart MX', 'Chedraui'],
      rail: 'FedNow / RTP',
    },
    {
      from: '🇺🇸', fromLabel: 'United States',
      to: '🇬🇹',   toLabel: 'Guatemala',
      stores: ['La Torre', 'Farmacias Batres', 'Farmacias Galeno'],
      rail: 'ACH Local',
    },
    {
      from: '🇺🇸', fromLabel: 'United States',
      to: '🇩🇴',   toLabel: 'Dominican Republic',
      stores: ['Sirena', 'Farmacia Carol'],
      rail: 'LBTR Instant',
    },
  ],
  ES: [
    {
      from: '🇪🇸', fromLabel: 'Spain',
      to: '🇨🇴',   toLabel: 'Colombia',
      stores: ['Grupo Éxito', 'Jumbo', 'Carulla', 'Farmatodo'],
      rail: 'Bizum / SEPA',
    },
    {
      from: '🇪🇸', fromLabel: 'Spain',
      to: '🇩🇴',   toLabel: 'Dominican Republic',
      stores: ['Sirena', 'Farmacia Los Hidalgos'],
      rail: 'Bizum / SEPA',
    },
  ],
};

// ── How It Works steps ────────────────────────────────────────────────────────
const getSteps = (originMarket: string) => [
  {
    n: '1',
    title: 'You Pay',
    desc: `Choose your amount and pay securely from ${originMarket === 'US' ? 'the US' : 'Spain'}. Debit card, instant bank transfer, or Zelle — your choice.`,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    n: '2',
    title: 'We Generate a Voucher',
    desc: 'Symmetri instantly creates a digital voucher for your family\'s nearest participating store. Your money never moves to us.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
      </svg>
    ),
  },
  {
    n: '3',
    title: 'Your Family Gets a Code',
    desc: 'We send the voucher code directly to your family via SMS or WhatsApp. No smartphone, no bank account, no app required on their end.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3" />
      </svg>
    ),
  },
  {
    n: '4',
    title: 'They Shop',
    desc: 'Your family walks into their local store and shows the code at the register. The cashier scans it. Transaction complete. No waiting.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
      </svg>
    ),
  },
];

// ── Why Trust Symmetri ────────────────────────────────────────────────────────
const TRUST_PILLARS = [
  {
    title: 'Real exchange rates. Always.',
    desc: 'We use the same mid-market rate you see on Google. We take zero cut from the exchange. What you see is what your family gets.',
    color: 'emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: 'Zero fees for your family.',
    desc: 'Your family pays absolutely nothing. They walk in, show the code, and shop. The cost is only on your end — and it\'s completely transparent.',
    color: 'amber',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'No app. No bank account.',
    desc: 'Your family only needs their phone number. We send a text message. That\'s it. No smartphone app, no bank account, no Venmo required.',
    color: 'blue',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3" />
      </svg>
    ),
  },
  {
    title: 'Your money never passes through us.',
    desc: 'Symmetri is a technology platform, not a bank. We orchestrate the swap. We never hold, store, or custody your funds at any moment.',
    color: 'indigo',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200' },
};

// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { originMarket } = useMarket();
  const corridors = CORRIDORS[originMarket] ?? CORRIDORS.US;

  return (
    <div className="min-h-screen bg-background text-primary overflow-hidden">

      {/* ══ HERO SECTION ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-4 sm:px-6 py-24">

        {/* Ambient background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand/5 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-300/10 blur-[120px]" />
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[2px] bg-gradient-to-r from-transparent via-brand/10 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-secondary text-xs font-medium tracking-wide">
              {originMarket === 'US' ? 'Sending from the United States' : 'Sending from Spain'} — Zero fees for your family
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 animate-fade-in-up-1">
            <span className="gradient-text-hero">Stop Sending Cash.</span>
            <br />
            <span className="text-primary">Start Swapping Value.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up-2">
            You work hard for your money.{' '}
            <span className="text-primary font-medium">We built the technology to protect it.</span>
            {' '}Send a digital voucher to your family — redeemable at their neighborhood store, instantly.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up-3">
            <Link
              href="/signin"
              id="hero-cta-primary"
              className="px-8 py-4 bg-brand hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-base rounded-xl shadow-lg shadow-brand/20 transition-all duration-300 w-full sm:w-auto"
            >
              Send Your First Voucher →
            </Link>
            <a
              href="#how-it-works"
              id="hero-cta-secondary"
              className="px-8 py-4 bg-white border border-gray-200 text-secondary hover:text-primary hover:border-gray-300 shadow-sm font-semibold text-base rounded-xl transition-all duration-300 w-full sm:w-auto"
            >
              See How It Works
            </a>
          </div>

          {/* Trust micro-signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 animate-fade-in-up-4">
            {[
              '✓ Zero hidden fees',
              '✓ Real exchange rate',
              '✓ No smartphone needed at pickup',
            ].map((t) => (
              <span key={t} className="text-gray-500 text-sm font-medium">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-white/50 to-background pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand text-sm font-bold uppercase tracking-widest mb-3">Simple & Transparent</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary mb-4">
              From your phone to their hands<br className="hidden sm:block" /> in four steps.
            </h2>
            <p className="text-secondary text-base sm:text-lg max-w-xl mx-auto">
              No paperwork. No waiting in line. No cash handed to a stranger.
            </p>
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {getSteps(originMarket).map((step, i) => (
              <div
                key={step.n}
                className="relative group bg-white border border-gray-200 shadow-sm rounded-2xl p-7 hover:border-brand/30 hover:shadow-md transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Connector line (desktop) */}
                {i < getSteps(originMarket).length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-2.5 w-5 h-px bg-gradient-to-r from-brand/40 to-transparent z-20" />
                )}

                {/* Step number ring */}
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-brand font-extrabold text-sm">{step.n}</span>
                </div>

                {/* Icon */}
                <div className="text-gray-400 mb-4 group-hover:text-brand transition-colors duration-300">
                  {step.icon}
                </div>

                <h3 className="text-primary font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CORRIDORS ═════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-white border-y border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand text-sm font-bold uppercase tracking-widest mb-3">Available Routes</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-4">
              Where can your family pick up?
            </h2>
            <p className="text-secondary text-base max-w-lg mx-auto">
              Your family walks into a store they already know and trust.
              No new accounts. No confusion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {corridors.map((corridor) => (
              <div
                key={`${corridor.fromLabel}-${corridor.toLabel}`}
                className="bg-background border border-gray-200 shadow-sm rounded-2xl p-6 hover:border-brand/20 hover:shadow-md transition-all duration-300 group"
              >
                {/* Route header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{corridor.from}</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-brand/30 to-transparent" />
                  <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <div className="flex-1 h-px bg-gradient-to-l from-brand/30 to-transparent" />
                  <span className="text-3xl">{corridor.to}</span>
                </div>

                {/* Labels */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-secondary text-xs font-medium">{corridor.fromLabel}</span>
                  <span className="text-secondary text-xs font-medium">{corridor.toLabel}</span>
                </div>

                {/* Stores */}
                <div className="space-y-1.5">
                  <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-2">Pickup stores</p>
                  <div className="flex flex-wrap gap-1.5">
                    {corridor.stores.map((store) => (
                      <span key={store} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-secondary text-xs font-medium group-hover:border-gray-300 transition-colors">
                        {store}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rail */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-500 text-xs">Paid via {corridor.rail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY TRUST SYMMETRI ════════════════════════════════════════════════ */}
      <section className="py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand text-sm font-bold uppercase tracking-widest mb-3">Built for Trust</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary mb-4">
              Why thousands of families<br className="hidden sm:block" /> trust Symmetri.
            </h2>
            <p className="text-secondary text-base max-w-lg mx-auto">
              Every decision we made was for the person sending — not for us.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TRUST_PILLARS.map((pillar) => {
              const c = colorMap[pillar.color];
              return (
                <div
                  key={pillar.title}
                  className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 hover:shadow-md transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <span className={c.text}>{pillar.icon}</span>
                  </div>
                  <h3 className="text-primary font-bold text-lg mb-3">{pillar.title}</h3>
                  <p className="text-secondary text-sm leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════════════════════ */}
      <section className="py-28 px-4 sm:px-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-brand/5 blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-12 sm:p-16">
            <div className="text-4xl mb-5 animate-float">💪</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-4">
              Ready to protect your<br />hard-earned money?
            </h2>
            <p className="text-secondary text-base sm:text-lg mb-8 max-w-md mx-auto">
              Create your free account in 2 minutes. Your family can start using vouchers today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                id="footer-cta-primary"
                className="px-8 py-4 bg-brand hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-base rounded-xl shadow-lg shadow-brand/20 w-full sm:w-auto text-center transition-colors"
              >
                Create Your Free Account →
              </Link>
              <Link
                href="/faq"
                className="px-8 py-4 bg-white border border-gray-200 text-secondary hover:text-primary hover:border-gray-300 font-semibold text-base rounded-xl shadow-sm transition-all duration-300 w-full sm:w-auto text-center"
              >
                Read FAQ First
              </Link>
            </div>
            <p className="text-gray-500 text-xs mt-6">No credit card required. No subscription. Pay only when you send.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
