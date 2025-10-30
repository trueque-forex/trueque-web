import React from 'react'

type AuditEntry = {
  id: string
  corridor: string
  executionModel: 'OM' | 'TBM'
  senderCountry: string
  receiverCountry: string
  senderBeneficiary: string
  receiverBeneficiary: string
  timestamp: string
}

type AuditLogProps = {
  entries: AuditEntry[]
  filterCorridor?: string
  debug?: boolean
  onEntryClick?: (entry: AuditEntry) => void
}

export default function AuditLog({ entries, filterCorridor, debug = false, onEntryClick }: AuditLogProps) {
  const filtered = filterCorridor
    ? entries.filter(e => e.corridor === filterCorridor)
    : entries

  if (debug) console.log('Filtered audit entries:', filtered)

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Audit Log</h2>
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No matches found for this corridor.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Timestamp</th>
              <th className="p-2">Corridor</th>
              <th className="p-2">Model</th>
              <th className="p-2">Sender → Beneficiary</th>
              <th className="p-2">Receiver → Beneficiary</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => (
              <tr key={entry.id} className="border-t">
                <td
                  className="p-2 cursor-pointer hover:underline"
                  onClick={() => onEntryClick?.(entry)}
                >
                  {new Date(entry.timestamp).toLocaleString()}
                </td>
                <td className="p-2">{entry.corridor}</td>
                <td className="p-2">{entry.executionModel}</td>
                <td className="p-2">
                  {entry.senderCountry} → {entry.receiverBeneficiary}
                </td>
                <td className="p-2">
                  {entry.receiverCountry} → {entry.senderBeneficiary}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-4 text-xs text-gray-500 italic">
        All transfers are domestic. Trueque does not touch funds. No money crosses borders.
      </div>
    </section>
  )
}
