<<<<<<< HEAD
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
=======
// File: src/pages/index.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../lib/apiFetch';

export default function IndexPage(): null {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    apiFetch('/api/profile', { method: 'GET' })
      .then(({ json }) => {
        if (!mounted) return;
        const signedIn = Boolean((json as any)?.userId);
        // Signed-in users go straight to the app; others go to the welcome screen
        router.replace(signedIn ? '/app' : '/welcome');
      })
      .catch(() => {
        if (!mounted) return;
        router.replace('/welcome');
      })
      .finally(() => {
        if (!mounted) return;
        setChecked(true);
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  // Render nothing on root; navigation happens immediately
  return null;
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
