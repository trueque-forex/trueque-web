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