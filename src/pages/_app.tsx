// src/pages/_app.tsx
import type { AppProps } from 'next/app';
<<<<<<< HEAD
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <title>Trueque</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
=======
import React from 'react';

// Minimal, safe _app that avoids server-only side-effects during client builds.
// If you need dev-only bootstrap, load it from a server-only entrypoint or
// require it conditionally inside API routes, not here.
export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
}