import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import { SwapProvider } from '@/context/SwapContext';
import { PersonaProvider } from '@/context/PersonaContext';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>Symmetri | Technological Swap Currency App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Symmetri converts cross-border purchasing power into closed-loop digital vouchers. We optimize working capital and eliminate legacy cash-handling costs for retail partners." />
        <meta name="keywords" content="Symmetri, swap currency app, closed-loop vouchers, cross-border capital, retail OWC optimization, Werner Galvis" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://symmetri.org/" />
        <meta property="og:title" content="Symmetri | Enterprise Retail Partnerships" />
        <meta property="og:description" content="Routing cross-border capital directly to your registers via closed-loop digital vouchers." />
        <meta property="og:site_name" content="Symmetri" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content="https://symmetri.org/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://symmetri.org/" />
        <meta name="twitter:title" content="Symmetri | Enterprise Retail Partnerships" />
        <meta name="twitter:description" content="Routing cross-border capital directly to your registers via closed-loop digital vouchers." />
        <meta name="twitter:image" content="https://symmetri.org/og-image.jpg" />
      </Head>
      <SwapProvider>
        <PersonaProvider>
          <Component {...pageProps} />
        </PersonaProvider>
      </SwapProvider>
    </AuthProvider>
  );
}