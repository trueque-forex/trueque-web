import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Symmetri',
  description: 'Symmetri is a neutral technological swap currency platform — a digital rail connecting hardworking immigrants with their families\' daily needs. We are not a bank.',
};

const PRINCIPLES = [
  {
    title: 'We are a neutral orchestrator.',
    desc: 'Symmetri does not take sides in the market. We route value from origin to destination along the most efficient path. We are not competing with banks, remittance companies, or retailers. We are the digital rail they all run on.',
    icon: '⚖️',
  },
  {
    title: 'We never hold your money.',
    desc: 'Zero-custody is our foundational design constraint — not a feature we added. Symmetri moves transaction authority, not funds. Your money travels through licensed payment rails. We only orchestrate the swap.',
    icon: '🔒',
  },
  {
    title: 'The exchange rate is yours.',
    desc: 'Our Consensus FX Engine aggregates mid-market rates from multiple sources and validates them against each other before showing you a number. You see the same rate Google does. We take no spread.',
    icon: '📊',
  },
  {
    title: 'Technology as the equalizer.',
    desc: 'Banks and remittance operators built systems that charge the people who can least afford the fees. We built the system they should have built. The technology exists to protect every dollar. We just choose to use it that way.',
    icon: '🌐',
  },
];

const CORRIDORS = [
  { from: '🇺🇸 United States', to: '🇲🇽 Mexico',              rail: 'FedNow / RTP' },
  { from: '🇺🇸 United States', to: '🇬🇹 Guatemala',           rail: 'ACH Local' },
  { from: '🇺🇸 United States', to: '🇩🇴 Dominican Republic',   rail: 'LBTR Instant' },
  { from: '🇪🇸 Spain',         to: '🇨🇴 Colombia',             rail: 'Bizum / SEPA' },
  { from: '🇪🇸 Spain',         to: '🇩🇴 Dominican Republic',   rail: 'Bizum / SEPA' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-primary">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-5%] right-[0%] w-[500px] h-[500px] rounded-full bg-brand/5 blur-[90px]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <p className="text-brand text-sm font-bold uppercase tracking-widest mb-5">About Symmetri</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-8">
            We are not a bank.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-400">
              We are the digital rail.
            </span>
          </h1>
          <p className="text-secondary text-lg sm:text-xl leading-relaxed max-w-2xl">
            Symmetri is a neutral technological swap currency platform.
            Our mission is simple: route purchasing power from origin to destination
            with perfect transparency, zero custody, and zero hidden costs.
          </p>
        </div>
      </section>

      {/* ── The Problem We Solve ───────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-white border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-brand text-sm font-bold uppercase tracking-widest mb-4">The Problem</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mb-6 leading-tight">
                Cross-border value transfer was designed against the sender.
              </h2>
              <p className="text-secondary text-base leading-relaxed mb-4">
                Traditional remittance operators charge 3–7% in fees, then silently take another 2–4%
                in hidden exchange rate spreads. A worker sending $300 to their family often delivers
                less than $270 in real purchasing power.
              </p>
              <p className="text-secondary text-base leading-relaxed">
                Symmetri was built to eliminate this. Not to reduce it. To eliminate it entirely.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Traditional wire fee (avg)',            value: '5–7%',  bad: true },
                { label: 'Hidden FX spread (avg)',                value: '2–4%',  bad: true },
                { label: 'Symmetri sender fee',                   value: '$0',    bad: false },
                { label: 'Symmetri FX markup above mid-market',   value: '0%',    bad: false },
                { label: 'Your family pays at pickup',            value: '$0',    bad: false },
              ].map((row) => (
                <div key={row.label} className={`flex items-center justify-between px-5 py-3.5 rounded-xl border ${
                  row.bad
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                }`}>
                  <span className={`text-sm font-medium ${row.bad ? 'text-gray-600' : 'text-emerald-700'}`}>{row.label}</span>
                  <span className="font-extrabold text-base">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Principles ────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand text-sm font-bold uppercase tracking-widest mb-3">Our Principles</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary">How we built Symmetri.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 hover:shadow-md hover:border-gray-300 transition-all duration-300">
                <div className="text-3xl mb-5">{p.icon}</div>
                <h3 className="text-primary font-bold text-lg mb-3">{p.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Corridors ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-white border-y border-gray-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-3">Active Corridors</p>
            <h2 className="text-2xl font-extrabold text-primary">Where Symmetri operates today.</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-background">
            {CORRIDORS.map((c, i) => (
              <div
                key={`${c.from}-${c.to}`}
                className={`flex items-center justify-between px-6 py-4 gap-4 ${
                  i < CORRIDORS.length - 1 ? 'border-b border-gray-200' : ''
                } hover:bg-white transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-primary text-sm font-medium">{c.from}</span>
                  <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="text-primary text-sm font-medium">{c.to}</span>
                </div>
                <span className="text-gray-500 text-xs font-medium flex-shrink-0">{c.rail}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-xs mt-5">
            Expanding to Peru, Ecuador, and Portugal corridors in 2026.
          </p>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-extrabold text-primary mb-4">Join us.</h2>
          <p className="text-secondary text-base mb-8">
            Whether you&rsquo;re a sender, a family member, or a retail partner —
            Symmetri was built for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-7 py-3.5 bg-brand hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-brand/20 w-full sm:w-auto text-center"
            >
              Start Sending Free →
            </Link>
            <Link
              href="/partners"
              className="px-7 py-3.5 bg-white border border-gray-200 shadow-sm text-secondary hover:text-primary font-semibold text-sm rounded-xl transition-all hover:border-gray-300 w-full sm:w-auto text-center"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
