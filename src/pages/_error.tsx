// src/pages/_error.tsx
import React from 'react';
import { NextPageContext } from 'next';

type Props = {
  statusCode?: number;
};

function ErrorPage({ statusCode }: Props) {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Something went wrong</h1>
      {statusCode ? (
        <p>An error {statusCode} occurred on the server.</p>
      ) : (
        <p>An error occurred on the client.</p>
      )}
      <p style={{ marginTop: '1rem' }}>
        Please try refreshing the page or return to{' '}
        <a href="/" style={{ color: '#2563eb' }}>
          the home page
        </a>.
      </p>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404;
  return { statusCode };
};

<<<<<<< HEAD
export default ErrorPage;
=======
export default ErrorPage;
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
