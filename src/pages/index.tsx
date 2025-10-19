// src/pages/index.tsx
import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Welcome to Trueque</h1>
      <p>Quick links to get started:</p>
      <ul>
        <li><Link href="/signup">Sign up</Link></li>
        <li><Link href="/signin">Sign in</Link></li>
        <li><Link href="/kyc/status">KYC status</Link></li>
        <li><Link href="/offers">Offers</Link></li>
        <li><Link href="/offers/create">Create offer (maker)</Link></li>
      </ul>
    </main>
  );
}