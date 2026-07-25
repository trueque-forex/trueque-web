// src/app/(secure-app)/checkout/page.tsx
// Structural placeholder for the App Router secure zone.
// The live checkout/review flow remains in src/pages/review.tsx (Pages Router).
import { redirect } from 'next/navigation';

export default function CheckoutPage() {
  redirect('/review');
}
