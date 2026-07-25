'use client';
// src/app/ClientProviders.tsx
// Thin client wrapper — makes MarketContext available to all App Router pages
// and components that need React context.
// AuthProvider is intentionally excluded here; the secure app (Pages Router)
// manages its own session via existing AuthContext.tsx.
import { MarketProvider } from '@/context/MarketContext';
import { ReactNode } from 'react';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <MarketProvider>
      {children}
    </MarketProvider>
  );
}
