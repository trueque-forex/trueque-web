// src/app/layout.tsx
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import ClientProviders from './ClientProviders';
import SiteNav from './_components/SiteNav';
import SiteFooter from './_components/SiteFooter';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Symmetri — Stop Sending Cash. Start Swapping Value.',
    template: '%s | Symmetri',
  },
  description:
    'Send a digital voucher to your family abroad. Zero hidden fees. Real exchange rates. Redeemable at their neighborhood store — no smartphone required.',
  keywords: [
    'Symmetri', 'send money Mexico', 'voucher remittance', 'cross-border voucher',
    'OXXO voucher', 'zero fee transfer', 'Colombia send money', 'Guatemala remittance',
  ],
  metadataBase: new URL('https://symmetri.org'),
  openGraph: {
    siteName: 'Symmetri',
    url: 'https://symmetri.org',
    type: 'website',
    title: 'Symmetri — Stop Sending Cash. Start Swapping Value.',
    description: 'Send a digital voucher to your family. Zero hidden fees. Real exchange rates.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Symmetri' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Symmetri — Stop Sending Cash. Start Swapping Value.',
    description: 'Send a digital voucher to your family. Zero hidden fees. Real rates. No hidden spreads.',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className={`${plusJakarta.className} bg-background text-primary antialiased min-h-screen`}>
        <ClientProviders>
          <SiteNav />
          <div className="pt-16">{/* offset for fixed nav */}
            {children}
          </div>
          <SiteFooter />
        </ClientProviders>
      </body>
    </html>
  );
}
