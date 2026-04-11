// src/components/SendFlow.tsx
import React, { useState } from 'react';
import SelectBeneficiary from './SelectBeneficiary';
import AuditPreview from './AuditPreview';
import type { Beneficiary } from '../types';

const mockBeneficiaries: Partial<Beneficiary>[] = [
  { id: 'ana-lopez', name: 'Ana Lopez', phone: '+521234' },
  { id: 'carlos-mendez', name: 'Carlos Mendez', email: 'carlos@example.com' },
];

export default function SendFlow() {
  const [step, setStep] = useState<'select' | 'preview'>('select');
  const [selected, setSelected] = useState<{ id?: string; name?: string } | null>(null);

  const handleSelect = (b: { id?: string; name?: string } | null) => {
    setSelected(b);
    if (b) setStep('preview');
  };

  const handleBack = () => setStep('select');

  return (
    <div className="max-w-md mx-auto mt-8 space-y-6">
      {step === 'select' && (
        <SelectBeneficiary
          beneficiaries={mockBeneficiaries.map((b) => ({ id: b.id, name: b.name || 'Unknown' }))}
          value={selected}
          onSelect={handleSelect}
          placeholder="Choose a beneficiary to send to"
        />
      )}

      {step === 'preview' && selected && (
        <AuditPreview
          corridor="BR-USD"
          amount="100"
          rate={5.2}
          sendCurrency="R$"
          receiveCurrency="US$"
          beneficiary={{ id: selected.id, name: selected.name } as Beneficiary}
          deliverySpeed="48-hours"
          onBack={handleBack}
          onContinue={() => alert('Continue to next step')}
        />
      )}
    </div>
  );
}