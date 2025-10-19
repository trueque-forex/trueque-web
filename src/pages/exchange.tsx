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
