<<<<<<< HEAD
// src/pages/welcome.tsx
import React from 'react';
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Welcome to Trueque</h1>
      <p>Your account was created. Complete KYC and add a beneficiary to start transacting.</p>
      <p style={{ marginTop: 12 }}>
        <Link href="/kyc/status">Check KYC status</Link> · <Link href="/app">Open app</Link>
      </p>
    </main>
  );
}
=======
// File: src/pages/welcome.tsx
import React from 'react';
import { useRouter } from 'next/router';

export default function WelcomePage(): React.JSX.Element {
  const router = useRouter();

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <header>
        <h1 style={{ fontSize: 40, margin: '0 0 12px' }}>Trueque</h1>
        <p style={{ margin: 0, color: '#555' }}>
          Trueque is a remittance application that lets users in different countries exchange currencies at the market
          exchange rate with low fees.
        </p>
      </header>

      <section style={{ marginTop: 20 }}>
        <p style={{ color: '#333', lineHeight: 1.5 }}>
          In Trueque, a user A in one country can swap their domestic currency with a user B in another country.
          Currency submitted by user A is delivered to a beneficiary designated by user B inside A’s country, and
          currency submitted by user B is delivered to a beneficiary designated by user A inside B’s country.
        </p>

        <p style={{ color: '#333', marginTop: 12 }}>
          Swapped funds can be delivered to a recipient bank account, a debit card, or a digital wallet.
        </p>
      </section>

      <nav style={{ marginTop: 28, display: 'flex', gap: 12 }}>
        <button
          onClick={() => router.push('/signup')}
          style={{
            display: 'inline-block',
            padding: '10px 18px',
            background: '#0066cc',
            color: '#fff',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer'
          }}
          aria-label="Sign up for Trueque"
        >
          Sign Up
        </button>

        <button
          onClick={() => router.push('/signin')}
          style={{
            display: 'inline-block',
            padding: '10px 18px',
            background: 'transparent',
            color: '#0066cc',
            border: '1px solid #0066cc',
            borderRadius: 6,
            cursor: 'pointer'
          }}
          aria-label="Sign in to Trueque"
        >
          Sign In
        </button>
      </nav>
    </main>
  );
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
