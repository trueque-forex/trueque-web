// src/pages/audit.tsx

import { useState } from 'react';
import AuditLog from '@/components/AuditLog';
import CorridorSelector from '@/components/CorridorSelector';

export default function AuditPage() {
  const [selectedCorridor, setSelectedCorridor] = useState<string>('');

  // Sample static entries for now—replace with backend fetch later
  const auditEntries = [
    {
      id: 'tx001',
      corridor: 'BR-PT',
      executionModel: 'OM',
      senderCountry: 'Brazil',
      receiverCountry: 'Portugal',
      senderBeneficiary: 'Maria Oliveira',
      receiverBeneficiary: 'João Silva',
      timestamp: '2025-10-06T17:42:00Z'
    },
    {
      id: 'tx002',
      corridor: 'CO-EC',
      executionModel: 'TBM',
      senderCountry: 'Colombia',
      receiverCountry: 'Ecuador',
      senderBeneficiary: 'Luis Torres',
      receiverBeneficiary: 'Ana Gómez',
      timestamp: '2025-10-06T17:45:00Z'
    }
    // Add more entries as needed
  ];

  return (
    <main className="min-h-screen px-6 py-10 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>
      <CorridorSelector onSelect={setSelectedCorridor} />
      <AuditLog entries={auditEntries} filterCorridor={selectedCorridor} />
    </main>
  );
}
