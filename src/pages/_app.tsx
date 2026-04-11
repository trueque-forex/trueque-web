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
        <title>Symmetri</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SwapProvider>
        <PersonaProvider>
          <Component {...pageProps} />
        </PersonaProvider>
      </SwapProvider>
    </AuthProvider>
  );
}