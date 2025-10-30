<<<<<<< HEAD
import React, { useState } from 'react'
import SelectBeneficiary from '../components/SelectBeneficiary'
import AuditPreview from '../components/AuditPreview'
import { Beneficiary } from '../types'

const mockBeneficiaries: Beneficiary[] = [
  { id: 'ana-lopez', name: 'Ana Lopez' },
  { id: 'carlos-mendez', name: 'Carlos Mendez' },
]

export default function SendFlow() {
  const [step, setStep] = useState<'select' | 'preview'>('select')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedBeneficiary = mockBeneficiaries.find(b => b.id === selectedId)

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setStep('preview')
  }

  const handleBack = () => {
    setStep('select')
  }

  return (
    <div className="max-w-md mx-auto mt-8 space-y-6">
      {step === 'select' && (
        <SelectBeneficiary
          beneficiaries={mockBeneficiaries}
          selected={selectedId ?? ''}
          onSelect={handleSelect}
        />
      )}

      {step === 'preview' && selectedBeneficiary && (
        <AuditPreview
          corridor="BRA-US"
          amount="100"
          rate={5.2}
          sendCurrency="R$"
          receiveCurrency="US$"
          beneficiary={selectedBeneficiary}
          onBack={handleBack}
          onConfirm={() => alert('Continue to next step')}
        />
      )}
    </div>
  )
}
=======
// src/components/SendFlow.tsx
import React from 'react';
import type { Beneficiary } from '@/types.ts';

const mockBeneficiariesRaw = [
  { name: 'Ana', email: 'ana@example.com' },
  { name: 'Bruno', email: 'bruno@example.com' },
  { name: 'Carlos', phone: '+521234' },
];

export default function SendFlow() {
  const mockBeneficiaries: Partial<Beneficiary>[] = mockBeneficiariesRaw.map((b: any, i: number) => ({
    id: String(i + 1),
    name: b.name,
    phone: b.phone,
    email: b.email,
  }));

  return (
    <div>
      <h3>Send Flow (mock)</h3>
      <ul>
        {mockBeneficiaries.map((b) => (
          <li key={b.id}>{b.name} {b.phone ? `(${b.phone})` : ''} {b.email ? `- ${b.email}` : ''}</li>
        ))}
      </ul>
    </div>
  );
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
