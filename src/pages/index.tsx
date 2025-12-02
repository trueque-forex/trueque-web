// src/pages/index.tsx
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../lib/apiFetch';

export default function IndexPage(): null {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    apiFetch('/api/profile', { method: 'GET' })
      .then(({ json }) => {
        if (!mounted) return;
        const signedIn = Boolean((json as any)?.userId);
        router.replace(signedIn ? '/app' : '/welcome');
      })
      .catch(() => {
        if (!mounted) return;
        router.replace('/welcome');
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  return null;
}