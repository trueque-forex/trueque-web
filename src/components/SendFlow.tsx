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
