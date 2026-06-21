import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';

// Self-contained interceptor to prevent AuthContext from redirecting unauthenticated users
// on this specific page without having to modify the global AuthContext.tsx file.
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    if (window.location.pathname === '/' && typeof args[0] === 'string' && args[0].includes('/api/auth/session')) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return originalFetch(...args);
  };
}

export default function B2BLandingPage() {
  const { originMarket, setOriginMarket } = useMarket();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isES = originMarket === 'ES';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-500/20 selection:text-blue-900 overflow-hidden">
      <Head>
        <title>Symmetri B2B - Enterprise Cross-Border Capital</title>
        <meta name="description" content="Routing Cross-Border Capital Directly to Your Registers." />
      </Head>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[80%] h-[20%] rounded-full bg-slate-200/50 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md border border-slate-100">
            <span className="text-white font-bold text-2xl leading-none">S</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Symmetri</span>
        </div>
        <div className="flex items-center gap-6">
          {mounted && (
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setOriginMarket('US')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${!isES ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                🇺🇸 US
              </button>
              <button 
                onClick={() => setOriginMarket('ES')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${isES ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                🇪🇸 ES
              </button>
            </div>
          )}
          <a
            href="mailto:partners@symmetri.org?subject=Inquiry:%20Phase%201%20Symmetri%20Pilot"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-300 px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            Become a Partner
          </a>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-6">
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
            <div className="pt-8"></div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 leading-[1.3] pb-2">
              Intercepting cross-border capital <br className="hidden md:block" /> before it becomes physical cash.
            </h1>
            
            <p className="text-base md:text-lg text-slate-600 max-w-3xl font-light leading-relaxed">
              Powering zero-CAC synthetic liquidity orchestration for enterprise retail networks across Latin America and the Caribbean.
            </p>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">Enterprise Infrastructure for Retail</h2>
              <p className="text-base text-slate-500 max-w-2xl mx-auto font-light">Built for scale, security, and maximum market efficiency across borders.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {/* Feature 1 */}
              <div className="group relative p-1 rounded-3xl bg-gradient-to-b from-slate-100 to-transparent hover:from-blue-100 transition-colors duration-500">
                <div className="h-full p-10 rounded-[23px] bg-white backdrop-blur-xl border border-slate-100 flex flex-col items-start relative overflow-hidden shadow-lg shadow-slate-200/50">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-colors duration-500"></div>
                  
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 border border-blue-100 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2.626c.825 0 1.599-.406 2.048-1.068L9.26 9.42c.45-.662 1.223-1.068 2.048-1.068H14.69c.825 0 1.599.406 2.048 1.068l1.586 2.512c.45.662 1.223 1.068 2.048 1.068H23M3 13a2 2 0 002 2h14a2 2 0 002-2M3 13v6a2 2 0 002 2h14a2 2 0 002-2v-6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Optimized Working Capital (OWC)</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-light">
                    Gain predictive visibility into cross-border capital inflows, drastically reducing safety stock requirements and optimizing your supply chain inventory.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative p-1 rounded-3xl bg-gradient-to-b from-slate-100 to-transparent hover:from-indigo-100 transition-colors duration-500">
                <div className="h-full p-10 rounded-[23px] bg-white backdrop-blur-xl border border-slate-100 flex flex-col items-start relative overflow-hidden shadow-lg shadow-slate-200/50">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors duration-500"></div>

                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 border border-indigo-100 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Zero Cash Handling</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-light">
                    Eliminate vaulting, transport costs, and physical security risks. Symmetri transactions are 100% digital from the sender's origin directly to your point of sale.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative p-1 rounded-3xl bg-gradient-to-b from-slate-100 to-transparent hover:from-purple-100 transition-colors duration-500">
                <div className="h-full p-10 rounded-[23px] bg-white backdrop-blur-xl border border-slate-100 flex flex-col items-start relative overflow-hidden shadow-lg shadow-slate-200/50">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl group-hover:bg-purple-100 transition-colors duration-500"></div>

                  <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8 border border-purple-100 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">100% Market Capture</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-light">
                    Lock cross-border funds directly into your retail ecosystem. Vouchers guarantee spend within your network, preventing leakage to competitors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scale Section */}
        <section className="py-32 px-6 relative border-y border-slate-200 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-50 via-white to-white pointer-events-none"></div>
          <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-10 border border-blue-100 shadow-sm">
               <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
            <h2 className="text-2xl md:text-4xl font-light tracking-wide leading-tight text-slate-500 mb-10">
              Connecting {mounted && isES ? 'European' : 'US'} capital to retail networks across <br className="hidden md:block py-2" />
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mt-4 block pb-2">
                {mounted && isES ? 'Colombia, the Dominican Republic, and LatAm.' : 'Mexico, Guatemala, and the Dominican Republic.'}
              </span>
            </h2>

            <div className="relative group mt-8">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500 group-hover:duration-200"></div>
              <a
                href="mailto:partners@symmetri.org?subject=Inquiry:%20Phase%201%20Symmetri%20Pilot"
                className="relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-slate-900 rounded-xl border border-slate-800 hover:bg-slate-800 transition-all duration-300 shadow-xl shadow-slate-900/20 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Become a Partner
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-50 py-12 px-6 text-center border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center mb-6 border border-slate-300">
            <span className="text-slate-600 font-bold text-xl leading-none">S</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Symmetri. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
