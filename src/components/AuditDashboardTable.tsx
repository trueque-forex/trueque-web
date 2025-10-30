<<<<<<< HEAD
=======
// src/components/AuditDashboardTable.tsx
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
import { useState } from 'react'
import KYCRetryModal from '@/components/KYCRetryModal'

type AuditEntry = {
  exchangeId: string
  sender: {
    userId: string
    fullName: string
    amountPaid: number
    verifiedIdentity: boolean
  }
  receiver: {
    amountReceived: number
    beneficiary: {
      name: string
      verifiedOwnership: boolean
    }
  }
  status: string
  fallback?: boolean
  timestamp: string
}

type Props = {
<<<<<<< HEAD
  entries: AuditEntry[]
  debug?: boolean
}

export default function AuditDashboardTable({ entries, debug = false }: Props) {
=======
  entries?: AuditEntry[]
  offers?: any[]
  debug?: boolean
}

export default function AuditDashboardTable({ entries, offers, debug = false }: Props) {
  const rows: AuditEntry[] = (entries as AuditEntry[]) ?? (offers as any[] ?? [])
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
  const [showModal, setShowModal] = useState(false)
  const [retryUserId, setRetryUserId] = useState<string | null>(null)

  function handleRetryClick(userId: string) {
    setRetryUserId(userId)
    setShowModal(true)
    if (debug) console.log('Retrying KYC for user:', userId)
  }

<<<<<<< HEAD
  function handleRetryComplete({ verified, failureReason }: { verified: boolean; failureReason?: string }) {
    console.log('Retry result:', verified ? '✅ Verified' : `❌ Failed: ${failureReason}`)
    // Optionally refetch entries or show toast
=======
  // allow failureReason to be string | null | undefined
  function handleRetryComplete({ verified, failureReason }: { verified: boolean; failureReason?: string | null }) {
    console.log('Retry result:', verified ? '✅ Verified' : `❌ Failed: ${failureReason}`)
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
  }

  return (
    <>
      <table className="w-full text-sm border mt-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1 text-left">Exchange ID</th>
            <th className="px-2 py-1 text-left">Sender</th>
            <th className="px-2 py-1 text-left">Beneficiary</th>
            <th className="px-2 py-1 text-left">Amount</th>
            <th className="px-2 py-1 text-left">Status</th>
            <th className="px-2 py-1 text-left">KYC</th>
            <th className="px-2 py-1 text-left">Fallback</th>
            <th className="px-2 py-1 text-left">Timestamp</th>
            <th className="px-2 py-1 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
<<<<<<< HEAD
          {entries.map(entry => (
=======
          {rows.map(entry => (
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
            <tr key={entry.exchangeId} className="border-t">
              <td className="px-2 py-1">{entry.exchangeId}</td>
              <td className="px-2 py-1">{entry.sender.fullName}</td>
              <td className="px-2 py-1">{entry.receiver.beneficiary.name}</td>
              <td className="px-2 py-1">
                {entry.sender.amountPaid} → {entry.receiver.amountReceived}
              </td>
              <td className="px-2 py-1">{entry.status}</td>
              <td className="px-2 py-1">
                Sender: {entry.sender.verifiedIdentity ? '✅' : '❌'}<br />
                Beneficiary: {entry.receiver.beneficiary.verifiedOwnership ? '✅' : '❌'}
              </td>
              <td className="px-2 py-1">{entry.fallback ? '✅' : '❌'}</td>
              <td className="px-2 py-1">{new Date(entry.timestamp).toLocaleString()}</td>
              <td className="px-2 py-1">
                {!entry.sender.verifiedIdentity && (
                  <button
                    className="text-blue-600 underline"
                    onClick={() => handleRetryClick(entry.sender.userId)}
                  >
                    Retry KYC
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && retryUserId && (
        <KYCRetryModal
          userId={retryUserId}
          onClose={() => setShowModal(false)}
          onRetryComplete={handleRetryComplete}
        />
      )}
    </>
  )
<<<<<<< HEAD
}
=======
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
