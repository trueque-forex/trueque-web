import { useRouter } from 'next/router'

export default function CorridorPage() {
  const router = useRouter()
  const { userId } = router.query

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-green-700">🌐 Corridor Activated</h1>
      <p className="text-gray-700">
        Your identity has been verified. You’re now ready to transact in your selected corridor.
      </p>
      <p className="text-lg font-semibold">✅ Your Trueque ID:</p>
      <p className="text-xl font-mono text-blue-700">{userId}</p>
      <p className="text-sm text-gray-600">
        This ID is used for all matches, audit logs, and compliance checks.
      </p>
      <button
        onClick={() => router.push('/estimate')}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Continue to Estimate
      </button>
    </main>
  )
}
