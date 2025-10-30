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

export default function AuditDashboardFilter({ onFilterChange, initial = {} }: Props) {
  const [filters, setFilters] = useState<FilterState>({
    corridor: initial.corridor ?? 'US-MX',
    senderKYC: initial.senderKYC ?? 'verified',
    beneficiaryKYC: initial.beneficiaryKYC ?? 'verified',
    fallback: initial.fallback ?? 'any',
    velocity: initial.velocity ?? 'any',
    transmitter: initial.transmitter ?? 'any',
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
  }

  return (
    <section className="mb-4 space-y-2 text-sm">
      <h2 className="font-semibold text-gray-700">Filter Audit Logs</h2>

      <div className="grid grid-cols-2 gap-2">
        <select id="corridor-select" value={filters.corridor} onChange={(e) => updateFilter('corridor', e.target.value)}>
          <option value="US-MX">US → MX</option>
          <option value="MX-US">MX → US</option>
        </select>

        <select id="sender-kyc-select" value={filters.senderKYC} onChange={(e) => updateFilter('senderKYC', e.target.value)}>
          <option value="verified">Sender KYC Verified</option>
          <option value="failed">Sender KYC Failed</option>
        </select>

        <select id="beneficiary-kyc-select" value={filters.beneficiaryKYC} onChange={(e) => updateFilter('beneficiaryKYC', e.target.value)}>
          <option value="verified">Beneficiary KYC Verified</option>
          <option value="failed">Beneficiary KYC Failed</option>
        </select>

        <select id="fallback-select" value={filters.fallback} onChange={(e) => updateFilter('fallback', e.target.value)}>
          <option value="any">Any Fallback</option>
          <option value="yes">Fallback Applied</option>
          <option value="no">No Fallback</option>
        </select>

        <select id="velocity-select" value={filters.velocity} onChange={(e) => updateFilter('velocity', e.target.value)}>
          <option value="any">Any Velocity</option>
          <option value="fast">Fast</option>
          <option value="slow">Slow</option>
        </select>

        <select id="transmitter-select" value={filters.transmitter} onChange={(e) => updateFilter('transmitter', e.target.value)}>
          <option value="any">Any Transmitter</option>
          <option value="bank">Bank</option>
          <option value="wallet">Wallet</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <input id="from-date" type="date" value={filters.dateRange.from} onChange={(e) => updateFilter('dateRange', { from: e.target.value })} aria-label="From date" />
        <input id="to-date" type="date" value={filters.dateRange.to} onChange={(e) => updateFilter('dateRange', { to: e.target.value })} aria-label="To date" />
      </div>
    </section>
  );
}