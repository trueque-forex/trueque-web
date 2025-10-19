import React from 'react'

type Props = {
  amount: string
  onChange: (value: string) => void
  step?: number
}

export default function AmountInput({ amount, onChange, step = 1 }: Props) {
  return (
    <div className="space-y-1">
      <label className="block font-medium">Amount to Send</label>
      <input
        type="number"
        min="0"
        step={step}
        value={amount}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2"
        placeholder="Enter amount"
      />
    </div>
  )
}
