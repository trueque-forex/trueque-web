// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import dynamic from 'next/dynamic';

const ClientMswStart = dynamic(() => import('../components/ClientMswStart'), { ssr: false });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <title>Trueque</title>
      </Head>

      {/* Wrap the entire app so pages don't run until MSW is ready */}
      <ClientMswStart>
        <Component {...pageProps} />
      </ClientMswStart>
    </>
  );
}