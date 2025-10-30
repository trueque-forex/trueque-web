<<<<<<< HEAD
// src/pages/audit.tsx

import { useState } from 'react';
import AuditLog from '@/components/AuditLog';
import CorridorSelector from '@/components/CorridorSelector';
=======
import React, { useState } from 'react';
import CorridorSelector from '@/components/CorridorSelector';
import AuditLog from '@/components/AuditLog';
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

export default function AuditPage() {
  const [selectedCorridor, setSelectedCorridor] = useState<string>('');

<<<<<<< HEAD
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
=======
  const auditEntries = [
    {
      id: '1',
      corridor: 'US-MX',
      executionModel: 'OM' as 'OM' | 'TBM',
      senderCountry: 'US',
      receiverCountry: 'MX',
      senderBeneficiary: 'Alice',
      receiverBeneficiary: 'Bob',
      timestamp: new Date().toISOString(),
    },
  ];

  return (
    <>
      <CorridorSelector
        onSelect={(params: { fromIso: string; toIso: string; corridorCode: string }) =>
          setSelectedCorridor(params.corridorCode)
        }
      />
      <AuditLog entries={auditEntries} filterCorridor={selectedCorridor} />
    </>
  );
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
