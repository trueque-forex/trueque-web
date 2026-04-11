import React, { useState } from 'react'
import { useRouter } from 'next/router'

type Props = {
  corridor: string
}

export default function SendForm({ corridor }: Props) {
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const router = useRouter()

  const handleContinue = () => {
    router.push({
      pathname: '/estimate',
      query: {
        corridor,
        amount,
        recipient,
      },
    })
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Send via {corridor}</h3>

      <div className="bg-gray-50 p-4 rounded shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount to Send</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Select Beneficiary</label>
          <select
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value="">Choose recipient</option>
            <option value="Ana">Ana</option>
            <option value="Carlos">Carlos</option>
            <option value="Fatima">Fatima</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleContinue}
          disabled={!amount || !recipient}
          className="flex-1 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Continue
        </button>
        <button
          onClick={async () => {
            if (!amount) return alert('Please enter an amount');
            try {
              const res = await fetch('/api/drafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  step: 'amount_selection',
                  data: {
                    amount,
                    recipient,
                    corridor
                  }
                })
              });
              if (res.ok) {
                alert('Draft saved!');
              } else {
                alert('Failed to save draft');
              }
            } catch (e) {
              console.error(e);
              alert('Error saving draft');
            }
          }}
          className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Save Draft
        </button>
      </div>
    </div>
  )
}
