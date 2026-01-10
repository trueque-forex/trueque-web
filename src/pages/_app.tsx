// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import dynamic from 'next/dynamic';
import { SwapProvider } from '../context/SwapContext';
import { AuthProvider } from '../context/AuthContext';


const ClientMswStart = dynamic(() => import('../components/ClientMswStart'), { ssr: false });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <title>Trueque</title>
      </Head>

      {/* Wrap the entire app */}
      <AuthProvider>
        <SwapProvider>
          <Component {...pageProps} />
        </SwapProvider>
      </AuthProvider>
    </>
  );
}