// src/pages/dashboard/audit.tsx
import AuditDashboardFilters from '@/components/AuditDashboardFilters';

export default function Page() {
  const handleFilters = (filters: any) => {
    // no-op for now or implement filter logic
    console.log('filters', filters);
  };

  return <AuditDashboardFilters onFilterChange={handleFilters} />;
}
