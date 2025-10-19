import React from 'react'
import { Beneficiary } from '../types'

type Props = {
  beneficiaries: Beneficiary[]
  selected: string
  onSelect: (id: string) => void
}

export default function SelectBeneficiary({ beneficiaries, selected, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Beneficiary</h3>
      <select
        value={selected}
        onChange={e => onSelect(e.target.value)}
        className="block w-full border rounded px-2 py-1"
      >
        <option value="">-- Choose a beneficiary --</option>
        {beneficiaries.map(b => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  )
}
