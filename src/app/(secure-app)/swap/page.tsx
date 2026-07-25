// src/app/(secure-app)/swap/page.tsx
// Structural placeholder for the App Router secure zone.
// The live voucher creation flow remains in src/pages/voucher.tsx (Pages Router).
// This page redirects to the existing working flow rather than duplicating it.
import { redirect } from 'next/navigation';

export default function SwapPage() {
  // Redirect to the live Pages Router voucher flow until App Router migration is complete.
  redirect('/voucher');
}
