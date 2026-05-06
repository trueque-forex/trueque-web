import Head from 'next/head';

/**
 * OG Image canvas — 1200 × 630 px
 * Colors pixel-matched to src/pages/index.tsx (localhost:3000).
 * Screenshot with a headless browser at exactly this viewport → og-image.jpg
 */
export default function SocialCard() {
  return (
    <>
      <Head>
        <title>Symmetri – Social Card</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div
        style={{
          width: 1200,
          height: 630,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          backgroundColor: '#F8FAFC', /* bg-slate-50 — same as index.tsx */
        }}
      >
        {/* Decorative blurs — exact replica of the three fixed divs in index.tsx */}
        {/* top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[120px] */}
        <div style={{
          position: 'absolute', top: -126, left: -120,
          width: 600, height: 315, borderRadius: '50%',
          background: 'rgba(96,165,250,0.10)', /* blue-400/10 */
          filter: 'blur(120px)', pointerEvents: 'none',
        }} />
        {/* bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/10 blur-[120px] */}
        <div style={{
          position: 'absolute', bottom: -126, right: -120,
          width: 600, height: 315, borderRadius: '50%',
          background: 'rgba(129,140,248,0.10)', /* indigo-400/10 */
          filter: 'blur(120px)', pointerEvents: 'none',
        }} />
        {/* top-[40%] left-[50%] translate-x-[-50%] w-[80%] h-[20%] bg-slate-200/50 blur-[100px] */}
        <div style={{
          position: 'absolute', top: 252, left: '50%',
          transform: 'translateX(-50%)',
          width: 960, height: 126, borderRadius: '50%',
          background: 'rgba(226,232,240,0.50)', /* slate-200/50 */
          filter: 'blur(100px)', pointerEvents: 'none',
        }} />

        {/* Top accent line — from-blue-600 to-indigo-600 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)',
        }} />

        {/* Content */}
        <div style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          padding: '44px 72px 48px',
        }}>

          {/* TOP ROW: Logo only — badge removed */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Logo — identical to <nav> in index.tsx */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl */}
              <div style={{
                width: 48, height: 48,
                background: 'linear-gradient(135deg, #2563EB 0%, #4338CA 100%)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(37,99,235,0.30)',
                border: '1px solid #F1F5F9',
              }}>
                {/* text-white font-bold */}
                <span style={{ color: 'white', fontWeight: 700, fontSize: 26, lineHeight: 1 }}>S</span>
              </div>
              {/* text-slate-900 font-bold tracking-tight */}
              <span style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.025em' }}>
                Symmetri
              </span>
            </div>
          </div>

          {/* CENTRE: Headline block */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', gap: 20,
            padding: '0 40px',
          }}>
            {/*
             * Uniform color: text-slate-900 (#0F172A) throughout —
             * same as the dominant heading color in index.tsx.
             * No split gradient; clean and consistent.
             */}
            <h1 style={{
              fontSize: 64, fontWeight: 800,
              letterSpacing: '-0.04em', lineHeight: 1.08,
              color: '#0F172A', /* text-slate-900 */
              margin: 0,
            }}>
              Guaranteed Revenue.{' '}
              $0 Customer<br />Acquisition Cost.
            </h1>

            {/* text-slate-600 font-light — same as body copy in index.tsx */}
            <p style={{
              fontSize: 22, fontWeight: 300,
              color: '#475569', /* text-slate-600 */
              margin: 0, maxWidth: 680, lineHeight: 1.55,
            }}>
              Capturing cross-border capital via closed-loop digital vouchers.
            </p>
          </div>

          {/* BOTTOM ROW: Three pillars */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            {[
              'Zero Cash Handling',
              'Increased Basket Size',
              '100% Market Capture',
            ].map((label) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 28px',
                borderRadius: 16,
                background: 'white',           /* bg-white — same as feature cards */
                border: '1px solid #E2E8F0',   /* border-slate-200 */
                boxShadow: '0 4px 24px rgba(148,163,184,0.15)', /* shadow-lg shadow-slate-200/50 */
              }}>
                {/* Single uniform blue — from-blue-600, same accent used across index.tsx */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#2563EB', /* blue-600 */
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {/* text-slate-900 font-bold */}
                <span style={{ color: '#0F172A', fontWeight: 700, fontSize: 17 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom accent line */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent 5%, #2563EB 40%, #4F46E5 60%, transparent 95%)',
        }} />

      </div>
    </>
  );
}
