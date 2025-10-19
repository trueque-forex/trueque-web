import { useState } from 'react'

type FilterState = {
  corridor: string
  senderKYC: string
  beneficiaryKYC: string
  fallback: string
  velocity: string
  transmitter: string
  dateRange: { from: string; to: string }
}

type Props = {
  onFilterChange: (filters: FilterState) => void
  initial?: Partial<FilterState>
}

export default function AuditDashboardFilter({ onFilterChange, initial = {} }: Props) {
  const [filters, setFilters] = useState<FilterState>({
    corridor: initial.corridor ?? 'US-MX',
    senderKYC: initial.senderKYC ?? 'verified',
    beneficiaryKYC: initial.beneficiaryKYC ?? 'verified',
    fallback: initial.fallback ?? 'any',
    velocity: initial.velocity ?? 'any',
    transmitter: initial.transmitter ?? 'any',
    dateRange: initial.dateRange ?? { from: '', to: '' }
  })

  function updateFilter(key: keyof FilterState, value: any) {
    const updated = {
      ...filters,
      [key]: key === 'dateRange' ? { ...filters.dateRange, ...value } : value
    }
    setFilters(updated)
    onFilterChange(updated)
  }

  return (
    <section className="mb-4 space-y-2 text-sm">
      <h2 className="font-semibold text-gray-700">🔍 Filter Audit Logs</h2>

      <div className="grid grid-cols-2 gap-2">
        <select value={filters.corridor} onChange={e => updateFilter('corridor', e.target.value)}>
          <option value="US-MX">US → MX</option>
          <option value="MX-US">MX → US</option>
        </select>

        <select value={filters.senderKYC} onChange={e => updateFilter('senderKYC', e.target.value)}>
          <option value="verified">Sender KYC Verified</option>
          <option value="failed">Sender KYC Failed</option>
        </select>

        <select value={filters.beneficiaryKYC} onChange={e => updateFilter('beneficiaryKYC', e.target.value)}>
          <option value="verified">Beneficiary KYC Verified</option>
          <option value="failed">Beneficiary KYC Failed</option>
        </select>

        <select value={filters.fallback} onChange={e => updateFilter('fallback', e.target.value)}>
          <option value="any">Any Fallback</option>
          <option value="yes">Fallback Applied</option>
          <option value="no">No Fallback</option>
        </select>

        <select value={filters.velocity} onChange={e => updateFilter('velocity', e.target.value)}>
          <option value="any">Any Velocity</option>
          <option value="fast">Fast</option>
          <option value="slow">Slow</option>
        </select>

        <select value={filters.transmitter} onChange={e => updateFilter('transmitter', e.target.value)}>
          <option value="any">Any Transmitter</option>
          <option value="bank">Bank</option>
          <option value="wallet">Wallet</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <input
          type="date"
          value={filters.dateRange.from}
          onChange={e => updateFilter('dateRange', { from: e.target.value })}
          placeholder="From"
        />
        <input
          type="date"
          value={filters.dateRange.to}
          onChange={e => updateFilter('dateRange', { to: e.target.value })}
          placeholder="To"
        />
      </div>
    </section>
  )
}
