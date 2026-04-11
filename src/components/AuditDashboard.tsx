// src/components/AuditDashboard.tsx
import React from 'react';
import AuditDashboardFilter from './AuditDashboardFilter';
import AuditDashboardSummary from './AuditDashboardSummary';
import AuditDashboardTable from './AuditDashboardTable';

type Offer = {
  offerAmount: number;
  id: string;
  fee?: number;
};

type Props = {
  corridor: string;
  model?: string;
  fee?: string;
  sla?: string;
  marketRate: number;
  offers: Offer[];
  debug?: boolean;
};

export default function AuditDashboard({
  corridor,
  model,
  fee,
  sla,
  marketRate,
  offers,
  debug = false,
}: Props) {
  const [from, to] = corridor.split('-');

  if (debug) {
    console.log('Audit Dashboard:');
    console.log('Corridor:', corridor);
    console.log('Model:', model);
    console.log('Fee:', fee);
    console.log('SLA:', sla);
    console.log('Market Rate:', marketRate);
    console.log('Offers:', offers);
  }

  // minimal noop handler for filter changes; update to integrate real filtering later
  function handleFilterChange(_filters: any) {
    if (debug) console.log('Audit filter changed', _filters);
  }

  return (
    <div className="mt-8 border rounded p-4 bg-white shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Audit Dashboard</h3>

      {/* Keep both old props and the newer onFilter/initial API so consumers on either side continue to work */}
      <AuditDashboardFilter
        onFilterChange={handleFilterChange}
        initial={{
          corridor,
          // Map other props to initial state if needed, or update AuditDashboardFilter to accept them directly.
          // For now, let's stick to what AuditDashboardFilter.tsx accepts in 'initial'.
          // The component signature is initial?: Partial<FilterState>;
          // FilterState has: corridor, senderKYC, beneficiaryKYC, fallback, velocity, transmitter, dateRange.
        }}
      />

      <AuditDashboardSummary marketRate={marketRate} offers={offers} />

      <AuditDashboardTable offers={offers} />
    </div>
  );
}