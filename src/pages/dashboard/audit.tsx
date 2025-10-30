<<<<<<< HEAD
import { useState, useEffect } from "react";
import AuditDashboardSummary from "@/components/AuditDashboardSummary";
import AuditDashboardFilters from "@/components/AuditDashboardFilters";
import AuditDashboardTable from "@/components/AuditDashboardTable";

export default function AuditDashboardPage() {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  async function fetchAuditEntries() {
    const res = await fetch(`/api/audit?limit=${pageSize}&offset=${page * pageSize}`);
    const data = await res.json();
    setEntries(data.entries || []);
  }

  useEffect(() => {
    fetchAuditEntries();
  }, [page]);

  return (
    <main>
      <h1>📋 Audit Dashboard</h1>

      {entries.length === 0 ? (
        <p>Loading audit entries…</p>
      ) : (
        <>
          <AuditDashboardSummary entries={entries} />
          <AuditDashboardFilters />
          <AuditDashboardTable entries={entries} />

          <div className="pagination">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>⬅ Prev</button>
            <span>Page {page + 1}</span>
            <button onClick={() => setPage(p => p + 1)}>Next ➡</button>
          </div>
        </>
      )}
    </main>
  );
}
=======
// src/pages/dashboard/audit.tsx
import AuditDashboardFilters from '@/components/AuditDashboardFilters';

export default function Page() {
  const handleFilters = (filters: any) => {
    // no-op for now or implement filter logic
    console.log('filters', filters);
  };

  return <AuditDashboardFilters onFilterChange={handleFilters} />;
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
