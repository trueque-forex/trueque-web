'use client';
import { useState } from 'react';

const FAQ_ITEMS = [
  // ── Speed & Process ────────────────────────────────────────────────────
  {
    category: 'Speed & Process',
    q: 'How fast does my family receive the voucher?',
    a: 'The voucher code is generated and sent to your family via SMS within seconds of your payment being confirmed. For card payments, this is typically under 30 seconds. For bank transfers (RTP/FedNow), it is also near-instant.',
  },
  {
    category: 'Speed & Process',
    q: 'Does my family need to be at the store when I send the voucher?',
    a: 'No. Your family receives the code via SMS and can use it any time before it expires (usually 30 days). They can walk into the store whenever is convenient for them.',
  },
  {
    category: 'Speed & Process',
    q: 'Can I cancel a voucher after sending it?',
    a: 'Once you send the voucher code to your family, it cannot be cancelled. This is because the capital has already been committed to the retailer network. Please double-check the amount and retailer before confirming.',
  },

  // ── Your Family ────────────────────────────────────────────────────────
  {
    category: 'Your Family',
    q: 'What if my family doesn\'t have a smartphone?',
    a: 'No problem at all. The voucher code is sent as a standard SMS text message — no internet connection, no app, no data plan required. Any basic phone that can receive text messages will work. Your family can even write the code down on paper.',
  },
  {
    category: 'Your Family',
    q: 'Does my family need a bank account?',
    a: 'No. Your family needs absolutely nothing — no bank account, no credit card, no app, no registration. They simply receive a text with a code and bring it to the store.',
  },
  {
    category: 'Your Family',
    q: 'How does the cashier scan the code?',
    a: 'Your family shows the code on their phone screen (or on paper if they wrote it down). The cashier scans it exactly like a gift card or barcode — using their existing scanner at the register. There is no new hardware or training required on the store side.',
  },
  {
    category: 'Your Family',
    q: 'What happens if the store is closed when my family arrives?',
    a: 'The code remains valid for 30 days. Your family can return to any participating location of the same retailer during business hours.',
  },

  // ── Fees & Rates ───────────────────────────────────────────────────────
  {
    category: 'Fees & Rates',
    q: 'What is the real cost to me as the sender?',
    a: 'You pay the voucher amount plus any payment method fee (card processing, bank transfer, etc.). We show you the exact total before you confirm — nothing is hidden. Your family pays zero.',
  },
  {
    category: 'Fees & Rates',
    q: 'Does Symmetri take a cut from the exchange rate?',
    a: 'No, never. We always use the live, independent mid-market rate. We do not add a spread or markup to the exchange rate. What you see is what your family gets.',
  },
  {
    category: 'Fees & Rates',
    q: 'What is the minimum amount I can send?',
    a: 'The minimum voucher amount is $20.00 USD (or equivalent in EUR). This ensures the transaction is economically viable for everyone involved.',
  },

  // ── Security & Trust ───────────────────────────────────────────────────
  {
    category: 'Security & Trust',
    q: 'Is my payment information safe?',
    a: 'Yes. Symmetri never stores your card number or bank credentials. All payments are processed by licensed, regulated payment providers (similar to how your bank processes a card payment). We handle the routing logic — not the financial custody.',
  },
  {
    category: 'Security & Trust',
    q: 'Does Symmetri hold my money at any point?',
    a: 'No. This is our core guarantee. Symmetri is a technology platform — a digital rail. We orchestrate the flow of value between you and your family\'s store. Your funds pass through licensed payment providers; they never sit in a Symmetri account.',
  },
  {
    category: 'Security & Trust',
    q: 'Why do you need to verify my identity (KYC)?',
    a: 'Financial regulations require that platforms facilitating value transfers verify the identity of senders. This protects you, your family, and the integrity of the network. The process is quick: you submit a photo ID and we typically respond within 24 hours.',
  },

  // ── Availability ───────────────────────────────────────────────────────
  {
    category: 'Countries & Stores',
    q: 'Which countries can my family be in?',
    a: 'Currently: Mexico, Guatemala, Dominican Republic, and Colombia. We are expanding to more countries in 2026. If you send from Spain, your family can be in Colombia or the Dominican Republic.',
  },
  {
    category: 'Countries & Stores',
    q: 'Which stores does the voucher work at?',
    a: 'We are currently developing partnerships with major retail networks across Mexico, Guatemala, Colombia, and the Dominican Republic. Our official participating retailers will be announced soon.',
  },
];

const CATEGORIES = [...new Set(FAQ_ITEMS.map((f) => f.category))];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const displayed = activeCategory === 'All'
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter((f) => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-background text-primary">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-brand/5 blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-gray-200 mb-6">
            <span className="text-brand text-xs font-bold uppercase tracking-widest">Sender FAQ</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-4 tracking-tight">
            Your questions, answered.
          </h1>
          <p className="text-secondary text-base sm:text-lg">
            Everything a sender needs to know before sending their first voucher.
          </p>
        </div>
      </section>

      {/* ── Category filter ───────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pb-8">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
                activeCategory === cat
                  ? 'bg-brand text-white border-transparent'
                  : 'bg-white border border-gray-200 text-secondary hover:text-primary hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Accordion ─────────────────────────────────────────────────── */}
      <section className="pb-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {displayed.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? 'bg-white border-brand shadow-md'
                    : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                  aria-expanded={isOpen}
                  id={`faq-btn-${i}`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${
                      isOpen ? 'bg-blue-50 text-brand' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.category}
                    </span>
                    <span className={`font-semibold text-base transition-colors ${isOpen ? 'text-primary' : 'text-primary/80'}`}>
                      {item.q}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6">
                    <div className="ml-[calc(2.5rem+1rem)] border-t border-gray-100 pt-4">
                      <p className="text-secondary text-sm leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto mt-14 text-center">
          <p className="text-gray-500 text-sm mb-6">Still have a question? We&rsquo;re here to help.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:partners@symmetri.org?subject=User%20Question"
              className="px-6 py-3 bg-white border border-gray-200 shadow-sm text-secondary hover:text-primary text-sm font-medium rounded-xl transition-all hover:border-gray-300"
            >
              Email Us
            </a>
            <a
              href="/signin"
              className="px-6 py-3 bg-brand hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-brand/20"
            >
              Ready to send? Create your free account →
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
