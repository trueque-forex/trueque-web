'use client';
import React, { useEffect, useState } from 'react';
import { startMswOnce, isMswReady } from '../../tests/frontend/msw/browserStart';

export default function ClientMswStart({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState<boolean>(() => isMswReady());

  useEffect(() => {
    if (ready) return;

    let mounted = true;
    // Wait for MSW, but don't block forever — fallback after 3s
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('ClientMswStart: MSW start timed out, continuing render');
        setReady(true);
      }
    }, 3000);

    startMswOnce()
      .then(() => {
        if (!mounted) return;
        clearTimeout(safetyTimeout);
        setReady(true);
      })
      .catch((e) => {
        console.error('startMswOnce failed', e);
        clearTimeout(safetyTimeout);
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
    };
  }, []); // run once on mount

  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>;
  }

  if (!ready) {
    // lightweight loader to avoid a blank screen — replace with your skeleton if desired
    return <div aria-busy="true" aria-label="Starting mocks" style={{ minHeight: 16 }} />;
  }

  return <>{children}</>;
}