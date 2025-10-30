<<<<<<< HEAD
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
=======
// src/components/AuditDashboardFilter.tsx
import React, { useState, useEffect } from 'react';

type DateRange = { from: string; to: string };

export type FilterState = {
  corridor: string;
  senderKYC: string;
  beneficiaryKYC: string;
  fallback: string;
  velocity: string;
  transmitter: string;
  dateRange: DateRange;
};

type Props = {
  onFilterChange: (filters: FilterState) => void;
  initial?: Partial<FilterState>;
};

type FilterKey = keyof FilterState;
type UpdateValue = string | Partial<DateRange>;
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

export default function AuditDashboardFilter({ onFilterChange, initial = {} }: Props) {
  const [filters, setFilters] = useState<FilterState>({
    corridor: initial.corridor ?? 'US-MX',
    senderKYC: initial.senderKYC ?? 'verified',
    beneficiaryKYC: initial.beneficiaryKYC ?? 'verified',
    fallback: initial.fallback ?? 'any',
    velocity: initial.velocity ?? 'any',
    transmitter: initial.transmitter ?? 'any',
<<<<<<< HEAD
    dateRange: initial.dateRange ?? { from: '', to: '' }
  })

  function updateFilter(key: keyof FilterState, value: any) {
    const updated = {
      ...filters,
      [key]: key === 'dateRange' ? { ...filters.dateRange, ...value } : value
    }
    setFilters(updated)
    onFilterChange(updated)
=======
    dateRange: initial.dateRange ?? { from: '', to: '' },
  });

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  function updateFilter(key: FilterKey, value: UpdateValue) {
    setFilters((prev) =>
      key === 'dateRange'
        ? { ...prev, dateRange: { ...prev.dateRange, ...(value as Partial<DateRange>) } }
        : ({ ...prev, [key]: value as string } as FilterState)
    );
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
  }

  return (
    <section className="mb-4 space-y-2 text-sm">
<<<<<<< HEAD
      <h2 className="font-semibold text-gray-700">🔍 Filter Audit Logs</h2>

      <div className="grid grid-cols-2 gap-2">
        <select value={filters.corridor} onChange={e => updateFilter('corridor', e.target.value)}>
=======
      <h2 className="font-semibold text-gray-700">Filter Audit Logs</h2>

      <div className="grid grid-cols-2 gap-2">
        <select id="corridor-select" value={filters.corridor} onChange={(e) => updateFilter('corridor', e.target.value)}>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
          <option value="US-MX">US → MX</option>
          <option value="MX-US">MX → US</option>
        </select>

<<<<<<< HEAD
        <select value={filters.senderKYC} onChange={e => updateFilter('senderKYC', e.target.value)}>
=======
        <select id="sender-kyc-select" value={filters.senderKYC} onChange={(e) => updateFilter('senderKYC', e.target.value)}>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
          <option value="verified">Sender KYC Verified</option>
          <option value="failed">Sender KYC Failed</option>
        </select>

<<<<<<< HEAD
        <select value={filters.beneficiaryKYC} onChange={e => updateFilter('beneficiaryKYC', e.target.value)}>
=======
        <select id="beneficiary-kyc-select" value={filters.beneficiaryKYC} onChange={(e) => updateFilter('beneficiaryKYC', e.target.value)}>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
          <option value="verified">Beneficiary KYC Verified</option>
          <option value="failed">Beneficiary KYC Failed</option>
        </select>

<<<<<<< HEAD
        <select value={filters.fallback} onChange={e => updateFilter('fallback', e.target.value)}>
=======
        <select id="fallback-select" value={filters.fallback} onChange={(e) => updateFilter('fallback', e.target.value)}>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
          <option value="any">Any Fallback</option>
          <option value="yes">Fallback Applied</option>
          <option value="no">No Fallback</option>
        </select>

<<<<<<< HEAD
        <select value={filters.velocity} onChange={e => updateFilter('velocity', e.target.value)}>
=======
        <select id="velocity-select" value={filters.velocity} onChange={(e) => updateFilter('velocity', e.target.value)}>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
          <option value="any">Any Velocity</option>
          <option value="fast">Fast</option>
          <option value="slow">Slow</option>
        </select>

<<<<<<< HEAD
        <select value={filters.transmitter} onChange={e => updateFilter('transmitter', e.target.value)}>
=======
        <select id="transmitter-select" value={filters.transmitter} onChange={(e) => updateFilter('transmitter', e.target.value)}>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
          <option value="any">Any Transmitter</option>
          <option value="bank">Bank</option>
          <option value="wallet">Wallet</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
<<<<<<< HEAD
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
=======
        <input id="from-date" type="date" value={filters.dateRange.from} onChange={(e) => updateFilter('dateRange', { from: e.target.value })} aria-label="From date" />
        <input id="to-date" type="date" value={filters.dateRange.to} onChange={(e) => updateFilter('dateRange', { to: e.target.value })} aria-label="To date" />
      </div>
    </section>
  );
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
