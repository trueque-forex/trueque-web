<<<<<<< HEAD
// src/pages/exchange.tsx
import { useRouter } from 'next/router'
import AuditPreview from '@/components/AuditPreview'
import Link from 'next/link'

const corridorMap = {
  'BR-PT': { label: '🇧🇷 Brazil → 🇵🇹 Portugal', fee: '2.6%', model: 'OM' },
  'GT-MX': { label: '🇬🇹 Guatemala → 🇲🇽 Mexico', fee: '2.4%', model: 'TBM' },
  'CO-VE': { label: '🇨🇴 Colombia → 🇻🇪 Venezuela', fee: '2.6%', model: 'TBM' }
}

export default function ExchangePage() {
  const { query } = useRouter()
  const corridor = corridorMap[query.corridor as string]

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold mb-4">🔁 Exchange Preview</h1>

      {corridor ? (
        <div className="mb-6 border rounded p-4 bg-white shadow-sm text-sm">
          <p><strong>Corridor:</strong> {corridor.label}</p>
          <p><strong>Fee:</strong> {corridor.fee}</p>
          <p><strong>Model:</strong> {corridor.model}</p>
        </div>
      ) : (
        <p className="text-red-600">❌ Invalid corridor</p>
      )}

      <AuditPreview debug />

      <Link href="/">
        <button className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          ← Back to Homepage
        </button>
      </Link>
    </main>
  )
}
=======
import React from 'react';
import { useRouter } from 'next/router';
import AuditPreview from '@/components/AuditPreview';

export default function ExchangePage() {
  const router = useRouter();
  const { corridor, amount, rate, sendCurrency, receiveCurrency, sender, recipient } = router.query;

  const corridorStr =
    typeof corridor === 'string' ? corridor : Array.isArray(corridor) ? corridor[0] : 'USD-MXP';

  const safeAmount = typeof amount === 'string' ? Number(amount) : typeof amount === 'number' ? amount : 0;
  const safeRate = typeof rate === 'string' ? Number(rate) : typeof rate === 'number' ? rate : 0;

  return (
    <div>
      <h1>Exchange</h1>

      <AuditPreview
        corridor={corridorStr}
        amount={(Number.isFinite(safeAmount) ? safeAmount : 0).toString()}
        rate={Number.isFinite(safeRate) ? safeRate : 0}
        sendCurrency={typeof sendCurrency === 'string' ? sendCurrency : String(sendCurrency ?? 'USD')}
        receiveCurrency={typeof receiveCurrency === 'string' ? receiveCurrency : String(receiveCurrency ?? 'MXN')}
        sender={typeof sender === 'string' ? sender : String(sender ?? 'unknown')}
        recipient={typeof recipient === 'string' ? recipient : String(recipient ?? 'unknown')}
      />
    </div>
  );
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
