// src/pages/audit.tsx
import React, { useState } from 'react';
import CorridorSelector from '@/components/CorridorSelector';
import AuditLog from '@/components/AuditLog';

export default function AuditPage() {
  const [selectedCorridor, setSelectedCorridor] = useState<string>('');

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
