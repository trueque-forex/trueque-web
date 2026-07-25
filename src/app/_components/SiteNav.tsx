'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMarket } from '@/context/MarketContext';

export default function SiteNav() {
  const { originMarket, setOriginMarket } = useMarket();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'About',        href: '/about' },
    { label: 'For Partners', href: '/partners' },
    { label: 'FAQ',          href: '/faq' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-brand rounded-[10px] flex items-center justify-center shadow-md shadow-brand/20">
            <span className="text-white font-extrabold text-sm leading-none">S</span>
          </div>
          <span className="text-primary font-bold text-lg tracking-tight">Symmetri</span>
        </Link>

        {/* ── Desktop links ────────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-5">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-secondary hover:text-primary text-sm font-medium transition-colors duration-200"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ── Right cluster ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Market selector */}
          <div className="hidden sm:flex items-center bg-gray-100 border border-gray-200 rounded-lg p-[3px] gap-[3px]">
            {(['US', 'ES'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setOriginMarket(m)}
                className={`px-2.5 py-1 rounded-[7px] text-[11px] font-bold transition-all duration-200 ${
                  originMarket === m
                    ? 'bg-white text-primary shadow-sm border border-gray-200/60'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {m === 'US' ? '🇺🇸 US' : '🇪🇸 ES'}
              </button>
            ))}
          </div>

          {/* Sign In */}
          <Link
            href="/signin"
            className="hidden sm:block text-secondary hover:text-primary text-sm font-medium transition-colors duration-200 px-2"
          >
            Sign In
          </Link>

          {/* Primary CTA */}
          <Link
            href="/signup"
            className="px-4 py-2 bg-brand hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors duration-200 shadow-sm whitespace-nowrap"
          >
            Get Started
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
            className="md:hidden text-secondary hover:text-primary p-1 ml-1 transition-colors"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 border-t border-gray-200 px-4 py-5 space-y-1">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block text-secondary hover:text-primary py-2.5 text-sm font-medium transition-colors border-b border-gray-100"
            >
              {label}
            </Link>
          ))}

          {/* Mobile market + auth */}
          <div className="pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs font-medium">Sending from:</span>
              <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg p-[3px] gap-[3px]">
                {(['US', 'ES'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setOriginMarket(m)}
                    className={`px-3 py-1 rounded-[7px] text-xs font-bold transition-all ${
                      originMarket === m ? 'bg-white text-primary shadow-sm' : 'text-secondary'
                    }`}
                  >
                    {m === 'US' ? '🇺🇸 US' : '🇪🇸 ES'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/signin"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2.5 text-secondary border border-gray-200 rounded-lg text-sm font-medium hover:border-gray-300 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2.5 bg-brand text-white rounded-lg text-sm font-bold"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
